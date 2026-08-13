#!/usr/bin/env python3
"""Push local polar-bear photos into the labeler, or pull a run snapshot back.

Requires:
  pip install boto3 pillow requests

Env:
  R2_ACCOUNT_ID
  R2_ACCESS_KEY_ID
  R2_SECRET_ACCESS_KEY
  R2_BUCKET          (default: naturalens-data)
  LABELER_URL        (e.g. http://127.0.0.1:8787 or the workers.dev URL)

Examples:
  python models/tools/sync_r2.py --push
  python models/tools/sync_r2.py --pull 20260813T180000Z-abcd1234
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
DATA = REPO / "models" / "data"
IMAGES = DATA / "images"
LABELS = DATA / "labels"
REVIEW = DATA / "review.json"
SPLIT = DATA / "split.json"
ANNOTATIONS = DATA / "annotations.json"


def require_env(*keys: str) -> dict[str, str]:
    missing = [k for k in keys if not os.environ.get(k)]
    if missing:
        raise SystemExit(f"Missing env: {', '.join(missing)}")
    return {k: os.environ[k] for k in keys}


def s3_client():
    import boto3

    env = require_env("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY")
    endpoint = f"https://{env['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com"
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=env["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=env["R2_SECRET_ACCESS_KEY"],
        region_name="auto",
    )


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


def normalize_jpeg(path: Path) -> tuple[bytes, bytes, bytes, int, int]:
    from PIL import Image, ImageOps

    with ImageOps.exif_transpose(Image.open(path)) as im:
        rgb = im.convert("RGB")
        width, height = rgb.size

        def encode(img: Image.Image, quality: int) -> bytes:
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=quality, optimize=True)
            return buf.getvalue()

        full = encode(rgb, 92)
        display = rgb.copy()
        display.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
        thumb = rgb.copy()
        thumb.thumbnail((400, 400), Image.Resampling.LANCZOS)
        return full, encode(display, 88), encode(thumb, 82), width, height


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_split() -> dict[str, str]:
    mapping: dict[str, str] = {}
    if SPLIT.is_file():
        data = json.loads(SPLIT.read_text())
        for name in data.get("train", []):
            mapping[name] = "train"
        for name in data.get("val", []):
            mapping[name] = "val"
    return mapping


def load_review() -> dict:
    if REVIEW.is_file():
        return json.loads(REVIEW.read_text())
    return {}


def push(labeler_url: str) -> None:
    import requests

    splits = load_split()
    review = load_review()
    paths = sorted(
        p
        for p in IMAGES.iterdir()
        if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    )
    if not paths:
        raise SystemExit(f"No images in {IMAGES}")

    print(f"Pushing {len(paths)} images via {labeler_url}", flush=True)
    for i, path in enumerate(paths, 1):
        full, display, thumb, width, height = normalize_jpeg(path)
        image_id = sha256(full)
        label_path = LABELS / f"{path.stem}.txt"
        boxes = parse_yolo(label_path.read_text()) if label_path.is_file() else []
        split = splits.get(path.name, "train")

        files = {
            "image": (f"{image_id}.jpg", full, "image/jpeg"),
            "display": (f"{image_id}-display.jpg", display, "image/jpeg"),
            "thumb": (f"{image_id}-thumb.jpg", thumb, "image/jpeg"),
            "original": (path.name, path.read_bytes(), "application/octet-stream"),
        }
        data = {
            "id": image_id,
            "file": path.name,
            "width": str(width),
            "height": str(height),
            "split": split,
            "boxes": json.dumps(boxes),
        }
        res = requests.post(f"{labeler_url.rstrip('/')}/api/upload", data=data, files=files, timeout=120)
        if res.status_code >= 400:
            raise SystemExit(f"upload failed for {path.name}: {res.status_code} {res.text}")
        up = res.json()
        version = int(up.get("version", 0))

        # Re-save labels with reviewed flag so history + review state are correct.
        if boxes or review.get(path.name, {}).get("reviewed"):
            body = {
                "version": version,
                "boxes": boxes,
                "reviewed": bool(review.get(path.name, {}).get("reviewed")),
            }
            put = requests.put(
                f"{labeler_url.rstrip('/')}/api/labels/{image_id}",
                json=body,
                timeout=60,
            )
            # Fresh upload starts at version 0; if already present, use returned version.
            if put.status_code == 409:
                current = put.json().get("current") or {}
                body["version"] = current.get("version", version)
                put = requests.put(
                    f"{labeler_url.rstrip('/')}/api/labels/{image_id}",
                    json=body,
                    timeout=60,
                )
            if put.status_code >= 400:
                print(f"  warn label {path.name}: {put.status_code} {put.text}", flush=True)

        print(
            f"[{i}/{len(paths)}] {path.name} -> {image_id[:12]}… "
            f"({'deduped' if up.get('deduped') else 'new'}) boxes={len(boxes)}",
            flush=True,
        )
    print("Done.", flush=True)


def pull(run_id: str, bucket: str, dest: Path) -> None:
    s3 = s3_client()
    key = f"runs/{run_id}/manifest.json"
    obj = s3.get_object(Bucket=bucket, Key=key)
    manifest = json.loads(obj["Body"].read())
    images_dir = dest / "images"
    labels_dir = dest / "labels"
    images_dir.mkdir(parents=True, exist_ok=True)
    labels_dir.mkdir(parents=True, exist_ok=True)

    train, val = [], []
    for item in manifest.get("images", []):
        file_name = item["file"]
        image_key = item.get("image_key") or f"images/{item['id']}.jpg"
        out_img = images_dir / file_name
        if not out_img.exists():
            blob = s3.get_object(Bucket=bucket, Key=image_key)["Body"].read()
            out_img.write_bytes(blob)
        lines = []
        for box in item.get("boxes") or []:
            lines.append(
                f"{int(box.get('cls', 0))} {box['cx']:.6f} {box['cy']:.6f} "
                f"{box['w']:.6f} {box['h']:.6f}"
            )
        (labels_dir / f"{Path(file_name).stem}.txt").write_text(
            ("\n".join(lines) + "\n") if lines else ""
        )
        if item.get("split") == "val":
            val.append(file_name)
        else:
            train.append(file_name)
        print(f"  {file_name}", flush=True)

    split = {"seed": 13, "train": train, "val": val, "run_id": run_id}
    (dest / "split.json").write_text(json.dumps(split, indent=2) + "\n")
    (dest / f"manifest_{run_id}.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Pulled {len(train)} train + {len(val)} val into {dest}", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--push", action="store_true", help="Seed local models/data into labeler")
    parser.add_argument("--pull", metavar="RUN_ID", help="Download a run snapshot into models/data")
    parser.add_argument("--dest", type=Path, default=DATA)
    args = parser.parse_args()

    if args.push == bool(args.pull):
        raise SystemExit("Specify exactly one of --push or --pull RUN_ID")

    if args.push:
        labeler = os.environ.get("LABELER_URL")
        if not labeler:
            raise SystemExit("Set LABELER_URL (e.g. http://127.0.0.1:8787)")
        push(labeler)
        return

    bucket = os.environ.get("R2_BUCKET", "naturalens-data")
    pull(args.pull, bucket, args.dest)


if __name__ == "__main__":
    main()
