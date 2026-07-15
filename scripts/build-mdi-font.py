#!/usr/bin/env python
"""Build the compact, ASCII-remapped MDI font used by the watchface."""

from pathlib import Path

try:
    from fontTools import subset
    from fontTools.ttLib import TTFont
except ModuleNotFoundError as error:
    raise SystemExit(
        "fonttools is required: python -m pip install -r requirements-dev.txt"
    ) from error


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "node_modules/@mdi/font/fonts/materialdesignicons-webfont.ttf"
OUTPUT = ROOT / "src/embeddedjs/assets/mdi-pebble.ttf"
TRUETYPE_UNIX_EPOCH = 2_082_844_800

# Alloy's bitmap-font builder accepts a simple character list. Remapping the
# selected MDI glyphs to ASCII keeps the generated Pebble resource very small.
GLYPHS = {
    ord("A"): 0xF0897,  # watch-variant
    ord("B"): 0xF00B2,  # bluetooth-off
}

def main() -> None:
    font = TTFont(SOURCE, recalcTimestamp=False)
    source_cmap = font.getBestCmap()
    remapped_glyphs = {
        target: source_cmap[source]
        for target, source in GLYPHS.items()
    }

    options = subset.Options()
    options.layout_features = "*"
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=list(GLYPHS.values()))
    subsetter.subset(font)

    for table in font["cmap"].tables:
        if table.isUnicode():
            table.cmap = dict(remapped_glyphs)
    font["head"].created = TRUETYPE_UNIX_EPOCH
    font["head"].modified = TRUETYPE_UNIX_EPOCH

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    font.save(OUTPUT)
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
