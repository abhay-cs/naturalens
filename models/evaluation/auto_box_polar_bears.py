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
    model = maskrcnn_resnet50_fpn_v2(
        weights=weights,
        box_score_thresh=0.0,
        box_nms_thresh=0.75,
        box_detections_per_img=100,
    )
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


def nms(dets: list[dict], iou_thresh: float = 0.75) -> list[dict]:
    import torch
    from torchvision.ops import nms as tv_nms

    if len(dets) <= 1:
        return dets
    boxes = torch.tensor([d["xyxy"] for d in dets], dtype=torch.float32)
    scores = torch.tensor([d["score"] for d in dets], dtype=torch.float32)
    keep = tv_nms(boxes, scores, iou_thresh).tolist()
    return [dets[i] for i in keep]


def _area(xyxy: list[float]) -> float:
    return max(0.0, xyxy[2] - xyxy[0]) * max(0.0, xyxy[3] - xyxy[1])


def _box_iou(a: list[float], b: list[float]) -> float:
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    ix1, iy1 = max(ax1, bx1), max(ay1, by1)
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)
    inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
    union = _area(a) + _area(b) - inter
    return inter / union if union > 0 else 0.0


def _mask_array(det: dict):
    import numpy as np

    mask = det.get("mask")
    if mask is None:
        return None
    arr = mask.numpy() if hasattr(mask, "numpy") else np.asarray(mask)
    return (arr > 0).astype(np.uint8)


def _center(xyxy: list[float]) -> tuple[float, float]:
    return (xyxy[0] + xyxy[2]) / 2, (xyxy[1] + xyxy[3]) / 2


def suppress_nested(dets: list[dict], contain: float = 0.65, max_inner: float = 0.55) -> list[dict]:
    """Drop heads/paws inside a larger bear. Keep similar-sized overlapping bears."""
    remaining = sorted(dets, key=lambda d: d["score"], reverse=True)
    kept: list[dict] = []
    for det in remaining:
        area = _area(det["xyxy"])
        if area <= 0:
            continue
        x1, y1, x2, y2 = det["xyxy"]
        nested = False
        for parent in kept:
            parent_area = _area(parent["xyxy"])
            if parent_area <= 0 or area / parent_area > max_inner:
                continue
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


def drop_covering_parents(dets: list[dict], peer_frac: float = 0.35, parent_scale: float = 1.5) -> list[dict]:
    """Drop a merged box that contains two smaller, similar-sized bears."""
    if len(dets) < 3:
        return dets
    kept = []
    for i, det in enumerate(dets):
        x1, y1, x2, y2 = det["xyxy"]
        parent_area = _area(det["xyxy"])
        inside = 0
        for j, other in enumerate(dets):
            if i == j or parent_area <= 0:
                continue
            child_area = _area(other["xyxy"])
            if child_area / parent_area < peer_frac:
                continue
            if parent_area < parent_scale * child_area:
                continue
            if other["score"] < 0.85 * det["score"]:
                continue
            cx, cy = _center(other["xyxy"])
            if x1 <= cx <= x2 and y1 <= cy <= y2:
                inside += 1
        if inside < 2:
            kept.append(det)
    return kept or dets


def suppress_contained_weaker(dets: list[dict], contain: float = 0.55, score_frac: float = 0.8) -> list[dict]:
    """Drop a weaker box that mostly sits inside a stronger one (split shards, not huddle peers)."""
    remaining = sorted(dets, key=lambda d: d["score"], reverse=True)
    kept: list[dict] = []
    for det in remaining:
        area = _area(det["xyxy"])
        if area <= 0:
            continue
        x1, y1, x2, y2 = det["xyxy"]
        weaker = False
        for parent in kept:
            if det["score"] >= score_frac * parent["score"]:
                continue
            px1, py1, px2, py2 = parent["xyxy"]
            ix1, iy1 = max(x1, px1), max(y1, py1)
            ix2, iy2 = min(x2, px2), min(y2, py2)
            inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
            if inter / area >= contain:
                weaker = True
                break
        if not weaker:
            kept.append(det)
    return kept


def drop_weak_overlaps(dets: list[dict], min_score: float = 0.55, overlap: float = 0.18) -> list[dict]:
    """Drop low-score leftovers that sit on a high-confidence bear."""
    strong = [d for d in dets if d["score"] >= 0.9]
    if not strong:
        return dets
    kept = []
    for det in dets:
        if det["score"] >= min_score:
            kept.append(det)
            continue
        if any(_box_iou(det["xyxy"], s["xyxy"]) >= overlap for s in strong):
            continue
        kept.append(det)
    return kept


def drop_slivers(dets: list[dict], max_aspect: float = 0.42) -> list[dict]:
    """Drop thin leftover shards that sit between overlapping bears."""
    if len(dets) <= 1:
        return dets
    kept = []
    for det in dets:
        x1, y1, x2, y2 = det["xyxy"]
        w, h = max(1.0, x2 - x1), max(1.0, y2 - y1)
        if w / h < max_aspect:
            overlapping = any(
                other is not det and _box_iou(det["xyxy"], other["xyxy"]) > 0.05
                for other in dets
            )
            if overlapping:
                continue
        kept.append(det)
    return kept


def drop_fragments(dets: list[dict], min_frac: float = 0.22, overlap: float = 0.28) -> list[dict]:
    """Drop leftover split shards that sit on a larger bear. Keep distant small bears."""
    remaining = sorted(dets, key=lambda d: _area(d["xyxy"]), reverse=True)
    kept: list[dict] = []
    for det in remaining:
        area = _area(det["xyxy"])
        fragment = False
        for parent in kept:
            parent_area = _area(parent["xyxy"])
            if parent_area <= 0 or area / parent_area > min_frac:
                continue
            inter_frac = 0.0
            iou = _box_iou(det["xyxy"], parent["xyxy"])
            x1, y1, x2, y2 = det["xyxy"]
            px1, py1, px2, py2 = parent["xyxy"]
            ix1, iy1 = max(x1, px1), max(y1, py1)
            ix2, iy2 = min(x2, px2), min(y2, py2)
            inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
            if area > 0:
                inter_frac = inter / area
            if iou >= overlap or inter_frac >= 0.45:
                fragment = True
                break
        if not fragment:
            kept.append(det)
    return kept


def mask_nms(dets: list[dict], mask_iou: float = 0.55, box_iou: float = 0.58) -> list[dict]:
    """Collapse TTA duplicates and body-part boxes that share the same silhouette."""
    import numpy as np

    remaining = sorted(dets, key=lambda d: d["score"], reverse=True)
    kept: list[dict] = []
    masks = []
    for det in remaining:
        m = _mask_array(det)
        dup = False
        for parent, pm in zip(kept, masks):
            if _box_iou(det["xyxy"], parent["xyxy"]) >= box_iou:
                dup = True
                break
            if m is not None and pm is not None:
                inter = int(np.logical_and(m, pm).sum())
                union = int(np.logical_or(m, pm).sum())
                iou = inter / union if union else 0.0
                if iou >= mask_iou:
                    dup = True
                    break
        if not dup:
            kept.append(det)
            masks.append(m)
    return kept


def _box_from_mask(mask) -> list[float] | None:
    import numpy as np

    ys, xs = np.where(mask > 0)
    if len(xs) < 40:
        return None
    return [float(xs.min()), float(ys.min()), float(xs.max() + 1), float(ys.max() + 1)]


def split_merged_masks(dets: list[dict], depth: int = 0) -> list[dict]:
    """Split a silhouette that covers huddled bears into separate instances."""
    import numpy as np
    import torch
    from scipy.ndimage import (
        binary_opening,
        distance_transform_edt,
        label,
        maximum_filter,
    )

    split: list[dict] = []
    for det in dets:
        mask = det.get("mask")
        if mask is None:
            split.append(det)
            continue
        arr = mask.numpy() if hasattr(mask, "numpy") else np.asarray(mask)
        arr = (arr > 0).astype(np.uint8)
        total = int(arr.sum())
        if total < 80:
            split.append(det)
            continue

        opened = binary_opening(arr, iterations=2)
        labeled, n = label(opened)
        parts = []
        x1, y1, x2, y2 = det["xyxy"]
        bw, bh = max(1.0, x2 - x1), max(1.0, y2 - y1)
        if n >= 2 and bw / bh >= 1.35 and det["score"] >= 0.75:
            for idx in range(1, n + 1):
                piece = (labeled == idx).astype(np.uint8)
                if piece.sum() >= 0.28 * total:
                    parts.append(piece)
            if len(parts) >= 2:
                centroids = []
                for piece in parts:
                    ys, xs = np.where(piece > 0)
                    centroids.append((float(xs.mean()), float(ys.mean())))
                dx = abs(centroids[0][0] - centroids[1][0])
                dy = abs(centroids[0][1] - centroids[1][1])
                if dx < 0.22 * bw or dx < dy:
                    parts = []

        if len(parts) < 2:
            # Only split when the silhouette is wide (side-by-side huddle),
            # not a single sitting bear (head stacked on torso).
            if bw / bh < 1.35 or det["score"] < 0.75:
                split.append(det)
                continue
            dist = distance_transform_edt(arr)
            if dist.max() < 6:
                split.append(det)
                continue
            min_sep = max(14, int(0.22 * bw))
            peaks = (dist == maximum_filter(dist, size=min_sep)) & (dist > 0.4 * dist.max())
            peak_label, n_peaks = label(peaks)
            if n_peaks < 2:
                split.append(det)
                continue
            coords = []
            for idx in range(1, n_peaks + 1):
                ys, xs = np.where(peak_label == idx)
                coords.append((float(dist[ys, xs].max()), int(ys[0]), int(xs[0])))
            coords.sort(reverse=True)
            seeds = []
            for cand in coords:
                if all(abs(cand[2] - s[2]) >= min_sep * 0.65 for s in seeds):
                    seeds.append(cand)
                if len(seeds) >= 3:
                    break
            if len(seeds) < 2:
                split.append(det)
                continue
            if len(seeds) == 2:
                dy = abs(seeds[0][1] - seeds[1][1])
                dx = abs(seeds[0][2] - seeds[1][2])
                if dx < min_sep * 0.65 or dx < dy:
                    split.append(det)
                    continue
            yy, xx = np.indices(arr.shape)
            dmaps = [(yy - s[1]) ** 2 + (xx - s[2]) ** 2 for s in seeds]
            nearest = np.stack(dmaps, axis=0).argmin(axis=0) + 1
            regions = np.where(arr > 0, nearest, 0)
            parts = []
            min_part = 0.18 if len(seeds) == 2 else 0.14
            for idx in range(1, len(seeds) + 1):
                piece = (regions == idx).astype(np.uint8)
                if piece.sum() >= min_part * total:
                    parts.append(piece)

        if len(parts) < 2:
            split.append(det)
            continue

        children = []
        for piece in parts:
            box = _box_from_mask(piece)
            if box is None:
                continue
            children.append(
                {
                    "xyxy": box,
                    "score": float(det["score"]) * 0.98,
                    "mask": torch.from_numpy(piece),
                }
            )
        if depth < 2 and len(children) >= 2:
            split.extend(split_merged_masks(children, depth=depth + 1))
        else:
            split.extend(children)
    return split


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
    kept = nms(dets, iou_thresh=0.75)
    kept = suppress_nested(kept, contain=0.7, max_inner=0.35)
    kept = split_merged_masks(kept)
    kept = drop_covering_parents(kept)
    kept = mask_nms(kept)
    kept = drop_fragments(kept)
    kept = drop_slivers(kept)
    kept = drop_weak_overlaps(kept)
    kept = suppress_contained_weaker(kept)
    return suppress_nested(kept)


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
    parser.add_argument("--only", nargs="*", help="Only these filenames or stems, e.g. IMG_0243 IMG_0255")
    parser.add_argument("--reuse-images", action="store_true", help="Use models/data/images/ instead of re-extracting")
    args = parser.parse_args()

    DATA.mkdir(parents=True, exist_ok=True)
    zip_path = None
    if args.reuse_images and any(IMAGES.glob("*")):
        images = sorted(
            p for p in IMAGES.iterdir() if p.suffix.lower() in IMAGE_SUFFIXES
        )
        print(f"Reusing {len(images)} images in {IMAGES}", flush=True)
    else:
        zip_path = find_zip(args.zip)
        print(f"Extracting {zip_path.name} …", flush=True)
        images = extract_images(zip_path)

    kept = []
    for path in images:
        with ImageOps.exif_transpose(Image.open(path)) as im:
            if min(im.size) < MIN_IMAGE_EDGE:
                if not args.reuse_images:
                    path.unlink()
                continue
        kept.append(path)
    images = kept

    if args.only:
        wanted = {s.lower().removesuffix(".jpg").removesuffix(".jpeg") for s in args.only}
        images = [p for p in images if p.stem.lower() in wanted or p.name.lower() in {s.lower() for s in args.only}]
        if not images:
            raise SystemExit(f"No images matched --only {args.only}")

    print(f"{len(images)} photos to box", flush=True)

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
        print(f"[{i}/{len(images)}] {path.name}: {len(dets)} bear(s)", flush=True)

    if args.only and (DATA / "annotations.json").exists():
        existing = json.loads((DATA / "annotations.json").read_text())
        by_file = {im["file"]: im for im in existing["images"]}
        for rec in records:
            by_file[rec["file"]] = rec
        records = [by_file[k] for k in sorted(by_file)]
        zip_name = existing.get("source_zip", "")
        hits = sum(1 for r in records if r["boxes"])
        total_boxes = sum(len(r["boxes"]) for r in records)
    else:
        zip_name = zip_path.name if zip_path else ""

    annotations = {
        "source_zip": zip_name,
        "detector": "torchvision.maskrcnn_resnet50_fpn_v2",
        "coco_class": "bear",
        "device": str(device),
        "scales": list(SCALES),
        "tta": ["hflip"],
        "min_score": args.min_score,
        "huddle_split": True,
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
