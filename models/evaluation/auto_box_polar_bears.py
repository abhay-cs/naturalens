#!/usr/bin/env python3
"""Propose polar-bear boxes (and silhouettes) with a strong COCO detector.

Uses Mask R-CNN ResNet-50 FPN v2 on the best available device (Apple GPU /
CUDA / CPU), multi-scale inference, and a horizontal-flip pass, then NMS.

COCO's `bear` class transfers to polar bears. Mixed shots still need a skim
of models/data/previews/. Photos stay gitignored.

Writes:

  models/data/images/           extracted photos (skips tiny Google thumbs)
  models/data/labels/*.txt      YOLO boxes
  models/data/masks/*.png       instance silhouettes (white = bear)
  models/data/annotations.json  boxes, scores, mask paths
  models/data/split.json        train / val holdout
  models/data/previews/*.jpg    silhouette + box overlay for review
"""

from __future__ import annotations

import argparse
import json
import random
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

REPO = Path(__file__).resolve().parents[2]
DATA = REPO / "models" / "data"
IMAGES = DATA / "images"
LABELS = DATA / "labels"
MASKS = DATA / "masks"
PREVIEWS = DATA / "previews"

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}
THUMB_PREFIXES = ("th-", "thumb")
MIN_IMAGE_BYTES = 50_000
MIN_IMAGE_EDGE = 400

# torchvision detection models use 1-indexed COCO names; 23 is bear.
BEAR_LABEL = 23
POLAR_BEAR_CLASS = 0

# Two scales + flip is the quality/speed tradeoff on an M-series Mac.
SCALES = (800, 1280)


def pick_device():
    import torch

    if torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def find_zip(explicit: Path | None) -> Path:
    if explicit:
        path = explicit if explicit.is_absolute() else REPO / explicit
        if not path.is_file():
            raise SystemExit(f"Zip not found: {path}")
        return path

    zips = sorted(DATA.glob("*.zip"))
    if not zips:
        raise SystemExit(
            "No zip in models/data/. Pass --zip /path/to/photos.zip"
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
            path_in_zip = Path(info.filename)
            suffix = path_in_zip.suffix.lower()
            if suffix not in IMAGE_SUFFIXES:
                continue
            name = path_in_zip.name
            if name.startswith(THUMB_PREFIXES) or info.file_size < MIN_IMAGE_BYTES:
                continue

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
        raise SystemExit(f"No full-size images inside {zip_path.name}.")
    return sorted(written)


def load_detector():
    import torch
    from torchvision.models.detection import (
        MaskRCNN_ResNet50_FPN_V2_Weights,
        maskrcnn_resnet50_fpn_v2,
    )

    weights = MaskRCNN_ResNet50_FPN_V2_Weights.DEFAULT
    model = maskrcnn_resnet50_fpn_v2(weights=weights, box_score_thresh=0.0)
    model.eval()
    device = pick_device()
    model.to(device)
    return model, weights.transforms(), device


def _forward(model, transform, device, rgb: Image.Image, min_size: int):
    import torch

    model.transform.min_size = (min_size,)
    model.transform.max_size = max(1333, int(min_size * 1.7))
    tensor = transform(rgb).to(device)
    with torch.no_grad():
        out = model([tensor])[0]
    return out


def _collect(out, min_score: float, width: int, height: int, flip: bool):
    import torch

    found = []
    boxes = out["boxes"]
    labels = out["labels"]
    scores = out["scores"]
    masks = out.get("masks")

    for i in range(len(labels)):
        if int(labels[i]) != BEAR_LABEL:
            continue
        conf = float(scores[i])
        if conf < min_score:
            continue
        x1, y1, x2, y2 = [float(v) for v in boxes[i].tolist()]
        if flip:
            x1, x2 = width - x2, width - x1
        bw, bh = x2 - x1, y2 - y1
        if bw < 8 or bh < 8:
            continue
        if (bw * bh) / (width * height) < 0.002:
            continue

        mask = None
        if masks is not None:
            m = masks[i, 0]
            if flip:
                m = torch.flip(m, dims=[1])
            mask = (m > 0.5).to(torch.uint8).cpu()

        found.append({"xyxy": [x1, y1, x2, y2], "score": conf, "mask": mask})
    return found


def nms(dets: list[dict], iou_thresh: float = 0.5) -> list[dict]:
    import torch
    from torchvision.ops import nms as tv_nms

    if len(dets) <= 1:
        return dets
    boxes = torch.tensor([d["xyxy"] for d in dets], dtype=torch.float32)
    scores = torch.tensor([d["score"] for d in dets], dtype=torch.float32)
    keep = tv_nms(boxes, scores, iou_thresh).tolist()
    kept = [dets[i] for i in keep]
    return suppress_nested(kept, contain=0.5)


def _area(xyxy: list[float]) -> float:
    return max(0.0, xyxy[2] - xyxy[0]) * max(0.0, xyxy[3] - xyxy[1])


def suppress_nested(dets: list[dict], contain: float = 0.7) -> list[dict]:
    """Drop a box that mostly sits inside a higher-scoring one (heads, paws)."""
    remaining = sorted(dets, key=lambda d: d["score"], reverse=True)
    kept: list[dict] = []
    for det in remaining:
        x1, y1, x2, y2 = det["xyxy"]
        area = _area(det["xyxy"])
        if area <= 0:
            continue
        nested = False
        for parent in kept:
            px1, py1, px2, py2 = parent["xyxy"]
            ix1, iy1 = max(x1, px1), max(y1, py1)
            ix2, iy2 = min(x2, px2), min(y2, py2)
            inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
            if inter / area >= contain:
                nested = True
                break
        if not nested:
            kept.append(det)
    return kept


def detect_bears(model, transform, device, image: Image.Image, min_score: float):
    rgb = image.convert("RGB")
    width, height = rgb.size
    dets: list[dict] = []

    for scale in SCALES:
        out = _forward(model, transform, device, rgb, scale)
        dets.extend(_collect(out, min_score, width, height, flip=False))

        flipped = rgb.transpose(Image.FLIP_LEFT_RIGHT)
        out_f = _forward(model, transform, device, flipped, scale)
        dets.extend(_collect(out_f, min_score, width, height, flip=True))

    dets.sort(key=lambda d: d["score"], reverse=True)
    return nms(dets, iou_thresh=0.5)


def to_yolo(xyxy: list[float], width: int, height: int) -> str:
    x1, y1, x2, y2 = xyxy
    bw = max(0.0, x2 - x1)
    bh = max(0.0, y2 - y1)
    cx = (x1 + x2) / 2 / width
    cy = (y1 + y2) / 2 / height
    return f"{POLAR_BEAR_CLASS} {cx:.6f} {cy:.6f} {bw / width:.6f} {bh / height:.6f}"


def save_mask(dets: list[dict], width: int, height: int, dest: Path) -> None:
    import torch

    canvas = torch.zeros((height, width), dtype=torch.uint8)
    for det in dets:
        m = det.get("mask")
        if m is None:
            continue
        mh, mw = m.shape
        if (mw, mh) != (width, height):
            m_img = Image.fromarray(m.numpy() * 255, mode="L").resize(
                (width, height), Image.NEAREST
            )
            import numpy as np

            m = torch.from_numpy((np.array(m_img) > 127).astype("uint8"))
        canvas = torch.maximum(canvas, m)
    dest.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(canvas.numpy() * 255, mode="L").save(dest)


def draw_preview(image: Image.Image, dets: list[dict], dest: Path) -> None:
    rgb = image.convert("RGB")
    overlay = rgb.copy()
    draw_o = ImageDraw.Draw(overlay)

    for det in dets:
        m = det.get("mask")
        if m is None:
            continue
        mask_img = Image.fromarray(m.numpy() * 255, mode="L")
        if mask_img.size != rgb.size:
            mask_img = mask_img.resize(rgb.size, Image.NEAREST)
        color = Image.new("RGB", rgb.size, (0, 180, 80))
        overlay = Image.composite(color, overlay, mask_img)

    blended = Image.blend(rgb, overlay, 0.35)
    draw = ImageDraw.Draw(blended)
    try:
        font = ImageFont.load_default()
    except OSError:
        font = None

    for i, det in enumerate(dets, start=1):
        x1, y1, x2, y2 = det["xyxy"]
        draw.rectangle([x1, y1, x2, y2], outline=(0, 180, 80), width=4)
        caption = f"{i}  {det['score']:.2f}"
        draw.rectangle([x1, max(0, y1 - 18), x1 + 72, y1], fill=(0, 180, 80))
        draw.text((x1 + 4, y1 - 16), caption, fill="white", font=font)

    dest.parent.mkdir(parents=True, exist_ok=True)
    blended.save(dest, quality=85)


def write_split(records: list[dict], val_count: int, seed: int) -> dict:
    rng = random.Random(seed)
    with_boxes = [r["file"] for r in records if r["boxes"]]
    empty = [r["file"] for r in records if not r["boxes"]]
    rng.shuffle(with_boxes)
    n_val = val_count if val_count > 0 else max(1, len(with_boxes) // 5)
    n_val = min(n_val, max(0, len(with_boxes) - 1))
    val = sorted(with_boxes[:n_val])
    train = sorted(with_boxes[n_val:] + empty)
    return {"seed": seed, "train": train, "val": val}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--zip", type=Path, help="Zip of photos. Default: the only *.zip in models/data/")
    parser.add_argument("--min-score", type=float, default=0.2)
    parser.add_argument("--val-count", type=int, default=20)
    parser.add_argument("--seed", type=int, default=13)
    args = parser.parse_args()

    DATA.mkdir(parents=True, exist_ok=True)
    zip_path = find_zip(args.zip)
    print(f"Extracting {zip_path.name} …", flush=True)
    images = extract_images(zip_path)
    kept = []
    for path in images:
        with ImageOps.exif_transpose(Image.open(path)) as im:
            if min(im.size) < MIN_IMAGE_EDGE:
                path.unlink()
                continue
        kept.append(path)
    images = kept
    print(f"{len(images)} full-size photos")

    print("Loading COCO Mask R-CNN ResNet-50 FPN v2 …")
    model, transform, device = load_detector()
    print(f"Device: {device}  scales: {SCALES}  TTA: flip  min_score={args.min_score}", flush=True)

    LABELS.mkdir(parents=True, exist_ok=True)
    MASKS.mkdir(parents=True, exist_ok=True)
    PREVIEWS.mkdir(parents=True, exist_ok=True)

    records: list[dict] = []
    hits = 0
    total_boxes = 0

    for i, path in enumerate(images, start=1):
        image = ImageOps.exif_transpose(Image.open(path))
        width, height = image.size
        dets = detect_bears(model, transform, device, image, args.min_score)

        yolo_lines = [to_yolo(d["xyxy"], width, height) for d in dets]
        (LABELS / f"{path.stem}.txt").write_text(
            "\n".join(yolo_lines) + ("\n" if yolo_lines else "")
        )
        mask_name = f"{path.stem}.png"
        save_mask(dets, width, height, MASKS / mask_name)
        draw_preview(image, dets, PREVIEWS / f"{path.stem}.jpg")

        records.append(
            {
                "file": path.name,
                "width": width,
                "height": height,
                "mask": f"masks/{mask_name}",
                "boxes": [
                    {
                        "xyxy": [round(v, 2) for v in d["xyxy"]],
                        "score": round(d["score"], 4),
                    }
                    for d in dets
                ],
            }
        )
        if dets:
            hits += 1
            total_boxes += len(dets)
        print(f"[{i}/{len(images)}] {path.name}: {len(dets)} bear(s)")

    annotations = {
        "source_zip": zip_path.name,
        "detector": "torchvision.maskrcnn_resnet50_fpn_v2",
        "coco_class": "bear",
        "device": str(device),
        "scales": list(SCALES),
        "tta": ["hflip"],
        "min_score": args.min_score,
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
