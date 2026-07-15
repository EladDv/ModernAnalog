'use strict';

var clayConfig = require('./config');
var settingsSchema = require('./settings');

var SETTINGS_KEY = 'modern-analog-settings';
var WEATHER_CACHE_KEY = 'modern-analog-weather-cache';
var WEATHER_MAX_AGE = 30 * 60 * 1000;
var WEATHER_REQUEST_TIMEOUT = 15 * 1000;

function loadSettings() {
  var saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch (error) {
    console.log('Could not load settings: ' + error);
  }
  return settingsSchema.sanitizeSettings(saved);
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function configurationHtml(settings) {
  var fields = '';
  clayConfig.forEach(function(section) {
    if (section.type !== 'section') { return; }
    fields += '<section><h2>' + escapeHtml(section.items[0].defaultValue) + '</h2>';
    section.items.slice(1).forEach(function(item) {
      var value = settings[item.messageKey];
      fields += '<label><span>' + escapeHtml(item.label) + '</span>';
      if (item.type === 'select') {
        fields += '<select name="' + item.messageKey + '">';
        item.options.forEach(function(option) {
          fields += '<option value="' + option.value + '"' +
            (Number(value) === Number(option.value) ? ' selected' : '') + '>' +
            escapeHtml(option.label) + '</option>';
        });
        fields += '</select>';
      } else if (item.type === 'color') {
        fields += '<input type="color" name="' + item.messageKey + '" value="#' +
          escapeHtml(value) + '">';
      }
      fields += '</label>';
    });
    fields += '</section>';
  });

  var script = "document.getElementById('settings').onsubmit=function(e){e.preventDefault();" +
    "var d={},x=this.elements;for(var i=0;i<x.length;i++){if(x[i].name){" +
    "d[x[i].name]=x[i].type==='color'?x[i].value.slice(1):Number(x[i].value);}}" +
    "location.href='pebblejs://close#'+encodeURIComponent(JSON.stringify(d));};";
  return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<style>*{box-sizing:border-box}body{margin:0;background:#10131a;color:#f7f8fa;font:16px -apple-system,sans-serif}' +
    'header{padding:24px 18px 12px;font-size:28px;font-weight:700;color:#58a6ff}' +
    'section{margin:12px;background:#1b202b;border-radius:12px;overflow:hidden}h2{margin:0;padding:12px 14px;color:#8b98aa;font-size:13px;text-transform:uppercase}' +
    'label{min-height:54px;padding:9px 14px;border-top:1px solid #303744;display:flex;align-items:center;justify-content:space-between;gap:12px}' +
    'select{max-width:58%;font-size:16px}input[type=color]{width:52px;height:34px;border:0;background:none}' +
    'button{display:block;width:calc(100% - 24px);margin:18px 12px 30px;padding:14px;border:0;border-radius:12px;background:#0868ff;color:white;font-size:18px;font-weight:700}</style>' +
    '</head><body><header>Modern Analog</header><form id="settings">' + fields +
    '<button type="submit">Save</button></form><script>' + script + '</script></body></html>';
}

Pebble.addEventListener('showConfiguration', function() {
  var html = configurationHtml(loadSettings());
  Pebble.openURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
});

Pebble.addEventListener('webviewclosed', function(event) {
  if (!event || !event.response) { return; }
  try {
    var settings = settingsSchema.sanitizeSettings(JSON.parse(decodeURIComponent(event.response)));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    sendMessage(settingsSchema.toMessage(settings));
  } catch (error) {
    console.log('Configuration failed: ' + error);
  }
});

var phoneBattery = null;
var batteryListenerAttached = false;
var cachedWeather = loadWeatherCache();
var lastWeatherUpdate = cachedWeather ? cachedWeather.timestamp : 0;
var weatherRequestPending = false;
var messageQueue = [];
var messageSending = false;

function sendNextMessage() {
  if (messageSending || messageQueue.length === 0) { return; }
  messageSending = true;
  var message = messageQueue.shift();
  Pebble.sendAppMessage(message, function() {
    messageSending = false;
    sendNextMessage();
  }, function(error) {
    console.log('Send failed: ' + JSON.stringify(error));
    messageSending = false;
    sendNextMessage();
  });
}

function sendMessage(message) {
  messageQueue.push(message);
  sendNextMessage();
}

function loadWeatherCache() {
  try {
    var weather = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || 'null');
    if (weather && isFinite(Number(weather.temperature)) && weather.condition) {
      return {
        temperature: Math.round(Number(weather.temperature)),
        condition: String(weather.condition).toUpperCase(),
        timestamp: isFinite(Number(weather.timestamp)) ? Number(weather.timestamp) : 0
      };
    }
  } catch (error) {
    console.log('Could not load weather cache: ' + error);
  }
  return null;
}

function publishCachedWeather() {
  if (!cachedWeather) { return; }
  sendMessage({
    WEATHER_TEMPERATURE: cachedWeather.temperature,
    WEATHER_CONDITION: cachedWeather.condition
  });
}

function cacheWeather(temperature, condition) {
  cachedWeather = {
    temperature: Math.round(Number(temperature)),
    condition: String(condition).toUpperCase(),
    timestamp: Date.now()
  };
  lastWeatherUpdate = cachedWeather.timestamp;
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cachedWeather));
  } catch (error) {
    console.log('Could not save weather cache: ' + error);
  }
}

function batteryPercent(battery) {
  if (!battery || !isFinite(Number(battery.level))) { return -1; }
  return Math.max(0, Math.min(100, Math.round(Number(battery.level) * 100)));
}

function publishBattery(battery) {
  var percent = batteryPercent(battery);
  if (percent < 0) {
    sendMessage({ PHONE_BATTERY: -1 });
    return;
  }

  phoneBattery = battery;
  sendMessage({ PHONE_BATTERY: percent });

  if (!batteryListenerAttached && battery.addEventListener) {
    battery.addEventListener('levelchange', function() {
      sendMessage({ PHONE_BATTERY: batteryPercent(phoneBattery) });
    });
    batteryListenerAttached = true;
  }
}

function readPhoneBattery() {
  if (phoneBattery) {
    publishBattery(phoneBattery);
    return;
  }
  if (typeof navigator === 'undefined') {
    sendMessage({ PHONE_BATTERY: -1 });
    return;
  }

  var legacyBattery = navigator.battery || navigator.webkitBattery || navigator.mozBattery;
  if (legacyBattery) {
    publishBattery(legacyBattery);
  } else if (typeof navigator.getBattery === 'function') {
    navigator.getBattery().then(publishBattery, function() {
      sendMessage({ PHONE_BATTERY: -1 });
    });
  } else {
    sendMessage({ PHONE_BATTERY: -1 });
  }
}

function weatherCondition(code) {
  code = Number(code);
  if (code === 0) { return 'CLEAR'; }
  if (code >= 1 && code <= 3) { return 'CLOUDY'; }
  if (code === 45 || code === 48) { return 'FOG'; }
  if (code >= 51 && code <= 67) { return 'RAIN'; }
  if (code >= 71 && code <= 77) { return 'SNOW'; }
  if (code >= 80 && code <= 82) { return 'RAIN'; }
  if (code >= 95) { return 'STORM'; }
  return 'WEATHER';
}

function finishWeatherRequest() {
  weatherRequestPending = false;
}

function fetchWeather(force) {
  if (weatherRequestPending || (!force && Date.now() - lastWeatherUpdate < WEATHER_MAX_AGE)) {
    return;
  }
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return;
  }

  weatherRequestPending = true;
  navigator.geolocation.getCurrentPosition(function(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + latitude +
      '&longitude=' + longitude + '&current=temperature_2m,weather_code';
    var request = new XMLHttpRequest();
    request.onload = function() {
      finishWeatherRequest();
      if (request.status < 200 || request.status >= 300) { return; }
      try {
        var response = JSON.parse(request.responseText);
        var current = response.current;
        if (!current || !isFinite(Number(current.temperature_2m)) ||
            !isFinite(Number(current.weather_code))) {
          throw new Error('Incomplete weather response');
        }
        var temperature = Math.round(Number(current.temperature_2m));
        var condition = weatherCondition(current.weather_code);
        cacheWeather(temperature, condition);
        sendMessage({
          WEATHER_TEMPERATURE: temperature,
          WEATHER_CONDITION: condition
        });
      } catch (error) {
        console.log('Weather parse failed: ' + error);
      }
    };
    request.onerror = finishWeatherRequest;
    request.ontimeout = finishWeatherRequest;
    request.open('GET', url, true);
    request.timeout = WEATHER_REQUEST_TIMEOUT;
    request.send();
  }, function(error) {
    finishWeatherRequest();
    console.log('Location failed: ' + JSON.stringify(error));
  }, { timeout: WEATHER_REQUEST_TIMEOUT, maximumAge: WEATHER_MAX_AGE });
}

function refreshPhoneData(forceWeather) {
  readPhoneBattery();
  fetchWeather(forceWeather);
}

Pebble.addEventListener('ready', function() {
  console.log('Modern Analog companion ready');
  sendMessage(settingsSchema.toMessage(loadSettings()));
  publishCachedWeather();
  refreshPhoneData(false);
  setInterval(function() {
    refreshPhoneData(false);
  }, WEATHER_MAX_AGE);
});

Pebble.addEventListener('appmessage', function(event) {
  if (event.payload && event.payload.REQUEST_PHONE_DATA !== undefined) {
    refreshPhoneData(false);
  }
});
