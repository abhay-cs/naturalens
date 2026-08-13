#!/usr/bin/env python3
"""Local box editor for polar-bear YOLO labels.

Serves models/data/images with the existing labels preloaded. Drag to
adjust, draw new boxes, merge a split bear, save back to labels/.

    models/.venv/bin/python models/evaluation/labeler.py
"""

from __future__ import annotations

import argparse
import io
import json
import mimetypes
import posixpath
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

REPO = Path(__file__).resolve().parents[2]
DATA = REPO / "models" / "data"
IMAGES = DATA / "images"
LABELS = DATA / "labels"
CACHE = DATA / ".cache"
REVIEW = DATA / "review.json"
STATIC = Path(__file__).resolve().parent / "labeler_static"
ANNOTATIONS = DATA / "annotations.json"

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}


def load_review() -> dict:
    if REVIEW.is_file():
        return json.loads(REVIEW.read_text())
    return {}


def save_review(data: dict) -> None:
    REVIEW.write_text(json.dumps(data, indent=2) + "\n")


def parse_yolo(text: str) -> list[dict]:
    boxes = []
    for i, line in enumerate(text.splitlines()):
        parts = line.split()
        if len(parts) < 5:
            continue
        cls, cx, cy, w, h = parts[:5]
        boxes.append(
            {
                "id": i + 1,
                "cls": int(float(cls)),
                "cx": float(cx),
                "cy": float(cy),
                "w": float(w),
                "h": float(h),
            }
        )
    return boxes


def to_yolo(boxes: list[dict]) -> str:
    lines = []
    for box in boxes:
        lines.append(
            f"{int(box.get('cls', 0))} {box['cx']:.6f} {box['cy']:.6f} "
            f"{box['w']:.6f} {box['h']:.6f}"
        )
    return ("\n".join(lines) + "\n") if lines else ""


def yolo_to_xyxy(box: dict, width: int, height: int) -> list[float]:
    bw = box["w"] * width
    bh = box["h"] * height
    cx = box["cx"] * width
    cy = box["cy"] * height
    return [cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2]


def box_iou(a: dict, b: dict) -> float:
    ax1, ay1 = a["cx"] - a["w"] / 2, a["cy"] - a["h"] / 2
    ax2, ay2 = a["cx"] + a["w"] / 2, a["cy"] + a["h"] / 2
    bx1, by1 = b["cx"] - b["w"] / 2, b["cy"] - b["h"] / 2
    bx2, by2 = b["cx"] + b["w"] / 2, b["cy"] + b["h"] / 2
    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)
    inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
    union = a["w"] * a["h"] + b["w"] * b["h"] - inter
    return inter / union if union > 0 else 0.0


def is_split_pair(a: dict, b: dict) -> bool:
    """True when two boxes look like front/back halves of one elongated bear."""
    if max(a["h"], b["h"]) <= 0 or max(a["w"], b["w"]) <= 0:
        return False
    if abs(a["h"] - b["h"]) / max(a["h"], b["h"]) > 0.5:
        return False
    if abs(a["cy"] - b["cy"]) > 0.45 * max(a["h"], b["h"]):
        return False
    a1, a2 = a["cx"] - a["w"] / 2, a["cx"] + a["w"] / 2
    b1, b2 = b["cx"] - b["w"] / 2, b["cx"] + b["w"] / 2
    overlap = min(a2, b2) - max(a1, b1)
    gap = max(0.0, -overlap)
    if gap > 0.35 * min(a["w"], b["w"]):
        return False
    iou = box_iou(a, b)
    if iou > 0.55:
        return True
    union_w = max(a2, b2) - min(a1, b1)
    return union_w > 1.25 * max(a["w"], b["w"])


def flags_for(boxes: list[dict]) -> list[str]:
    flags = []
    if len(boxes) >= 2:
        for i, a in enumerate(boxes):
            for b in boxes[i + 1 :]:
                if is_split_pair(a, b):
                    flags.append("split")
                    break
            if "split" in flags:
                break
    if not boxes:
        flags.append("empty")
    return flags


def image_size(path: Path, known: dict[str, tuple[int, int]]) -> tuple[int, int]:
    if path.name in known:
        return known[path.name]
    from PIL import Image, ImageOps

    with ImageOps.exif_transpose(Image.open(path)) as im:
        return im.size


def annotation_sizes() -> dict[str, tuple[int, int]]:
    if not ANNOTATIONS.is_file():
        return {}
    data = json.loads(ANNOTATIONS.read_text())
    return {im["file"]: (im["width"], im["height"]) for im in data.get("images", [])}


def dataset() -> dict:
    sizes = annotation_sizes()
    review = load_review()
    images = []
    if not IMAGES.is_dir():
        return {"images": [], "error": "No photos in models/data/images/"}

    for path in sorted(IMAGES.iterdir()):
        if path.suffix.lower() not in IMAGE_SUFFIXES:
            continue
        label_path = LABELS / f"{path.stem}.txt"
        boxes = parse_yolo(label_path.read_text()) if label_path.is_file() else []
        width, height = image_size(path, sizes)
        rec = review.get(path.name, {})
        images.append(
            {
                "file": path.name,
                "stem": path.stem,
                "width": width,
                "height": height,
                "boxes": boxes,
                "reviewed": bool(rec.get("reviewed")),
                "flags": flags_for(boxes),
            }
        )
    return {"images": images}


def update_annotations(stem: str, boxes: list[dict], width: int, height: int) -> None:
    if not ANNOTATIONS.is_file():
        return
    data = json.loads(ANNOTATIONS.read_text())
    for im in data.get("images", []):
        if Path(im["file"]).stem != stem:
            continue
        im["width"] = width
        im["height"] = height
        im["boxes"] = [
            {
                "xyxy": [round(v, 2) for v in yolo_to_xyxy(box, width, height)],
                "score": 1.0,
            }
            for box in boxes
        ]
        break
    hits = sum(1 for im in data["images"] if im.get("boxes"))
    total = sum(len(im.get("boxes") or []) for im in data["images"])
    data["summary"] = {
        "images": len(data["images"]),
        "with_box": hits,
        "without_box": len(data["images"]) - hits,
        "boxes": total,
    }
    ANNOTATIONS.write_text(json.dumps(data, indent=2) + "\n")


def oriented_jpeg(path: Path, max_edge: int | None = None) -> bytes:
    from PIL import Image, ImageOps

    key = f"{path.stem}_{max_edge or 'full'}.jpg"
    dest = CACHE / key
    CACHE.mkdir(parents=True, exist_ok=True)
    src_mtime = path.stat().st_mtime
    if dest.is_file() and dest.stat().st_mtime >= src_mtime:
        return dest.read_bytes()

    with ImageOps.exif_transpose(Image.open(path)) as im:
        rgb = im.convert("RGB")
        if max_edge and max(rgb.size) > max_edge:
            rgb.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        rgb.save(buf, format="JPEG", quality=88, optimize=True)
        data = buf.getvalue()
    dest.write_bytes(data)
    return data


def safe_image(name: str) -> Path | None:
    clean = Path(unquote(name)).name
    path = (IMAGES / clean).resolve()
    if IMAGES.resolve() not in path.parents and path.parent != IMAGES.resolve():
        return None
    if not path.is_file() or path.suffix.lower() not in IMAGE_SUFFIXES:
        return None
    return path


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        print(f"[{self.log_date_time_string()}] {fmt % args}", flush=True)

    def _send(self, code: int, body: bytes, content_type: str, cache: str = "no-store") -> None:
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", cache)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, code: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self._send(code, body, "application/json; charset=utf-8")

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = posixpath.normpath(unquote(parsed.path))

        if path in ("/", "/index.html"):
            page = STATIC / "index.html"
            self._send(200, page.read_bytes(), "text/html; charset=utf-8")
            return

        if path.startswith("/static/"):
            rel = path[len("/static/") :]
            dest = (STATIC / rel).resolve()
            if STATIC.resolve() not in dest.parents and dest.parent != STATIC.resolve():
                self._json(403, {"error": "forbidden"})
                return
            if not dest.is_file():
                self._json(404, {"error": "missing"})
                return
            mime = mimetypes.guess_type(dest.name)[0] or "application/octet-stream"
            self._send(200, dest.read_bytes(), mime)
            return

        if path == "/api/dataset":
            self._json(200, dataset())
            return

        if path.startswith("/media/"):
            img = safe_image(path[len("/media/") :])
            if img is None:
                self._json(404, {"error": "image not found"})
                return
            try:
                data = oriented_jpeg(img)
            except Exception:
                data = img.read_bytes()
            self._send(200, data, "image/jpeg", cache="max-age=3600")
            return

        if path.startswith("/thumb/"):
            img = safe_image(path[len("/thumb/") :])
            if img is None:
                self._json(404, {"error": "image not found"})
                return
            try:
                data = oriented_jpeg(img, max_edge=420)
            except Exception:
                data = img.read_bytes()
            self._send(200, data, "image/jpeg", cache="max-age=3600")
            return

        self._json(404, {"error": "not found"})

    def do_PUT(self) -> None:
        parsed = urlparse(self.path)
        path = posixpath.normpath(unquote(parsed.path))
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            payload = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self._json(400, {"error": "invalid json"})
            return

        if not path.startswith("/api/labels/"):
            self._json(404, {"error": "not found"})
            return

        stem = Path(path[len("/api/labels/") :]).name
        if not stem or stem != Path(stem).stem:
            self._json(400, {"error": "bad stem"})
            return

        boxes = payload.get("boxes") or []
        cleaned = []
        for box in boxes:
            w = max(0.002, min(1.0, float(box["w"])))
            h = max(0.002, min(1.0, float(box["h"])))
            cx = min(1.0 - w / 2, max(w / 2, float(box["cx"])))
            cy = min(1.0 - h / 2, max(h / 2, float(box["cy"])))
            cleaned.append({"cls": 0, "cx": cx, "cy": cy, "w": w, "h": h})

        LABELS.mkdir(parents=True, exist_ok=True)
        (LABELS / f"{stem}.txt").write_text(to_yolo(cleaned))

        width = int(payload.get("width") or 0)
        height = int(payload.get("height") or 0)
        if width and height:
            update_annotations(stem, cleaned, width, height)

        review = load_review()
        file_name = payload.get("file") or f"{stem}.JPG"
        rec = review.get(file_name, {})
        if "reviewed" in payload:
            rec["reviewed"] = bool(payload["reviewed"])
        rec["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%S")
        rec["boxes"] = len(cleaned)
        review[file_name] = rec
        save_review(review)

        self._json(
            200,
            {
                "ok": True,
                "boxes": len(cleaned),
                "reviewed": bool(rec.get("reviewed")),
                "flags": flags_for(cleaned),
            },
        )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--no-open", action="store_true")
    args = parser.parse_args()

    if not STATIC.is_dir():
        raise SystemExit(f"Missing UI files in {STATIC}")

    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    url = f"http://{args.host}:{args.port}/"
    print(f"Skim box editor → {url}", flush=True)
    print("Existing YOLO boxes are loaded. Save writes models/data/labels/", flush=True)
    if not args.no_open:
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.", flush=True)
        httpd.server_close()


if __name__ == "__main__":
    main()
