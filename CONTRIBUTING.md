# Contributing

Thanks for helping improve Modern Analog.

## Development setup

1. Install Pebble SDK 4.17 with Emery support.
2. Run `npm ci`.
3. Run `npm run verify`.
4. Build with `npm run build`.
5. Install with `pebble install --emulator emery`.

Keep changes focused and preserve the Emery layout unless the change explicitly adds another supported platform.

## Before submitting a change

- Run `npm run release` from a clean checkout.
- Exercise the default layout in the Emery emulator.
- Check the settings page and confirm all four slots update independently.
- Verify both connected and disconnected phone states when changing battery or connectivity behavior.
- Confirm the weather slot is empty when no cached or live weather exists.
- Include a screenshot for visible design changes.

Generated build output, local SDK state, and generated FFI code are intentionally ignored.

If an icon mapping changes, install `requirements-dev.txt` and rebuild the compact embedded fonts with `npm run build:icons` before building the PBW. Commit the regenerated font assets with the mapping change.
