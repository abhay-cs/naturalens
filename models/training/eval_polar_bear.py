#!/usr/bin/env python3
"""Evaluate a trained polar-bear checkpoint on the COCO val holdout.

    models/.venv/bin/python models/training/eval_polar_bear.py
    models/.venv/bin/python models/training/eval_polar_bear.py --ckpt models/weights/polar_bear_ssdlite.pt

Writes models/evaluation/results/polar_bear.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import torch

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from train_polar_bear import (
    WEIGHTS,
    PolarCoco,
    build_model,
    evaluate_map,
    export_onnx,
    export_tflite,
    pick_device,
    predict_dataset,
)

RESULTS = REPO / "models" / "evaluation" / "results"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ckpt", type=Path, default=WEIGHTS / "polar_bear_ssdlite.pt")
    parser.add_argument("--score", type=float, default=0.3)
    parser.add_argument("--export", action="store_true", help="Also export ONNX + TFLite")
    args = parser.parse_args()

    if not args.ckpt.is_file():
        raise SystemExit(f"Missing checkpoint: {args.ckpt}")

    device = pick_device()
    ckpt = torch.load(args.ckpt, map_location="cpu", weights_only=False)
    model = build_model(pretrained=False)
    model.load_state_dict(ckpt["model"])
    model.to(device)

    val_ds = PolarCoco("val", augment=False)
    preds = predict_dataset(model, val_ds, device, score_thresh=0.15)
    metrics = evaluate_map(preds, iou_thresh=0.5, score_thresh=args.score)
    metrics["arch"] = ckpt.get("arch", "ssdlite320_mobilenet_v3_large")
    metrics["ckpt"] = str(args.ckpt)
    metrics["best_epoch"] = ckpt.get("epoch")
    metrics["score_thresh"] = args.score
    focus = {"IMG_0223.JPG", "IMG_0226.JPG", "IMG_0263.JPG"}
    metrics["huddle_focus"] = [r for r in metrics["per_image"] if r["file"] in focus]

    RESULTS.mkdir(parents=True, exist_ok=True)
    out = RESULTS / "polar_bear.json"
    out.write_text(json.dumps(metrics, indent=2) + "\n")
    print(
        f"mAP@0.5={metrics['map50']:.3f}  P={metrics['precision']:.3f}  "
        f"R={metrics['recall']:.3f}  → {out}"
    )
    for row in metrics["huddle_focus"]:
        print(
            f"  {row['file']}: gt={row.get('gt_count', row.get('gt'))} pred={row.get('pred_count', row.get('pred'))} "
            f"tp={row['tp']} fp={row['fp']} fn={row['fn']}"
        )

    if args.export:
        onnx_path = WEIGHTS / "polar_bear_ssdlite.onnx"
        export_onnx(model, onnx_path, device)
        export_tflite(onnx_path, WEIGHTS / "polar_bear_edlite0.tflite")


if __name__ == "__main__":
    main()
