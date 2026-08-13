#!/usr/bin/env python3
"""Propose polar-bear boxes with a COCO-pretrained detector.

COCO already has a `bear` class. Polar bears transfer reasonably; mixed shots
(people, ice, distant specks) will still need a skim of models/data/previews/.

Does not commit photos. Writes:

  models/data/images/           extracted photos
  models/data/labels/*.txt      YOLO: class x_center y_center width height (0–1)
  models/data/annotations.json  boxes + scores, including empties
  models/data/split.json        train / val holdout (~20%)
  models/data/previews/*.jpg    boxes drawn on, for review
"""

from __future__ import annotations

import argparse
import json
import random
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[2]
DATA = REPO / "models" / "data"
IMAGES = DATA / "images"
LABELS = DATA / "labels"
PREVIEWS = DATA / "previews"

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}

# torchvision Faster R-CNN uses 1-indexed COCO names; 23 is bear.
BEAR_LABEL = 23
POLAR_BEAR_CLASS = 0  # YOLO class id we write


def find_zip(explicit: Path | None) -> Path:
    if explicit:
        path = explicit if explicit.is_absolute() else REPO / explicit
        if not path.is_file():
            raise SystemExit(f"Zip not found: {path}")
        return path

    zips = sorted(DATA.glob("*.zip"))
    if not zips:
        raise SystemExit(
            "No zip in models/data/. This cloud workspace cannot see files that "
            "only exist on your laptop — upload the zip into models/data/ and rerun."
        )
    if len(zips) > 1:
        names = ", ".join(z.name for z in zips)
        raise SystemExit(f"Several zips in models/data/ ({names}). Pass --zip.")
    return zips[0]


def extract_images(zip_path: Path) -> list[Path]:
    IMAGES.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    used_names: set[str] = set()

    with zipfile.ZipFile(zip_path) as zf:
        for info in zf.infolist():
            if info.is_dir() or info.filename.startswith("__MACOSX/"):
                continue
            suffix = Path(info.filename).suffix.lower()
            if suffix not in IMAGE_SUFFIXES:
                continue

            name = Path(info.filename).name
            stem, ext = Path(name).stem, Path(name).suffix
            candidate = name
            n = 2
            while candidate.lower() in used_names:
                candidate = f"{stem}_{n}{ext}"
                n += 1
            used_names.add(candidate.lower())

            dest = IMAGES / candidate
            dest.write_bytes(zf.read(info))
            written.append(dest)

    if not written:
        raise SystemExit(f"No images inside {zip_path.name}.")
    return sorted(written)


def load_detector(score_threshold: float):
    import torch
    from torchvision.models.detection import (
        FasterRCNN_MobileNet_V3_Large_FPN_Weights,
        fasterrcnn_mobilenet_v3_large_fpn,
    )

    weights = FasterRCNN_MobileNet_V3_Large_FPN_Weights.DEFAULT
    model = fasterrcnn_mobilenet_v3_large_fpn(weights=weights)
    model.eval()
    model.transform.min_size = (800,)
    model.transform.max_size = 1333
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    return model, weights.transforms(), device, score_threshold


def detect_bears(model, transform, device, image: Image.Image, min_score: float):
    import torch

    rgb = image.convert("RGB")
    tensor = transform(rgb).to(device)
    with torch.no_grad():
        out = model([tensor])[0]

    boxes = []
    for box, label, score in zip(out["boxes"], out["labels"], out["scores"]):
        if int(label) != BEAR_LABEL:
            continue
        conf = float(score)
        if conf < min_score:
            continue
        x1, y1, x2, y2 = [float(v) for v in box.tolist()]
        boxes.append({"xyxy": [x1, y1, x2, y2], "score": conf})
    boxes.sort(key=lambda b: b["score"], reverse=True)
    return boxes


def to_yolo(xyxy: list[float], width: int, height: int) -> str:
    x1, y1, x2, y2 = xyxy
    bw = max(0.0, x2 - x1)
    bh = max(0.0, y2 - y1)
    cx = (x1 + x2) / 2 / width
    cy = (y1 + y2) / 2 / height
    return f"{POLAR_BEAR_CLASS} {cx:.6f} {cy:.6f} {bw / width:.6f} {bh / height:.6f}"


def draw_preview(image: Image.Image, boxes: list[dict], dest: Path) -> None:
    rgb = image.convert("RGB")
    draw = ImageDraw.Draw(rgb)
    try:
        font = ImageFont.load_default()
    except OSError:
        font = None

    for i, box in enumerate(boxes, start=1):
        x1, y1, x2, y2 = box["xyxy"]
        draw.rectangle([x1, y1, x2, y2], outline=(0, 180, 80), width=4)
        caption = f"{i}  {box['score']:.2f}"
        draw.rectangle([x1, max(0, y1 - 18), x1 + 70, y1], fill=(0, 180, 80))
        draw.text((x1 + 4, y1 - 16), caption, fill="white", font=font)

    dest.parent.mkdir(parents=True, exist_ok=True)
    rgb.save(dest, quality=85)


def write_split(records: list[dict], val_count: int, seed: int) -> dict:
    rng = random.Random(seed)
    with_boxes = [r["file"] for r in records if r["boxes"]]
    empty = [r["file"] for r in records if not r["boxes"]]
    rng.shuffle(with_boxes)
    n_val = min(val_count, max(1, len(with_boxes) // 5) if val_count <= 0 else val_count)
    n_val = min(n_val, max(0, len(with_boxes) - 1))
    val = sorted(with_boxes[:n_val])
    train = sorted(with_boxes[n_val:] + empty)
    return {"seed": seed, "train": train, "val": val}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--zip", type=Path, help="Zip of photos. Default: the only *.zip in models/data/")
    parser.add_argument("--min-score", type=float, default=0.25)
    parser.add_argument("--val-count", type=int, default=20, help="Hold-out size among images that have a box")
    parser.add_argument("--seed", type=int, default=13)
    args = parser.parse_args()

    DATA.mkdir(parents=True, exist_ok=True)
    zip_path = find_zip(args.zip)
    print(f"Extracting {zip_path.name} …")
    images = extract_images(zip_path)
    print(f"{len(images)} images")

    print("Loading COCO Faster R-CNN (MobileNet V3) …")
    model, transform, device, min_score = load_detector(args.min_score)
    print(f"Running on {device}  min_score={min_score}")

    LABELS.mkdir(parents=True, exist_ok=True)
    PREVIEWS.mkdir(parents=True, exist_ok=True)

    records: list[dict] = []
    hits = 0
    total_boxes = 0

    for i, path in enumerate(images, start=1):
        image = Image.open(path)
        width, height = image.size
        boxes = detect_bears(model, transform, device, image, min_score)
        yolo_lines = [to_yolo(b["xyxy"], width, height) for b in boxes]
        (LABELS / f"{path.stem}.txt").write_text("\n".join(yolo_lines) + ("\n" if yolo_lines else ""))
        draw_preview(image, boxes, PREVIEWS / f"{path.stem}.jpg")

        records.append(
            {
                "file": path.name,
                "width": width,
                "height": height,
                "boxes": [
                    {
                        "xyxy": [round(v, 2) for v in b["xyxy"]],
                        "score": round(b["score"], 4),
                    }
                    for b in boxes
                ],
            }
        )
        if boxes:
            hits += 1
            total_boxes += len(boxes)
        print(f"[{i}/{len(images)}] {path.name}: {len(boxes)} bear(s)")

    annotations = {
        "source_zip": zip_path.name,
        "detector": "torchvision.fasterrcnn_mobilenet_v3_large_fpn",
        "coco_class": "bear",
        "min_score": min_score,
        "images": records,
        "summary": {
            "images": len(records),
            "with_box": hits,
            "without_box": len(records) - hits,
            "boxes": total_boxes,
        },
    }
    (DATA / "annotations.json").write_text(json.dumps(annotations, indent=2) + "\n")

    split = write_split(records, args.val_count, args.seed)
    (DATA / "split.json").write_text(json.dumps(split, indent=2) + "\n")

    print()
    print(
        f"Done. {hits}/{len(records)} images have at least one box "
        f"({total_boxes} boxes). Val holdout: {len(split['val'])}."
    )
    print(f"Skim {PREVIEWS.relative_to(REPO)} then delete bad boxes in labels/.")


if __name__ == "__main__":
    main()
