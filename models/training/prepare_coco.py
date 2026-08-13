#!/usr/bin/env python3
"""Pack YOLO polar-bear labels into COCO train/val folders.

Reads models/data/{images,labels,split.json} and writes:

  models/data/coco/train/images/   (symlinks)
  models/data/coco/train/_annotations.coco.json
  models/data/coco/val/images/
  models/data/coco/val/_annotations.coco.json

Also writes MediaPipe Model Maker CSV sidecars:

  models/data/coco/train/annotations.csv
  models/data/coco/val/annotations.csv

    models/.venv/bin/python models/training/prepare_coco.py
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageOps

REPO = Path(__file__).resolve().parents[2]
DATA = REPO / "models" / "data"
IMAGES = DATA / "images"
LABELS = DATA / "labels"
SPLIT = DATA / "split.json"
COCO = DATA / "coco"

CATEGORY = {"id": 1, "name": "polar_bear", "supercategory": "animal"}


def yolo_to_xywh(cx: float, cy: float, w: float, h: float, width: int, height: int):
    bw = w * width
    bh = h * height
    x = (cx * width) - bw / 2
    y = (cy * height) - bh / 2
    x = max(0.0, min(float(width - 1), x))
    y = max(0.0, min(float(height - 1), y))
    bw = max(1.0, min(float(width) - x, bw))
    bh = max(1.0, min(float(height) - y, bh))
    return [x, y, bw, bh]


def parse_yolo(path: Path) -> list[tuple[float, float, float, float]]:
    boxes = []
    if not path.is_file():
        return boxes
    for line in path.read_text().splitlines():
        parts = line.split()
        if len(parts) < 5:
            continue
        _, cx, cy, w, h = parts[:5]
        boxes.append((float(cx), float(cy), float(w), float(h)))
    return boxes


def find_image(name: str) -> Path | None:
    direct = IMAGES / name
    if direct.is_file():
        return direct
    stem = Path(name).stem
    for p in IMAGES.iterdir():
        if p.stem == stem and p.is_file():
            return p
    return None


def build_split(names: list[str], split_name: str) -> tuple[dict, list[str]]:
    out_dir = COCO / split_name
    img_dir = out_dir / "images"
    if img_dir.exists():
        for p in img_dir.iterdir():
            p.unlink()
    else:
        img_dir.mkdir(parents=True, exist_ok=True)

    coco = {
        "info": {
            "description": "NaturaLens polar bear detector",
            "version": "1.0",
            "year": datetime.now(timezone.utc).year,
            "date_created": datetime.now(timezone.utc).isoformat(),
        },
        "licenses": [],
        "categories": [CATEGORY],
        "images": [],
        "annotations": [],
    }
    csv_rows = ["image,xmin,ymin,xmax,ymax,label"]
    ann_id = 1

    for image_id, name in enumerate(names, start=1):
        src = find_image(name)
        if src is None:
            print(f"  skip missing image: {name}", file=sys.stderr)
            continue

        with ImageOps.exif_transpose(Image.open(src)) as im:
            width, height = im.size

        dest = img_dir / src.name
        if dest.exists() or dest.is_symlink():
            dest.unlink()
        dest.symlink_to(src.resolve())

        coco["images"].append(
            {
                "id": image_id,
                "file_name": src.name,
                "width": width,
                "height": height,
            }
        )

        for cx, cy, w, h in parse_yolo(LABELS / f"{src.stem}.txt"):
            x, y, bw, bh = yolo_to_xywh(cx, cy, w, h, width, height)
            coco["annotations"].append(
                {
                    "id": ann_id,
                    "image_id": image_id,
                    "category_id": 1,
                    "bbox": [round(x, 2), round(y, 2), round(bw, 2), round(bh, 2)],
                    "area": round(bw * bh, 2),
                    "iscrowd": 0,
                    "segmentation": [],
                }
            )
            csv_rows.append(
                f"{src.name},{int(x)},{int(y)},{int(x + bw)},{int(y + bh)},polar_bear"
            )
            ann_id += 1

    (out_dir / "_annotations.coco.json").write_text(json.dumps(coco, indent=2) + "\n")
    (out_dir / "annotations.csv").write_text("\n".join(csv_rows) + "\n")
    return coco, csv_rows


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--split", type=Path, default=SPLIT)
    args = parser.parse_args()

    if not IMAGES.is_dir():
        raise SystemExit(f"No images at {IMAGES}")
    if not args.split.is_file():
        raise SystemExit(f"Missing split file: {args.split}")

    split = json.loads(args.split.read_text())
    train_names = split["train"]
    val_names = split["val"]

    print(f"Packing COCO → {COCO}")
    train, _ = build_split(train_names, "train")
    val, _ = build_split(val_names, "val")

    summary = {
        "train_images": len(train["images"]),
        "train_boxes": len(train["annotations"]),
        "val_images": len(val["images"]),
        "val_boxes": len(val["annotations"]),
        "category": CATEGORY["name"],
    }
    (COCO / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(
        f"Done. train {summary['train_images']} imgs / {summary['train_boxes']} boxes; "
        f"val {summary['val_images']} imgs / {summary['val_boxes']} boxes."
    )


if __name__ == "__main__":
    main()
