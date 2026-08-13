# NaturaLens — Model Evaluation

Benchmarks and accuracy reporting for trained models.

## Polar bear detector

After training:

```bash
models/.venv/bin/python models/training/eval_polar_bear.py
```

Results land in `models/evaluation/results/polar_bear.json` (gitignored locally; regenerate anytime).

Latest run (SSDLite320 MobileNetV3-Large, 30 epochs, score≥0.3):

| Metric | Value |
|--------|-------|
| mAP@0.5 | 0.631 |
| Precision | 0.941 |
| Recall | 0.615 |
| Best epoch | 23 |

Huddle holdouts (`IMG_0223`, `IMG_0226`, `IMG_0263`) are still weak — the phone is not ready until those improve with more data.
