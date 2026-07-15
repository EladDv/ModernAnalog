'use strict';

var settings = require('./settings');
var defaults = settings.DEFAULTS;

module.exports = [
  {
    type: 'heading',
    defaultValue: 'Modern Analog'
  },
  {
    type: 'section',
    items: [
      { type: 'heading', defaultValue: 'Display' },
      { type: 'select', messageKey: 'TEMPERATURE_UNIT', label: 'Temperature', defaultValue: defaults.TEMPERATURE_UNIT, options: settings.TEMPERATURE_UNIT_OPTIONS },
      { type: 'select', messageKey: 'TIME_FORMAT', label: 'Time', defaultValue: defaults.TIME_FORMAT, options: settings.TIME_FORMAT_OPTIONS }
    ]
  },
  {
    type: 'section',
    items: [
      { type: 'heading', defaultValue: 'Corner content' },
      { type: 'select', messageKey: 'TOP_LEFT_TYPE', label: 'Top left', defaultValue: defaults.TOP_LEFT_TYPE, options: settings.TOP_SLOT_OPTIONS },
      { type: 'select', messageKey: 'TOP_RIGHT_TYPE', label: 'Top right', defaultValue: defaults.TOP_RIGHT_TYPE, options: settings.TOP_SLOT_OPTIONS },
      { type: 'select', messageKey: 'BOTTOM_LEFT_TYPE', label: 'Bottom left', defaultValue: defaults.BOTTOM_LEFT_TYPE, options: settings.BOTTOM_SLOT_OPTIONS },
      { type: 'select', messageKey: 'BOTTOM_RIGHT_TYPE', label: 'Bottom right', defaultValue: defaults.BOTTOM_RIGHT_TYPE, options: settings.BOTTOM_SLOT_OPTIONS }
    ]
  },
  {
    type: 'section',
    items: [
      { type: 'heading', defaultValue: 'Colors' },
      { type: 'color', messageKey: 'COLOR_BACKGROUND', label: 'Background', defaultValue: defaults.COLOR_BACKGROUND, allowGray: true },
      { type: 'color', messageKey: 'COLOR_TEXT', label: 'Time and active hour', defaultValue: defaults.COLOR_TEXT, allowGray: true },
      { type: 'color', messageKey: 'COLOR_CLOCK', label: 'Clock and date', defaultValue: defaults.COLOR_CLOCK, allowGray: true },
      { type: 'color', messageKey: 'COLOR_MINUTE_PROGRESS', label: 'Minute rim', defaultValue: defaults.COLOR_MINUTE_PROGRESS, allowGray: true },
      { type: 'color', messageKey: 'COLOR_TOP_LEFT', label: 'Top left', defaultValue: defaults.COLOR_TOP_LEFT, allowGray: true },
      { type: 'color', messageKey: 'COLOR_TOP_RIGHT', label: 'Top right', defaultValue: defaults.COLOR_TOP_RIGHT, allowGray: true },
      { type: 'color', messageKey: 'COLOR_BOTTOM_LEFT', label: 'Bottom left', defaultValue: defaults.COLOR_BOTTOM_LEFT, allowGray: true },
      { type: 'color', messageKey: 'COLOR_BOTTOM_RIGHT', label: 'Bottom right', defaultValue: defaults.COLOR_BOTTOM_RIGHT, allowGray: true }
    ]
  },
  {
    type: 'submit',
    defaultValue: 'Save'
  }
];
