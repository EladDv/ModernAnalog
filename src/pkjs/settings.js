'use strict';

var TOP_SLOT_OPTIONS = [
  { label: 'Weather', value: 1 },
  { label: 'Health (heart + steps)', value: 2 },
  { label: 'Steps', value: 3 },
  { label: 'Heart rate', value: 4 }
];

var BOTTOM_SLOT_OPTIONS = [
  { label: 'Watch battery', value: 5 },
  { label: 'Phone battery', value: 6 }
];

var TEMPERATURE_UNIT_OPTIONS = [
  { label: 'Celsius (°C)', value: 0 },
  { label: 'Fahrenheit (°F)', value: 1 },
  { label: 'Kelvin (K)', value: 2 }
];

var TIME_FORMAT_OPTIONS = [
  { label: '24-hour', value: 0 },
  { label: '12-hour (AM/PM)', value: 1 }
];

var DEFAULTS = {
  TOP_LEFT_TYPE: 1,
  TOP_RIGHT_TYPE: 2,
  BOTTOM_LEFT_TYPE: 5,
  BOTTOM_RIGHT_TYPE: 6,
  TEMPERATURE_UNIT: 0,
  TIME_FORMAT: 0,
  COLOR_BACKGROUND: '000000',
  COLOR_TEXT: 'FFFFFF',
  COLOR_CLOCK: '0055FF',
  COLOR_MINUTE_PROGRESS: 'FF0000',
  COLOR_TOP_LEFT: '0055FF',
  COLOR_TOP_RIGHT: '0055FF',
  COLOR_BOTTOM_LEFT: '0055FF',
  COLOR_BOTTOM_RIGHT: '0055FF'
};

var TOP_SLOT_TYPES = TOP_SLOT_OPTIONS.map(function(option) { return option.value; });
var BOTTOM_SLOT_TYPES = BOTTOM_SLOT_OPTIONS.map(function(option) { return option.value; });
var SETTING_KEYS = Object.keys(DEFAULTS);
var COLOR_KEYS = SETTING_KEYS.filter(function(key) { return key.indexOf('COLOR_') === 0; });

function normalizeColor(value, fallback) {
  if (typeof value === 'number' && isFinite(value)) {
    return ('000000' + ((value >>> 0) & 0xFFFFFF).toString(16)).slice(-6).toUpperCase();
  }

  var color = String(value === undefined || value === null ? '' : value)
    .replace(/^#/, '').toUpperCase();
  return /^[0-9A-F]{6}$/.test(color) ? color : fallback;
}

function selectValue(value, allowed, fallback) {
  var numericValue = Number(value);
  return allowed.indexOf(numericValue) >= 0 ? numericValue : fallback;
}

function sanitizeSettings(input) {
  var source = input && typeof input === 'object' ? input : {};
  var settings = {};

  settings.TOP_LEFT_TYPE = selectValue(source.TOP_LEFT_TYPE, TOP_SLOT_TYPES, DEFAULTS.TOP_LEFT_TYPE);
  settings.TOP_RIGHT_TYPE = selectValue(source.TOP_RIGHT_TYPE, TOP_SLOT_TYPES, DEFAULTS.TOP_RIGHT_TYPE);
  settings.BOTTOM_LEFT_TYPE = selectValue(source.BOTTOM_LEFT_TYPE, BOTTOM_SLOT_TYPES, DEFAULTS.BOTTOM_LEFT_TYPE);
  settings.BOTTOM_RIGHT_TYPE = selectValue(source.BOTTOM_RIGHT_TYPE, BOTTOM_SLOT_TYPES, DEFAULTS.BOTTOM_RIGHT_TYPE);
  settings.TEMPERATURE_UNIT = selectValue(source.TEMPERATURE_UNIT, [0, 1, 2], DEFAULTS.TEMPERATURE_UNIT);
  settings.TIME_FORMAT = selectValue(source.TIME_FORMAT, [0, 1], DEFAULTS.TIME_FORMAT);

  COLOR_KEYS.forEach(function(key) {
    settings[key] = normalizeColor(source[key], DEFAULTS[key]);
  });
  return settings;
}

function toMessage(input) {
  var settings = sanitizeSettings(input);
  var message = {};
  SETTING_KEYS.forEach(function(key) {
    message[key] = key.indexOf('COLOR_') === 0 ? parseInt(settings[key], 16) : settings[key];
  });
  return message;
}

module.exports = {
  TOP_SLOT_OPTIONS: TOP_SLOT_OPTIONS,
  BOTTOM_SLOT_OPTIONS: BOTTOM_SLOT_OPTIONS,
  TEMPERATURE_UNIT_OPTIONS: TEMPERATURE_UNIT_OPTIONS,
  TIME_FORMAT_OPTIONS: TIME_FORMAT_OPTIONS,
  DEFAULTS: DEFAULTS,
  SETTING_KEYS: SETTING_KEYS,
  sanitizeSettings: sanitizeSettings,
  toMessage: toMessage
};
