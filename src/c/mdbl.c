#include <pebble.h>

int main(void) {
  Window *window = window_create();
  window_stack_push(window, true);

  ModdableCreationRecord creation = {
    .recordSize = sizeof(creation),
    // The Pebble Alloy defaults are too tight for the face's fonts, settings,
    // and live metrics. These explicit heaps still use less total RAM than the
    // defaults did alongside maximum-size AppMessage buffers.
    .stack = 1024,
    .slot = 18432,
    .chunk = 24576,
#ifdef PBL_DEBUG
    .flags = kModdableCreationFlagDebug,
#endif
    .fxBuildFFI = fxBuildFFI,
  };
  moddable_createMachine(&creation);

  window_destroy(window);
}
