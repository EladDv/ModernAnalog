#include <pebble.h>

int main(void) {
  Window *window = window_create();
  window_stack_push(window, true);

  ModdableCreationRecord creation = {
    .recordSize = sizeof(creation),
    // Match Alloy's 384-slot (6 KB) default stack. The previous 1 KB override
    // left only 64 XS slots for the nested Poco render and AppMessage callbacks
    // and could terminate the watchface with "JavaScript stack overflow".
    .stack = 6144,
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
