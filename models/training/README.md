# NaturaLens — Model Training

Fine-tune a **one-class polar-bear detector** on the reviewed field photos, score it on the 20-image holdout, and export ONNX / TFLite for a later on-device app build.

**Status:** SSDLite320 MobileNetV3-Large (torchvision). EfficientDet-Lite via MediaPipe Model Maker needs TensorFlow `<2.16`, which has no Python 3.12 wheels — this is the planned mobile fallback (Apache/BSD via torchvision).

## Setup

```bash
# Reuse the autobox venv (torch + MPS already installed)
models/.venv/bin/pip install -r models/training/requirements-train.txt
```

Optional TFLite conversion extras (separate venv — heavy):

```bash
python3.12 -m venv models/.venv-train
models/.venv-train/bin/pip install tensorflow onnx2tf
```

## Pipeline

```bash
# 1. Pack YOLO labels → COCO train/val (symlinks + JSON + CSV)
models/.venv/bin/python models/training/prepare_coco.py

# 2. Train (Apple GPU / CUDA / CPU). Writes checkpoint + val metrics + ONNX.
models/.venv/bin/python models/training/train_polar_bear.py --epochs 30

# 3. Re-score a checkpoint / export again
models/.venv/bin/python models/training/eval_polar_bear.py --export
```

## Outputs

| Path | Notes |
|------|--------|
| `models/data/coco/` | Generated train/val pack (gitignored) |
| `models/weights/polar_bear_ssdlite.pt` | Best checkpoint (gitignored) |
| `models/weights/polar_bear_ssdlite.onnx` | ONNX export (gitignored) |
| `models/weights/polar_bear_edlite0.tflite` | Float16 TFLite when onnx2tf works (gitignored) |
| `models/evaluation/results/polar_bear.json` | Val mAP@0.5, P/R, per-image dump |

Photos stay in `models/data/images/` (gitignored). For the cloud loop, **R2 is the source of truth** — see [`apps/labeler/README.md`](../../apps/labeler/README.md). Local `models/data/labels/` is still useful for offline training.

## Colab + R2 (recommended for GPU)

1. Label in the internal app (`apps/labeler`), then **Create training run**
2. Open [`colab_train.ipynb`](colab_train.ipynb) in Google Colab (T4 GPU)
3. Set Colab Secrets (`R2_*`, `LABELER_URL`, `TRAIN_TOKEN`) and `RUN_ID`
4. Runtime → Run all — pulls the immutable snapshot, trains, uploads metrics / preds / TFLite, callbacks status

Pull a snapshot back to this Mac if you want to train locally:

```bash
export R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=...
models/.venv/bin/python models/tools/sync_r2.py --pull <run_id>
```

## Notes

- Split is fixed in `models/data/split.json` (44 train / 20 val) until a run overrides it via the R2 manifest.
- Do not commit weights or the COCO image pack.
- App wiring (Expo + TFLite runtime) is a later phase — keep Gemini in `detector.ts` for now.
