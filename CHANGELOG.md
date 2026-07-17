# Changelog

## 1.0.2 - 2026-07-16

- Fixed Alloy `memory full` crashes after store installation by restoring the
  firmware-managed XS heaps, allowing them to grow during rendering and
  companion settings callbacks.

## 1.0.1 - 2026-07-16

- Fixed an Alloy fatal error caused by the watch-side JavaScript stack being
  configured below Alloy's default capacity.
- Restored enough XS stack space for Poco rendering and AppMessage callbacks.

## 1.0.0 - 2026-07-15

- Initial Release
- Edge-to-edge hybrid clock design for Pebble Time 2.
- Digital time, date, current-hour highlighting, and minute progress.
- Configurable weather, health, step, heart-rate, and battery widgets.
- Independent colors for the background, clock, time, minute rim, and four corner slots.
- Cached Open-Meteo weather and live phone-battery reporting.
- Bluetooth-disconnect indication and vibration feedback.
- Schema-based settings validation and focused companion tests.
- Added Celsius, Fahrenheit, and Kelvin display options.
- Added configurable 24-hour and 12-hour time with AM/PM.
- Added condition-specific clear, cloudy, fog, rain, snow, and storm glyphs.
