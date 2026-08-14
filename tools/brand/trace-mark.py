#!/usr/bin/env python3
"""Trace brand/source/owl-mark-source.png into brand/owl-mark.svg (+ mono).

Requires: Pillow, potrace. Produces a tight 672×896 currentColor mark.
"""
from __future__ import annotations

import re
import subprocess
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "brand" / "source" / "owl-mark-source.png"
OUT = ROOT / "brand" / "owl-mark.svg"
OUT_MONO = ROOT / "brand" / "owl-mark-mono.svg"

TOKEN = re.compile(r"[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?")


def to_pbm(png: Path, pbm: Path) -> tuple[int, int]:
    src = Image.open(png).convert("RGBA")
    bbox = src.getchannel("A").getbbox()
    if not bbox:
        raise SystemExit("source PNG has no opaque pixels")
    crop = src.crop(bbox)
    w, h = crop.size
    mask = Image.new("1", (w, h), 1)
    px, m = crop.load(), mask.load()
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 128:
                m[x, y] = 0
    mask.save(pbm)
    return w, h


def transform_path(d: str, tx: float, ty: float, sx: float, sy: float) -> str:
    tokens = TOKEN.findall(re.sub(r"\s+", " ", d).strip())
    out: list[str] = []
    i = 0
    cx = cy = startx = starty = 0.0
    cmd: str | None = None

    def num() -> float:
        nonlocal i
        v = float(tokens[i])
        i += 1
        return v

    def emit_pt(x: float, y: float) -> None:
        X, Y = tx + x * sx, ty + y * sy
        out.append(f"{X:.2f}")
        out.append(f"{Y:.2f}")

    while i < len(tokens):
        tok = tokens[i]
        if re.match(r"[A-Za-z]", tok):
            cmd = tok
            i += 1
            if cmd in "Zz":
                out.append("Z")
                cx, cy = startx, starty
            continue
        assert cmd is not None
        if cmd == "M":
            x, y = num(), num()
            out.append("M"); emit_pt(x, y)
            cx, cy = startx, starty = x, y
            cmd = "L"
        elif cmd == "m":
            x, y = cx + num(), cy + num()
            out.append("M"); emit_pt(x, y)
            cx, cy = startx, starty = x, y
            cmd = "l"
        elif cmd == "L":
            x, y = num(), num()
            out.append("L"); emit_pt(x, y)
            cx, cy = x, y
        elif cmd == "l":
            x, y = cx + num(), cy + num()
            out.append("L"); emit_pt(x, y)
            cx, cy = x, y
        elif cmd == "H":
            x = num()
            out.append("L"); emit_pt(x, cy)
            cx = x
        elif cmd == "h":
            x = cx + num()
            out.append("L"); emit_pt(x, cy)
            cx = x
        elif cmd == "V":
            y = num()
            out.append("L"); emit_pt(cx, y)
            cy = y
        elif cmd == "v":
            y = cy + num()
            out.append("L"); emit_pt(cx, y)
            cy = y
        elif cmd == "C":
            pts = [num() for _ in range(6)]
            out.append("C")
            for k in range(0, 6, 2):
                emit_pt(pts[k], pts[k + 1])
            cx, cy = pts[4], pts[5]
        elif cmd == "c":
            dxy = [num() for _ in range(6)]
            pts = [cx + dxy[0], cy + dxy[1], cx + dxy[2], cy + dxy[3], cx + dxy[4], cy + dxy[5]]
            out.append("C")
            for k in range(0, 6, 2):
                emit_pt(pts[k], pts[k + 1])
            cx, cy = pts[4], pts[5]
        elif cmd in ("S", "Q"):
            n = 4
            pts = [num() for _ in range(n)]
            out.append(cmd)
            for k in range(0, n, 2):
                emit_pt(pts[k], pts[k + 1])
            cx, cy = pts[2], pts[3]
        elif cmd in ("s", "q"):
            dxy = [num() for _ in range(4)]
            pts = [cx + dxy[0], cy + dxy[1], cx + dxy[2], cy + dxy[3]]
            out.append(cmd.upper())
            for k in range(0, 4, 2):
                emit_pt(pts[k], pts[k + 1])
            cx, cy = pts[2], pts[3]
        else:
            raise SystemExit(f"Unhandled path command {cmd!r}")

    parts: list[str] = []
    j = 0
    while j < len(out):
        if out[j] in "MLCQSTHVZ":
            parts.append(out[j])
            j += 1
        else:
            nums: list[str] = []
            while j < len(out) and out[j] not in "MLCQSTHVZ":
                nums.append(out[j])
                j += 1
            parts.append(" ".join(nums))

    path_d = ""
    for p in parts:
        path_d += p
    path_d = re.sub(r"([MLCQSTHVZ])\s+", r"\1", path_d)
    path_d = path_d.replace("ZM", "Z M").replace("ZC", "Z C")
    return path_d


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing {SRC}")
    with tempfile.TemporaryDirectory() as td:
        td_path = Path(td)
        pbm = td_path / "mark.pbm"
        raw_svg = td_path / "raw.svg"
        w, h = to_pbm(SRC, pbm)
        subprocess.check_call(
            [
                "potrace",
                str(pbm),
                "-s",
                "-o",
                str(raw_svg),
                "--flat",
                "--turdsize",
                "4",
                "--alphamax",
                "0.8",
                "--opttolerance",
                "0.4",
            ]
        )
        text = raw_svg.read_text()
        t = re.search(
            r'transform="translate\(([^,]+),([^)]+)\) scale\(([^,]+),([^)]+)\)"',
            text,
        )
        if not t:
            raise SystemExit("potrace SVG missing transform")
        tx, ty, sx, sy = map(float, t.groups())
        d_raw = re.search(r'<path d="([^"]+)"', text, re.S)
        if not d_raw:
            raise SystemExit("potrace SVG missing path")
        path_d = transform_path(d_raw.group(1), tx, ty, sx, sy)
        out = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" fill="none" aria-hidden="true">\n'
            f'  <path fill="currentColor" fill-rule="evenodd" d="{path_d}"/>\n'
            "</svg>\n"
        )
        OUT.write_text(out)
        OUT_MONO.write_text(out)
        print(f"wrote {OUT.relative_to(ROOT)} and {OUT_MONO.name} ({w}x{h}, path {len(path_d)} chars)")


if __name__ == "__main__":
    main()
