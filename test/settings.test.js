'use strict';

var assert = require('node:assert/strict');
var test = require('node:test');
var settings = require('../src/pkjs/settings');

test('sanitizeSettings returns a complete default configuration', function() {
  assert.deepEqual(settings.sanitizeSettings(), settings.DEFAULTS);
});

test('sanitizeSettings accepts supported slots and normalized colors', function() {
  var result = settings.sanitizeSettings({
    TOP_LEFT_TYPE: '4',
    TOP_RIGHT_TYPE: 3,
    BOTTOM_LEFT_TYPE: '6',
    BOTTOM_RIGHT_TYPE: 5,
    TEMPERATURE_UNIT: '2',
    TIME_FORMAT: 1,
    COLOR_BACKGROUND: '#abcdef',
    COLOR_TEXT: 0x123456
  });

  assert.equal(result.TOP_LEFT_TYPE, 4);
  assert.equal(result.TOP_RIGHT_TYPE, 3);
  assert.equal(result.BOTTOM_LEFT_TYPE, 6);
  assert.equal(result.BOTTOM_RIGHT_TYPE, 5);
  assert.equal(result.TEMPERATURE_UNIT, 2);
  assert.equal(result.TIME_FORMAT, 1);
  assert.equal(result.COLOR_BACKGROUND, 'ABCDEF');
  assert.equal(result.COLOR_TEXT, '123456');
});

test('sanitizeSettings rejects unsupported values and unknown keys', function() {
  var result = settings.sanitizeSettings({
    TOP_LEFT_TYPE: 99,
    BOTTOM_RIGHT_TYPE: 0,
    TEMPERATURE_UNIT: 99,
    TIME_FORMAT: -1,
    COLOR_CLOCK: 'not-a-color',
    UNKNOWN_KEY: 123
  });

  assert.equal(result.TOP_LEFT_TYPE, settings.DEFAULTS.TOP_LEFT_TYPE);
  assert.equal(result.BOTTOM_RIGHT_TYPE, settings.DEFAULTS.BOTTOM_RIGHT_TYPE);
  assert.equal(result.TEMPERATURE_UNIT, settings.DEFAULTS.TEMPERATURE_UNIT);
  assert.equal(result.TIME_FORMAT, settings.DEFAULTS.TIME_FORMAT);
  assert.equal(result.COLOR_CLOCK, settings.DEFAULTS.COLOR_CLOCK);
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'UNKNOWN_KEY'), false);
});

test('toMessage emits only numeric AppMessage values from the schema', function() {
  var message = settings.toMessage({ COLOR_CLOCK: 'ABCDEF', UNKNOWN_KEY: 123 });

  assert.deepEqual(Object.keys(message), settings.SETTING_KEYS);
  assert.equal(message.COLOR_CLOCK, 0xABCDEF);
  assert.equal(message.TOP_LEFT_TYPE, settings.DEFAULTS.TOP_LEFT_TYPE);
});
