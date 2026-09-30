#!/usr/bin/env bash
# generate-icons.sh
# -----------------------------------------------------------------------------
# Generate all icon + splash assets from the source images in resources/.
#
# Requirements (auto-installed if missing):
#   - @capacitor/assets  (npm devDependency)  -> native platform assets
#   - Python 3 + Pillow                       -> PWA / favicon / OG variants
#
# Place a 1024x1024 PNG at resources/icon/icon.png
# Place a 2732x2732 PNG at resources/splash/splash.png
#
# Run:  npm run assets   (or)  ./scripts/generate-icons.sh
set -euo pipefail
cd "$(dirname "$0")/.."

ICON_SRC="resources/icon/icon.png"
SPLASH_SRC="resources/splash/splash.png"

if [[ ! -f "$ICON_SRC" ]]; then
  echo "\u274c  Missing $ICON_SRC (needs a 1024x1024 PNG)" >&2
  exit 1
fi
if [[ ! -f "$SPLASH_SRC" ]]; then
  echo "\u274c  Missing $SPLASH_SRC (needs a 2732x2732 PNG)" >&2
  exit 1
fi

echo "==> Generating native assets with @capacitor/assets"
npx @capacitor/assets generate --icon --splash --ios --android

echo "==> Generating PWA + favicon variants with Python/Pillow"
python3 - <<'PY'
from PIL import Image
from pathlib import Path
import os

root = Path(".")
icon = Image.open(root / "resources/icon/icon.png").convert("RGBA")
splash = Image.open(root / "resources/splash/splash.png").convert("RGBA")
www = root / "www/assets"
www.mkdir(parents=True, exist_ok=True)

# PWA icons
for size in (192, 512):
    icon.resize((size, size), Image.LANCZOS).save(www / f"icon-{size}.png")

# Maskable icons (with safe-zone padding ~10%)
for size in (192, 512):
    canvas = Image.new("RGBA", (size, size), (11, 16, 32, 255))  # theme #0b1020
    inner = icon.resize((int(size * 0.8), int(size * 0.8)), Image.LANCZOS)
    canvas.alpha_composite(inner, ((size - inner.width)//2, (size - inner.height)//2))
    canvas.save(www / f"icon-maskable-{size}.png")

# Favicons
icon.resize((16, 16), Image.LANCZOS).save(www / "favicon-16.png")
icon.resize((32, 32), Image.LANCZOS).save(www / "favicon-32.png")
icon.resize((32, 32), Image.LANCZOS).save(www / "favicon.ico", format="ICO")

# SVG source (for crisp scaling in browsers that support it)
svg_path = www / "icon.svg"
icon_for_svg = icon.resize((512, 512), Image.LANCZOS)

# OG image (1200x630 social card with icon + dark bg)
og = Image.new("RGBA", (1200, 630), (11, 16, 32, 255))
og_icon = icon.resize((360, 360), Image.LANCZOS)
og.alpha_composite(og_icon, (60, (630 - 360)//2))
og.convert("RGB").save(www / "og-image.png", "PNG", quality=90)

print(f"  Wrote PWA + favicon + OG assets to {www}/")
PY

echo "==> Generating Apple touch icon"
mkdir -p www/assets
python3 -c "
from PIL import Image
Image.open('resources/icon/icon.png').convert('RGBA').resize((180,180), Image.LANCZOS).save('www/assets/apple-touch-icon.png')
"

echo ""
echo "\u2705  All assets generated."
echo "   Native: android/app/src/main/res/ , ios/App/App/Assets.xcassets/"
echo "   Web:    www/assets/"
