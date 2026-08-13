#!/usr/bin/env python3
"""Generate NaturaLens brand rasters from packages/design.

Produces:
  apps/mobile/assets/{icon,adaptive-icon,splash-icon,favicon,mark}.png
  apps/web/src/app/{favicon.ico,icon.svg,apple-icon.png}
  apps/web/public/{icon-192,icon-512,icon-512-maskable,og-image}.png
  apps/web/public/site.webmanifest

Requires: rsvg-convert, Pillow.
Optional: Outfit font for OG wordmark (auto-downloaded into tools/brand/.fonts/).

Reads palette from packages/design/tokens.json — never hardcode brand colors here.
"""

from __future__ import annotations

import io
import json
import shutil
import subprocess
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
DESIGN = ROOT / "packages" / "design"
TOKENS_PATH = DESIGN / "tokens.json"
BRAND_SVG = DESIGN / "mark" / "owl.svg"
BRAND_SMALL = DESIGN / "mark" / "owl-small.svg"
BRAND_SQUARE = DESIGN / "mark" / "owl-square.svg"
MOBILE_ASSETS = ROOT / "apps" / "mobile" / "assets"
WEB_APP = ROOT / "apps" / "web" / "src" / "app"
WEB_PUBLIC = ROOT / "apps" / "web" / "public"
FONTS_DIR = Path(__file__).resolve().parent / ".fonts"


def load_tokens() -> dict:
    return json.loads(TOKENS_PATH.read_text())


TOKENS = load_tokens()
FG = TOKENS["color"]["default"]["fg"]
BG = TOKENS["color"]["default"]["bg"]
MUTED = TOKENS["color"]["default"]["muted"]
FG_RGB = tuple(int(FG[i : i + 2], 16) for i in (1, 3, 5)) + (255,)
BG_RGB = tuple(int(BG[i : i + 2], 16) for i in (1, 3, 5)) + (255,)
MUTED_RGB = tuple(int(MUTED[i : i + 2], 16) for i in (1, 3, 5)) + (255,)


def which(cmd: str) -> str:
    path = shutil.which(cmd)
    if not path:
        raise SystemExit(f"Missing required tool: {cmd}")
    return path


RSVG = which("rsvg-convert")


def render_svg(
    svg_path: Path,
    width: int,
    height: int | None = None,
    color: str = FG,
) -> Image.Image:
    """Rasterize an SVG remapping currentColor fill and stroke to `color`."""
    text = svg_path.read_text()
    text = text.replace('fill="currentColor"', f'fill="{color}"')
    text = text.replace('stroke="currentColor"', f'stroke="{color}"')
    tmp = Path("/tmp") / f"naturalens-render-{width}-{svg_path.stem}.svg"
    tmp.write_text(text)
    cmd = [RSVG, "-w", str(width)]
    if height:
        cmd += ["-h", str(height)]
    cmd += [str(tmp)]
    data = subprocess.check_output(cmd)
    return Image.open(io.BytesIO(data)).convert("RGBA")


def place_centered(canvas: Image.Image, mark: Image.Image, scale: float = 0.62) -> Image.Image:
    """Paste `mark` centered on `canvas`, scaled to `scale` of the shorter canvas side."""
    out = canvas.copy()
    side = min(out.size)
    target = max(1, int(side * scale))
    # Fit mark inside a target x target box, preserving aspect (owl is square viewBox)
    mh = target
    mw = target
    resized = mark.resize((mw, mh), Image.Resampling.LANCZOS)
    x = (out.width - mw) // 2
    y = (out.height - mh) // 2
    out.alpha_composite(resized, (x, y))
    return out


def flat_bg(size: int, color: tuple[int, int, int, int] = BG_RGB) -> Image.Image:
    return Image.new("RGBA", (size, size), color)


def app_icon(size: int = 1024, mark_scale: float = 0.62, small: bool = False) -> Image.Image:
    """Black line mark on white — no glass, no gradient."""
    tile = flat_bg(size)
    src = BRAND_SMALL if small else BRAND_SVG
    mark = render_svg(src, width=int(size * mark_scale))
    return place_centered(tile, mark, scale=mark_scale)


def adaptive_foreground(size: int = 1024) -> Image.Image:
    """Owl only, transparent, scaled into Android's ~66% safe zone."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mark = render_svg(BRAND_SVG, width=int(size * 0.66))
    return place_centered(canvas, mark, scale=0.66)


def splash_icon(size: int = 1024) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mark = render_svg(BRAND_SVG, width=int(size * 0.55))
    return place_centered(canvas, mark, scale=0.55)


def mark_png() -> Image.Image:
    """Transparent mark at 512."""
    return render_svg(BRAND_SVG, width=512, height=512)


def favicon_png(size: int = 48) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    src = BRAND_SMALL if size <= 32 else BRAND_SVG
    mark = render_svg(src, width=int(size * 0.88))
    return place_centered(canvas, mark, scale=0.88)


def write_ico(path: Path, sizes: list[int] | None = None) -> None:
    if sizes is None:
        sizes = [16, 32, 48]
    images: list[Image.Image] = []
    for s in sizes:
        images.append(favicon_png(s).convert("RGBA"))
    images[-1].save(
        path,
        format="ICO",
        sizes=[(im.width, im.height) for im in images],
        append_images=images[:-1],
    )


def ensure_outfit() -> Path | None:
    FONTS_DIR.mkdir(parents=True, exist_ok=True)
    dest = FONTS_DIR / "Outfit-Regular.ttf"
    if dest.exists():
        return dest
    urls = [
        "https://github.com/google/fonts/raw/main/ofl/outfit/Outfit%5Bwght%5D.ttf",
        "https://github.com/googlefonts/outfit/raw/main/fonts/ttf/Outfit-Regular.ttf",
    ]
    for url in urls:
        try:
            print(f"  downloading Outfit from {url}")
            urllib.request.urlretrieve(url, dest)
            if dest.stat().st_size > 1000:
                return dest
        except Exception as exc:
            print(f"  download failed: {exc}")
    print("  warning: Outfit unavailable; OG wordmark will use default font")
    return None


def og_image() -> Image.Image:
    """1200x630 white card with mark + wordmark + tagline — black on white."""
    w, h = 1200, 630
    out = Image.new("RGBA", (w, h), BG_RGB)
    mark = render_svg(BRAND_SVG, width=280)
    mx = 96
    my = (h - mark.height) // 2
    out.alpha_composite(mark, (mx, my))

    draw = ImageDraw.Draw(out)
    font_path = ensure_outfit()
    try:
        font_title = ImageFont.truetype(str(font_path), 72) if font_path else ImageFont.load_default()
        font_sub = ImageFont.truetype(str(font_path), 28) if font_path else ImageFont.load_default()
    except OSError:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    text_x = mx + mark.width + 64
    draw.text((text_x, h // 2 - 60), "Naturalens", fill=FG_RGB, font=font_title)
    draw.text((text_x, h // 2 + 24), "See the Wild Differently", fill=MUTED_RGB, font=font_sub)
    return out


def maskable_icon(size: int = 512) -> Image.Image:
    tile = flat_bg(size)
    return place_centered(tile, render_svg(BRAND_SVG, width=int(size * 0.55)), scale=0.55)


def write_manifest() -> None:
    WEB_PUBLIC.mkdir(parents=True, exist_ok=True)
    (WEB_PUBLIC / "site.webmanifest").write_text(
        f"""{{
  "name": "Naturalens",
  "short_name": "Naturalens",
  "description": "Point your camera at anything alive. Naturalens returns a name, a confidence, and one thing to look for next time.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "{BG}",
  "theme_color": "{BG}",
  "icons": [
    {{
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }},
    {{
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }},
    {{
      "src": "/icon-512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }}
  ]
}}
"""
    )


def write_icon_svg() -> None:
    """Square vector favicon from the canonical square mark, baked to black."""
    text = BRAND_SQUARE.read_text()
    text = text.replace('fill="currentColor"', f'fill="{FG}"')
    text = text.replace('stroke="currentColor"', f'stroke="{FG}"')
    WEB_APP.mkdir(parents=True, exist_ok=True)
    (WEB_APP / "icon.svg").write_text(text)


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)
    print(f"  wrote {path.relative_to(ROOT)} ({img.size[0]}x{img.size[1]})")


def main() -> None:
    if not BRAND_SVG.exists():
        raise SystemExit(f"Missing {BRAND_SVG}")
    if not TOKENS_PATH.exists():
        raise SystemExit(f"Missing {TOKENS_PATH}")

    print("Building NaturaLens brand assets…")
    print(f"  master: {BRAND_SVG.relative_to(ROOT)}")
    print(f"  tokens: {TOKENS_PATH.relative_to(ROOT)}")

    # Mobile
    save(app_icon(1024), MOBILE_ASSETS / "icon.png")
    save(adaptive_foreground(1024), MOBILE_ASSETS / "adaptive-icon.png")
    save(splash_icon(1024), MOBILE_ASSETS / "splash-icon.png")
    save(favicon_png(48), MOBILE_ASSETS / "favicon.png")
    save(mark_png(), MOBILE_ASSETS / "mark.png")

    write_icon_svg()
    print(f"  wrote {(WEB_APP / 'icon.svg').relative_to(ROOT)}")

    write_ico(WEB_APP / "favicon.ico")
    print(f"  wrote {(WEB_APP / 'favicon.ico').relative_to(ROOT)}")

    save(app_icon(180, mark_scale=0.62), WEB_APP / "apple-icon.png")

    save(app_icon(192), WEB_PUBLIC / "icon-192.png")
    save(app_icon(512), WEB_PUBLIC / "icon-512.png")
    save(maskable_icon(512), WEB_PUBLIC / "icon-512-maskable.png")
    save(og_image(), WEB_PUBLIC / "og-image.png")
    write_manifest()
    print(f"  wrote {(WEB_PUBLIC / 'site.webmanifest').relative_to(ROOT)}")

    print("Done.")


if __name__ == "__main__":
    main()
