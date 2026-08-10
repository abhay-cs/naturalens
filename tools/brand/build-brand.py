#!/usr/bin/env python3
"""Generate NaturaLens brand rasters from brand/owl-mark.svg.

Produces:
  apps/mobile/assets/{icon,adaptive-icon,splash-icon,favicon,mark}.png
  apps/web/src/app/{favicon.ico,icon.svg,apple-icon.png}
  apps/web/public/{icon-192,icon-512,icon-512-maskable,og-image}.png
  apps/web/public/site.webmanifest

Requires: rsvg-convert, Pillow. Optional: Inter Bold for OG wordmark
(auto-downloaded into tools/brand/.fonts/).
"""

from __future__ import annotations

import io
import math
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
BRAND_SVG = ROOT / "brand" / "owl-mark.svg"
BRAND_MONO = ROOT / "brand" / "owl-mark-mono.svg"
MOBILE_ASSETS = ROOT / "apps" / "mobile" / "assets"
WEB_APP = ROOT / "apps" / "web" / "src" / "app"
WEB_PUBLIC = ROOT / "apps" / "web" / "public"
FONTS_DIR = Path(__file__).resolve().parent / ".fonts"

AMBER = (0xEE, 0xAE, 0x34, 255)
SPLASH_BG = (0xFA, 0xFA, 0xF8, 255)
MARK_ASPECT = 652 / 1200  # 0.5433


def which(cmd: str) -> str:
    path = shutil.which(cmd)
    if not path:
        raise SystemExit(f"Missing required tool: {cmd}")
    return path


RSVG = which("rsvg-convert")


def render_svg(svg_path: Path, width: int, height: int | None = None, color: str = "#000000") -> Image.Image:
    """Rasterize an SVG with currentColor remapped to `color`."""
    text = svg_path.read_text()
    text = text.replace("fill=\"currentColor\"", f"fill=\"{color}\"")
    tmp = Path("/tmp") / f"naturalens-render-{width}.svg"
    tmp.write_text(text)
    cmd = [RSVG, "-w", str(width)]
    if height:
        cmd += ["-h", str(height)]
    cmd += [str(tmp)]
    data = subprocess.check_output(cmd)
    return Image.open(io.BytesIO(data)).convert("RGBA")


def flat_mark(height: int, color: str = "#000000") -> Image.Image:
    """Tight mark at the given height (width = height * MARK_ASPECT)."""
    width = max(1, round(height * MARK_ASPECT))
    return render_svg(BRAND_SVG, width=width, height=height, color=color)


def place_centered(canvas: Image.Image, mark: Image.Image, scale: float = 0.62) -> Image.Image:
    """Paste `mark` centered on `canvas`, scaled to `scale` of the shorter canvas side."""
    out = canvas.copy()
    side = min(out.size)
    target = max(1, int(side * scale))
    # Fit mark inside a target x target box, preserving aspect
    mh = target
    mw = max(1, round(mh * MARK_ASPECT))
    if mw > target:
        mw = target
        mh = max(1, round(mw / MARK_ASPECT))
    resized = mark.resize((mw, mh), Image.Resampling.LANCZOS)
    x = (out.width - mw) // 2
    y = (out.height - mh) // 2
    out.alpha_composite(resized, (x, y))
    return out


def frosted_glass_tile(size: int = 1024) -> Image.Image:
    """Near-white frosted glass background: radial wash, specular highlight, rim, soft shadow."""
    import numpy as np

    yy, xx = np.mgrid[0:size, 0:size]
    cx = size * 0.42
    cy = size * 0.38
    max_r = math.hypot(size, size) * 0.75
    t = np.clip(np.hypot(xx - cx, yy - cy) / max_r, 0, 1)
    t = t * t * (3 - 2 * t)
    r = (255 + (0xF2 - 255) * t).astype(np.uint8)
    g = (255 + (0xF1 - 255) * t).astype(np.uint8)
    b = (255 + (0xEE - 255) * t).astype(np.uint8)
    a = np.full((size, size), 255, dtype=np.uint8)
    img = Image.fromarray(np.dstack([r, g, b, a]), "RGBA")

    # Specular highlight (soft white ellipse, top-left)
    highlight = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(highlight)
    hx0, hy0 = int(size * -0.05), int(size * -0.15)
    hx1, hy1 = int(size * 0.75), int(size * 0.55)
    hdraw.ellipse([hx0, hy0, hx1, hy1], fill=(255, 255, 255, 90))
    highlight = highlight.filter(ImageFilter.GaussianBlur(radius=size * 0.08))
    img = Image.alpha_composite(img, highlight)

    # Soft bottom inner shadow
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rectangle([0, int(size * 0.72), size, size], fill=(0, 0, 0, 28))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=size * 0.06))
    img = Image.alpha_composite(img, shadow)

    # Hairline rim: 6% black under 60% white
    rim = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    rdraw = ImageDraw.Draw(rim)
    inset = max(1, size // 256)
    rdraw.rectangle([0, 0, size - 1, size - 1], outline=(0, 0, 0, 15), width=inset)
    rdraw.rectangle(
        [inset, inset, size - 1 - inset, size - 1 - inset],
        outline=(255, 255, 255, 153),
        width=inset,
    )
    img = Image.alpha_composite(img, rim)
    return img


def glass_icon(size: int = 1024, mark_scale: float = 0.62) -> Image.Image:
    tile = frosted_glass_tile(size)
    mark = flat_mark(height=int(size * mark_scale * 1.15))
    return place_centered(tile, mark, scale=mark_scale)


def adaptive_foreground(size: int = 1024) -> Image.Image:
    """Owl only, transparent, scaled into Android's ~66% safe zone."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mark = flat_mark(height=int(size * 0.66))
    return place_centered(canvas, mark, scale=0.66)


def splash_icon(size: int = 1024) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mark = flat_mark(height=int(size * 0.55))
    return place_centered(canvas, mark, scale=0.55)


def mark_png() -> Image.Image:
    """Tight-cropped transparent mark at native 652x1200."""
    return render_svg(BRAND_SVG, width=652, height=1200, color="#000000")


def favicon_png(size: int = 48) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mark = flat_mark(height=int(size * 0.88))
    return place_centered(canvas, mark, scale=0.88)


def write_ico(path: Path, sizes: list[int] | None = None) -> None:
    """Write a multi-resolution .ico from the square app icon.svg."""
    if sizes is None:
        sizes = [16, 32, 48]
    icon_svg = WEB_APP / "icon.svg"
    images: list[Image.Image] = []
    for s in sizes:
        # Prefer the square app icon if present; else fall back to mark compositing
        if icon_svg.exists():
            data = subprocess.check_output(
                [RSVG, "-w", str(s), "-h", str(s), str(icon_svg)]
            )
            images.append(Image.open(io.BytesIO(data)).convert("RGBA"))
        else:
            images.append(favicon_png(s).convert("RGBA"))
    images[-1].save(
        path,
        format="ICO",
        sizes=[(im.width, im.height) for im in images],
        append_images=images[:-1],
    )


def ensure_inter_bold() -> Path | None:
    FONTS_DIR.mkdir(parents=True, exist_ok=True)
    dest = FONTS_DIR / "Inter-Bold.ttf"
    if dest.exists():
        return dest
    # Prefer system Inter if present
    for candidate in (
        Path("/usr/share/fonts/truetype/inter/Inter-Bold.ttf"),
        Path("/usr/share/fonts/truetype/inter/InterBold.ttf"),
        Path("/usr/share/fonts/opentype/inter/Inter-Bold.otf"),
    ):
        if candidate.exists():
            shutil.copy(candidate, dest)
            return dest
    urls = [
        "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Bold.ttf",
        "https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-Bold.ttf",
    ]
    for url in urls:
        try:
            print(f"  downloading Inter Bold from {url}")
            urllib.request.urlretrieve(url, dest)
            if dest.stat().st_size > 1000:
                return dest
        except Exception as exc:
            print(f"  download failed: {exc}")
    print("  warning: Inter Bold unavailable; OG wordmark will use default font")
    return None


def og_image() -> Image.Image:
    """1200x630 frosted OG card with mark + wordmark + tagline."""
    w, h = 1200, 630
    # Build frosted field by scaling the tile
    tile = frosted_glass_tile(1024).resize((w, h), Image.Resampling.LANCZOS)
    out = tile.convert("RGBA")

    # Mark on the left
    mark = flat_mark(height=380)
    mx = 96
    my = (h - mark.height) // 2
    out.alpha_composite(mark, (mx, my))

    # Wordmark + tagline on the right
    draw = ImageDraw.Draw(out)
    font_path = ensure_inter_bold()
    try:
        font_title = ImageFont.truetype(str(font_path), 72) if font_path else ImageFont.load_default()
        font_sub = ImageFont.truetype(str(font_path), 28) if font_path else ImageFont.load_default()
    except OSError:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    text_x = mx + mark.width + 64
    title = "Naturalens"
    tagline = "See the Wild Differently"
    draw.text((text_x, h // 2 - 60), title, fill=(10, 31, 19, 255), font=font_title)
    draw.text((text_x, h // 2 + 24), tagline, fill=(10, 31, 19, 180), font=font_sub)
    return out


def maskable_icon(size: int = 512) -> Image.Image:
    """Maskable PWA icon — owl inside the 80% safe circle."""
    tile = frosted_glass_tile(size)
    # Safe zone is central 80%; use ~55% of full size for the mark
    return place_centered(tile, flat_mark(height=int(size * 0.55)), scale=0.55)


def write_manifest() -> None:
    WEB_PUBLIC.mkdir(parents=True, exist_ok=True)
    (WEB_PUBLIC / "site.webmanifest").write_text(
        """{
  "name": "Naturalens",
  "short_name": "Naturalens",
  "description": "AI-powered species recognition in real time.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FAFAF8",
  "theme_color": "#FAFAF8",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icon-512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
"""
    )


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)
    print(f"  wrote {path.relative_to(ROOT)} ({img.size[0]}x{img.size[1]})")


def main() -> None:
    if not BRAND_SVG.exists():
        raise SystemExit(f"Missing {BRAND_SVG}")

    print("Building NaturaLens brand assets…")
    print(f"  master: {BRAND_SVG.relative_to(ROOT)}")

    # Mobile
    save(glass_icon(1024), MOBILE_ASSETS / "icon.png")
    save(adaptive_foreground(1024), MOBILE_ASSETS / "adaptive-icon.png")
    save(splash_icon(1024), MOBILE_ASSETS / "splash-icon.png")
    save(favicon_png(48), MOBILE_ASSETS / "favicon.png")
    save(mark_png(), MOBILE_ASSETS / "mark.png")

    # icon.svg — square vector favicon (mark centered in 512×512)
    master = BRAND_SVG.read_text()
    import re

    d = re.search(r'd="([^"]+)"', master)
    if not d:
        raise SystemExit("owl-mark.svg missing path data")
    path_d = d.group(1)
    mh = 400
    mw = mh * MARK_ASPECT
    tx = (512 - mw) / 2
    ty = (512 - mh) / 2
    sx = mw / 652
    square = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <g transform="translate({tx:.3f} {ty:.3f}) scale({sx:.6f})">
    <path fill="#000000" fill-rule="evenodd" d="{path_d}"/>
    <circle cx="150.401" cy="356.476" r="56" fill="#EEAE34"/>
    <circle cx="496.035" cy="356.341" r="56" fill="#EEAE34"/>
  </g>
</svg>
'''
    (WEB_APP / "icon.svg").write_text(square)
    print(f"  wrote {(WEB_APP / 'icon.svg').relative_to(ROOT)}")

    write_ico(WEB_APP / "favicon.ico")
    print(f"  wrote {(WEB_APP / 'favicon.ico').relative_to(ROOT)}")

    save(glass_icon(180, mark_scale=0.62), WEB_APP / "apple-icon.png")

    # Public PWA / OG
    save(glass_icon(192), WEB_PUBLIC / "icon-192.png")
    save(glass_icon(512), WEB_PUBLIC / "icon-512.png")
    save(maskable_icon(512), WEB_PUBLIC / "icon-512-maskable.png")
    save(og_image(), WEB_PUBLIC / "og-image.png")
    write_manifest()
    print(f"  wrote {(WEB_PUBLIC / 'site.webmanifest').relative_to(ROOT)}")

    print("Done.")


if __name__ == "__main__":
    main()
