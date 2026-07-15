import Poco from "commodetto/Poco";
import Battery from "embedded:sensor/Battery";
import Message from "pebble/message";
import Vibes from "pebble/vibes";
import Resource from "Resource";
import parseBMF from "commodetto/parseBMF";
import parseRLE from "commodetto/parseRLE";

const render = new Poco(screen, { displayListLength: 24576 });
const timeFont = new render.Font("Bitham-Bold", 42);
const dateFont = new render.Font("Gothic-Bold", 18);
const hourFont = new render.Font("Gothic-Bold", 18);
const weatherFont = new render.Font("Gothic-Bold", 18);
function loadFont(name, size) {
  const font = parseBMF(new Resource(name + "-" + size + ".fnt"));
  font.bitmap = parseRLE(new Resource(name + "-" + size + "-alpha.bm4"));
  return font;
}
const iconFont = loadFont("fa-remapped", 18);
const pebbleIconFont = loadFont("mdi-pebble", 18);
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MESSAGE_KEYS = new Map([
  ["PHONE_BATTERY", 10000],
  ["REQUEST_PHONE_DATA", 10001],
  ["WEATHER_TEMPERATURE", 10002],
  ["WEATHER_CONDITION", 10003],
  ["TOP_LEFT_TYPE", 10004],
  ["TOP_RIGHT_TYPE", 10005],
  ["BOTTOM_LEFT_TYPE", 10006],
  ["BOTTOM_RIGHT_TYPE", 10007],
  ["COLOR_BACKGROUND", 10008],
  ["COLOR_TEXT", 10009],
  ["COLOR_CLOCK", 10010],
  ["COLOR_MINUTE_PROGRESS", 10011],
  ["COLOR_TOP_LEFT", 10012],
  ["COLOR_TOP_RIGHT", 10013],
  ["COLOR_BOTTOM_LEFT", 10014],
  ["COLOR_BOTTOM_RIGHT", 10015],
  ["TEMPERATURE_UNIT", 10016],
  ["TIME_FORMAT", 10017]
]);
const SETTINGS_STORAGE_KEY = "modern-analog-watch-settings";
const WEATHER_STORAGE_KEY = "modern-analog-weather";
const SLOT_TYPE = {
  WEATHER: 1,
  HEALTH: 2,
  STEPS: 3,
  HEART_RATE: 4,
  WATCH_BATTERY: 5,
  PHONE_BATTERY: 6
};
const DEFAULT_SETTINGS = {
  TOP_LEFT_TYPE: SLOT_TYPE.WEATHER,
  TOP_RIGHT_TYPE: SLOT_TYPE.HEALTH,
  BOTTOM_LEFT_TYPE: SLOT_TYPE.WATCH_BATTERY,
  BOTTOM_RIGHT_TYPE: SLOT_TYPE.PHONE_BATTERY,
  TEMPERATURE_UNIT: 0,
  TIME_FORMAT: 0,
  COLOR_BACKGROUND: 0x000000,
  COLOR_TEXT: 0xFFFFFF,
  COLOR_CLOCK: 0x0055FF,
  COLOR_MINUTE_PROGRESS: 0xFF0000,
  COLOR_TOP_LEFT: 0x0055FF,
  COLOR_TOP_RIGHT: 0x0055FF,
  COLOR_BOTTOM_LEFT: 0x0055FF,
  COLOR_BOTTOM_RIGHT: 0x0055FF
};
let watchPercent = 0;
let phonePercent = -1;
let temperature = null;
let weatherCondition = "";
let stepCount = -1;
let heartRate = -1;
let lastDate = new Date();
let drawPending = false;
let phoneRequestSent = false;
let settings = {};
let phoneConnected = Boolean(watch.connected.pebblekit);

Object.keys(DEFAULT_SETTINGS).forEach(key => settings[key] = DEFAULT_SETTINGS[key]);
const cachedWeather = loadJSON(WEATHER_STORAGE_KEY);
if (cachedWeather) setWeather(cachedWeather.temperature, cachedWeather.condition);
const savedSettings = loadJSON(SETTINGS_STORAGE_KEY);
if (savedSettings) {
  Object.keys(DEFAULT_SETTINGS).forEach(key => {
    if (savedSettings[key] !== undefined) settings[key] = Number(savedSettings[key]);
  });
}
sanitizeSettings();

function loadJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  }
  catch (error) {
    return null;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  }
  catch (error) {
  }
}

function sanitizeColor(value, fallback) {
  const color = Number(value);
  return isFinite(color) && color >= 0 && color <= 0xFFFFFF ? Math.round(color) : fallback;
}

function sanitizeSettings() {
  if (Number(settings.TOP_LEFT_TYPE) < SLOT_TYPE.WEATHER ||
      Number(settings.TOP_LEFT_TYPE) > SLOT_TYPE.HEART_RATE)
    settings.TOP_LEFT_TYPE = DEFAULT_SETTINGS.TOP_LEFT_TYPE;
  if (Number(settings.TOP_RIGHT_TYPE) < SLOT_TYPE.WEATHER ||
      Number(settings.TOP_RIGHT_TYPE) > SLOT_TYPE.HEART_RATE)
    settings.TOP_RIGHT_TYPE = DEFAULT_SETTINGS.TOP_RIGHT_TYPE;
  if (Number(settings.BOTTOM_LEFT_TYPE) < SLOT_TYPE.WATCH_BATTERY ||
      Number(settings.BOTTOM_LEFT_TYPE) > SLOT_TYPE.PHONE_BATTERY)
    settings.BOTTOM_LEFT_TYPE = DEFAULT_SETTINGS.BOTTOM_LEFT_TYPE;
  if (Number(settings.BOTTOM_RIGHT_TYPE) < SLOT_TYPE.WATCH_BATTERY ||
      Number(settings.BOTTOM_RIGHT_TYPE) > SLOT_TYPE.PHONE_BATTERY)
    settings.BOTTOM_RIGHT_TYPE = DEFAULT_SETTINGS.BOTTOM_RIGHT_TYPE;
  if (Number(settings.TEMPERATURE_UNIT) < 0 || Number(settings.TEMPERATURE_UNIT) > 2)
    settings.TEMPERATURE_UNIT = DEFAULT_SETTINGS.TEMPERATURE_UNIT;
  if (Number(settings.TIME_FORMAT) < 0 || Number(settings.TIME_FORMAT) > 1)
    settings.TIME_FORMAT = DEFAULT_SETTINGS.TIME_FORMAT;
  Object.keys(DEFAULT_SETTINGS).forEach(key => {
    if (key.indexOf("COLOR_") === 0)
      settings[key] = sanitizeColor(settings[key], DEFAULT_SETTINGS[key]);
  });
}

function saveSettings() {
  saveJSON(SETTINGS_STORAGE_KEY, settings);
}

function saveWeather() {
  if (temperature === null || !weatherCondition) return;
  saveJSON(WEATHER_STORAGE_KEY, { temperature, condition: weatherCondition });
}

function setWeather(value, condition) {
  if (value === null || value === undefined || value === "") return false;
  const numericTemperature = Number(value);
  const normalizedCondition = condition ? String(condition).toUpperCase().slice(0, 12) : "";
  if (!isFinite(numericTemperature) || numericTemperature < -100 || numericTemperature > 100 ||
      !normalizedCondition) return false;
  temperature = Math.round(numericTemperature);
  weatherCondition = normalizedCondition;
  return true;
}

function batteryPercent(value) {
  const percent = Number(value);
  if (!isFinite(percent) || percent < 0) return -1;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

function formattedTemperature() {
  if (Number(settings.TEMPERATURE_UNIT) === 1)
    return String(Math.round(temperature * 9 / 5 + 32)) + "°F";
  if (Number(settings.TEMPERATURE_UNIT) === 2)
    return String(Math.round(temperature + 273.15)) + "K";
  return String(Math.round(temperature)) + "°C";
}

function colorFromValue(value) {
  value = Number(value) >>> 0;
  return render.makeColor((value >> 16) & 255, (value >> 8) & 255, value & 255);
}

function refreshHealth() {
  try {
    const steps = Number(Natives.health_steps_today());
    const heart = Number(Natives.health_heart_rate());
    stepCount = isFinite(steps) && steps >= 0 ? Math.round(steps) : -1;
    heartRate = isFinite(heart) && heart > 0 ? Math.round(heart) : -1;
  }
  catch (error) {
    stepCount = -1;
    heartRate = -1;
  }
}

function isInsideDial(x, y, inset, radius, edgeToEdge) {
  const left = edgeToEdge ? 0 : inset;
  const top = edgeToEdge ? 0 : inset;
  const right = edgeToEdge ? render.width - 1 : render.width - inset;
  const bottom = edgeToEdge ? render.height - 1 : render.height - inset;
  if (x < left || x > right || y < top || y > bottom) return false;

  const nearestX = Math.max(left + radius, Math.min(right - radius, x));
  const nearestY = Math.max(top + radius, Math.min(bottom - radius, y));
  const cornerX = x - nearestX;
  const cornerY = y - nearestY;
  return cornerX * cornerX + cornerY * cornerY <= radius * radius;
}

// All dial elements advance by clock angle. The ray is intersected with the
// rounded screen edge, and its inverse vector always points to the watch
// center. Every fifth minute sample therefore shares a ray with an hour label.
function dialSample(index, count, edgeToEdge) {
  const centerX = render.width / 2;
  const centerY = render.height / 2;
  const angle = index * Math.PI * 2 / count;
  const directionX = Math.sin(angle);
  const directionY = -Math.cos(angle);
  const inset = render.width * 0.025;
  const radius = Math.min(render.width, render.height) * 0.08;
  let inside = 0;
  let outside = Math.max(render.width, render.height);

  // Binary search keeps the same math for straight edges and rounded corners.
  for (let pass = 0; pass < 12; pass++) {
    const distance = (inside + outside) / 2;
    if (isInsideDial(centerX + directionX * distance,
      centerY + directionY * distance, inset, radius, edgeToEdge)) inside = distance;
    else outside = distance;
  }

  return {
    x: centerX + directionX * inside,
    y: centerY + directionY * inside,
    nx: -directionX,
    ny: -directionY
  };
}

function drawCentered(text, font, color, x, y) {
  render.drawText(text, font, color, x - render.getTextWidth(text, font) / 2, y);
}

function getTrackedTextWidth(text, font, tracking) {
  let width = 0;
  for (let index = 0; index < text.length; index++)
    width += render.getTextWidth(text[index], font);
  return width + Math.max(0, text.length - 1) * tracking;
}

function drawTrackedText(text, font, color, x, y, tracking) {
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    render.drawText(character, font, color, x, y);
    x += render.getTextWidth(character, font) + tracking;
  }
}

function drawBatteryBar(x, y, filled, color) {
  const bodyWidth = 35;
  const height = 12;
  render.frameRoundRect(x, y, bodyWidth, height, color, 2);
  render.fillRectangle(color, x + bodyWidth, y + 3, 2, 6);
  for (let segment = 0; segment < 5; segment++) {
    const sx = x + 2 + segment * 6;
    if (segment < filled) render.fillRectangle(color, sx, y + 2, 5, 8);
    else render.frameRoundRect(sx, y + 2, 5, 8, color, 0);
  }
}

function drawMinuteRim(minuteNow, clockColor, progressColor) {
  for (let minute = 0; minute < 60; minute++) {
    const point = dialSample(minute, 60, true);
    const major = minute % 5 === 0;
    const length = major ? 8 : 5;
    render.drawLine(
      Math.round(point.x), Math.round(point.y),
      Math.round(point.x + point.nx * length),
      Math.round(point.y + point.ny * length),
      minute > 0 && minute <= minuteNow ? progressColor : clockColor, major ? 2 : 1);
  }
}

function drawHours(activeHour, clockColor, textColor) {
  for (let hour = 0; hour < 12; hour++) {
    const point = dialSample(hour, 12, false);
    const inset = hour % 3 === 0 ? 20 : 24;
    drawCentered(String(hour || 12), hourFont, hour === activeHour ? textColor : clockColor,
      Math.round(point.x + point.nx * inset),
      Math.round(point.y + point.ny * inset - hourFont.height / 2));
  }
}

function drawTime(now, color) {
  const twelveHour = Number(settings.TIME_FORMAT) === 1;
  const hour = twelveHour ? (now.getHours() % 12 || 12) : now.getHours();
  const hourText = twelveHour ? String(hour) : String(hour).padStart(2, "0");
  const time = hourText + ":" + String(now.getMinutes()).padStart(2, "0");
  const y = render.height * 0.419;
  if (!twelveHour) {
    drawCentered(time, timeFont, color, render.width / 2, y);
    return;
  }

  const suffix = now.getHours() < 12 ? "AM" : "PM";
  const gap = 3;
  const timeWidth = render.getTextWidth(time, timeFont);
  const suffixWidth = render.getTextWidth(suffix, dateFont);
  const x = (render.width - timeWidth - gap - suffixWidth) / 2;
  render.drawText(time, timeFont, color, x, y);
  render.drawText(suffix, dateFont, color, x + timeWidth + gap, y + 17);
}

function drawSlot(type, left, bottom, color, accentColor, icons) {
  const anchorX = render.width * (left ? 0.24 : 0.76);
  const primaryY = render.height * (bottom ? 0.684 : 0.197);
  const secondaryY = render.height * (bottom ? 0.763 : 0.277);
  const singleY = render.height * (bottom ? 0.724 : 0.237);
  const batteryY = render.height * (bottom ? 0.742 : 0.217);
  const gap = render.width * 0.02;

  function metric(value, icon, y, tracking, iconColor, metricIconFont, fog) {
    metricIconFont = metricIconFont || iconFont;
    const valueWidth = tracking ? getTrackedTextWidth(value, weatherFont, tracking) :
      render.getTextWidth(value, weatherFont);
    const iconWidth = render.getTextWidth(icon, metricIconFont);
    const textX = left ? anchorX + iconWidth / 2 + gap :
      anchorX - iconWidth / 2 - gap - valueWidth;
    if (tracking) drawTrackedText(value, weatherFont, color, textX, y, tracking);
    else render.drawText(value, weatherFont, color, textX, y);
    icons.push({
      character: icon,
      font: metricIconFont,
      fog,
      color: iconColor === undefined ? color : iconColor,
      x: anchorX,
      y
    });
    return {
      left: left ? anchorX - iconWidth / 2 : textX,
      right: left ? textX + valueWidth : anchorX + iconWidth / 2
    };
  }

  if (type === SLOT_TYPE.WEATHER) {
    if (temperature === null || !weatherCondition) return;
    const fontIcon = weatherCondition === "CLEAR" ? "A" :
      (weatherCondition === "CLOUDY" ? "F" :
        (weatherCondition === "FOG" ? "F" :
          (weatherCondition === "RAIN" ? "H" :
            (weatherCondition === "SNOW" ? "I" :
              (weatherCondition === "STORM" ? "J" : "F")))));
    const bounds = metric(formattedTemperature(), fontIcon, primaryY, 0,
      undefined, undefined, weatherCondition === "FOG");
    render.drawText(weatherCondition, weatherFont, color, bounds.left, secondaryY);
  }
  else if (type === SLOT_TYPE.HEALTH) {
    metric(heartRate > 0 ? String(heartRate) : "--", "B", primaryY, 0, accentColor);
    metric(stepCount >= 0 ? String(stepCount) : "--", "C", secondaryY, 1);
  }
  else if (type === SLOT_TYPE.STEPS) {
    metric(stepCount >= 0 ? String(stepCount) : "--", "C", singleY, 1);
  }
  else if (type === SLOT_TYPE.HEART_RATE) {
    metric(heartRate > 0 ? String(heartRate) : "--", "B", singleY, 0, accentColor);
  }
  else if (type === SLOT_TYPE.WATCH_BATTERY || type === SLOT_TYPE.PHONE_BATTERY) {
    const phone = type === SLOT_TYPE.PHONE_BATTERY;
    const character = phone ? (phoneConnected ? "E" : "B") : "A";
    const font = phone && phoneConnected ? iconFont : pebbleIconFont;
    const iconWidth = render.getTextWidth(character, font);
    const batteryWidth = 37;
    const batteryGap = render.width * 0.025;
    const batteryX = left ? anchorX + iconWidth / 2 + batteryGap :
      anchorX - iconWidth / 2 - batteryGap - batteryWidth;
    const percent = phone ? phonePercent : watchPercent;
    if (!phone || phoneConnected) {
      drawBatteryBar(batteryX, batteryY,
        percent < 0 ? 0 : Math.max(0, Math.min(5, Math.ceil(percent / 20))), color);
    }
    icons.push({
      character,
      font,
      color,
      x: anchorX,
      y: batteryY - (phone ? 3 : 4)
    });
  }
}

function draw(event) {
  const now = event && event.date ? event.date : lastDate;
  if (event && event.date) lastDate = event.date;
  const backgroundColor = colorFromValue(settings.COLOR_BACKGROUND);
  const textColor = colorFromValue(settings.COLOR_TEXT);
  const clockColor = colorFromValue(settings.COLOR_CLOCK);
  const progressColor = colorFromValue(settings.COLOR_MINUTE_PROGRESS);
  const heartColor = colorFromValue(0xFF0000);
  const icons = [];

  render.begin();
  render.fillRectangle(backgroundColor, 0, 0, render.width, render.height);
  drawMinuteRim(now.getMinutes(), clockColor, progressColor);
  render.end();

  render.begin();
  drawHours(now.getHours() % 12, clockColor, textColor);
  // Bitham's visible glyphs sit slightly above its line-box center, so use a
  // small optical correction to center the actual numerals on the display.
  drawTime(now, textColor);
  const date = DAYS[now.getDay()] + " " + String(now.getDate()).padStart(2, "0") + " " + MONTHS[now.getMonth()];
  drawCentered(date, dateFont, clockColor, render.width / 2, render.height * 0.59);
  drawSlot(Number(settings.TOP_LEFT_TYPE), true, false,
    colorFromValue(settings.COLOR_TOP_LEFT), heartColor, icons);
  drawSlot(Number(settings.TOP_RIGHT_TYPE), false, false,
    colorFromValue(settings.COLOR_TOP_RIGHT), heartColor, icons);
  drawSlot(Number(settings.BOTTOM_LEFT_TYPE), true, true,
    colorFromValue(settings.COLOR_BOTTOM_LEFT), heartColor, icons);
  drawSlot(Number(settings.BOTTOM_RIGHT_TYPE), false, true,
    colorFromValue(settings.COLOR_BOTTOM_RIGHT), heartColor, icons);
  render.end();

  icons.forEach(icon => {
    render.begin(Math.max(0, Math.round(icon.x - 15)), Math.max(0, Math.round(icon.y - 4)), 30, 26);
    if (icon.fog) {
      for (let row = 0; row < 3; row++) {
        const y = icon.y + 6 + row * 4;
        render.drawLine(icon.x - 8, y, icon.x - 4, y - 2, icon.color, 1);
        render.drawLine(icon.x - 4, y - 2, icon.x, y, icon.color, 1);
        render.drawLine(icon.x, y, icon.x + 4, y + 2, icon.color, 1);
        render.drawLine(icon.x + 4, y + 2, icon.x + 8, y, icon.color, 1);
      }
    }
    else drawCentered(icon.character, icon.font, icon.color, icon.x, icon.y);
    render.end();
  });
}

function requestDraw() {
  if (drawPending) return;
  drawPending = true;
  setTimeout(() => {
    drawPending = false;
    draw();
  }, 0);
}

const battery = new Battery({});
watchPercent = batteryPercent(battery.sample().percent);
refreshHealth();
watch.addEventListener("minutechange", event => {
  watchPercent = batteryPercent(battery.sample().percent);
  refreshHealth();
  draw(event);
});
watch.addEventListener("connected", () => {
  const connected = Boolean(watch.connected.pebblekit);
  if (phoneConnected && !connected) Vibes.doublePulse();
  phoneConnected = connected;
  draw();
});

const message = new Message({
  // A full settings update is comfortably below 512 bytes, while the watch
  // only sends a single integer request. Avoid Alloy's 8.2 KB maximum buffers.
  input: 512,
  output: 64,
  keys: MESSAGE_KEYS,
  onReadable() {
    let settingsChanged = false;
    let weatherReceived = false;
    let incomingTemperature = temperature;
    let incomingCondition = weatherCondition;
    this.read().forEach((value, key) => {
      if (key === "PHONE_BATTERY") phonePercent = batteryPercent(value);
      else if (key === "WEATHER_TEMPERATURE") {
        incomingTemperature = value;
        weatherReceived = true;
      }
      else if (key === "WEATHER_CONDITION") {
        incomingCondition = value;
        weatherReceived = true;
      }
      else if (DEFAULT_SETTINGS[key] !== undefined) {
        settings[key] = Number(value);
        settingsChanged = true;
      }
    });
    if (settingsChanged) {
      sanitizeSettings();
      saveSettings();
    }
    if (weatherReceived && setWeather(incomingTemperature, incomingCondition)) saveWeather();
    requestDraw();
  },
  onWritable() {
    if (phoneRequestSent) return;
    phoneRequestSent = true;
    this.write(new Map([["REQUEST_PHONE_DATA", 1]]));
  }
});
