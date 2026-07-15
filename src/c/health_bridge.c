#include <pebble.h>
#include <stdint.h>

int32_t health_steps_today(void) {
  HealthValue value = health_service_sum_today(HealthMetricStepCount);
  return value >= 0 ? (int32_t)value : -1;
}

int32_t health_heart_rate(void) {
  HealthValue value = health_service_peek_current_value(HealthMetricHeartRateBPM);
  return value > 0 ? (int32_t)value : -1;
}
