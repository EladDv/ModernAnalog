#!/usr/bin/env python
"""Build the ASCII-remapped Font Awesome icon font used by the watchface."""

import argparse
from pathlib import Path

try:
    from fontTools import subset
    from fontTools.ttLib import TTFont
except ModuleNotFoundError as error:
    raise SystemExit(
        "fonttools is required: python -m pip install -r requirements-dev.txt"
    ) from error


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "node_modules/font-awesome/fonts/fontawesome-webfont.ttf"
OUTPUT = ROOT / "src/embeddedjs/assets/fa-remapped.ttf"
TRUETYPE_UNIX_EPOCH = 2_082_844_800

BASE_GLYPHS = {
    ord("A"): 0xF185,  # sun
    ord("B"): 0xF004,  # heart
    ord("C"): 0xF1AE,  # child / activity
    ord("E"): 0xF10B,  # mobile phone
}

WEATHER_GLYPHS = [
    (ord("F"), 0xF0C2),  # cloud
    (ord("H"), 0xF043),  # rain drop
    (ord("I"), 0xF2DC),  # snowflake
    (ord("J"), 0xF0E7),  # lightning
]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--weather-count", type=int, default=len(WEATHER_GLYPHS))
    args = parser.parse_args()
    count = max(0, min(len(WEATHER_GLYPHS), args.weather_count))
    glyphs = dict(BASE_GLYPHS)
    glyphs.update(WEATHER_GLYPHS[:count])

    font = TTFont(SOURCE, recalcTimestamp=False)
    source_cmap = font.getBestCmap()
    remapped = {target: source_cmap[source] for target, source in glyphs.items()}

    subsetter = subset.Subsetter(subset.Options())
    subsetter.populate(unicodes=list(glyphs.values()))
    subsetter.subset(font)
    for table in font["cmap"].tables:
        if table.isUnicode():
            table.cmap = dict(remapped)
    font["head"].created = TRUETYPE_UNIX_EPOCH
    font["head"].modified = TRUETYPE_UNIX_EPOCH

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    font.save(OUTPUT)
    print(f"Wrote {OUTPUT.relative_to(ROOT)} with {count} weather glyph(s)")


if __name__ == "__main__":
    main()
