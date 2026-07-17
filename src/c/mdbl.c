#include <pebble.h>

int main(void) {
  Window *window = window_create();
  window_stack_push(window, true);

  ModdableCreationRecord creation = {
    .recordSize = sizeof(creation),
    // Keep Alloy's firmware-managed heaps so they can grow with rendering and
    // companion callbacks. Fixed heap sizes disable that growth and can abort
    // with "memory full" even while the app still has free RAM.
#ifdef PBL_DEBUG
    .flags = kModdableCreationFlagDebug,
#endif
    .fxBuildFFI = fxBuildFFI,
  };
  moddable_createMachine(&creation);

  window_destroy(window);
}
