# Polar bear photos (local)

Drop a zip of field photos here, or pass `--zip`. Photos stay gitignored.

```bash
python3.12 -m venv models/.venv
source models/.venv/bin/activate
pip install -r models/evaluation/requirements-autobox.txt
python3 models/evaluation/auto_box_polar_bears.py --zip ~/Downloads/PolarBearphotos-1-001.zip
```

Uses Mask R-CNN ResNet-50 on the Apple GPU, two scales, and a flip pass. Open `previews/` to skim mistakes.

## Labeling

**Cloud (source of truth going forward):** [`apps/labeler`](../../apps/labeler) — upload, skim, create training runs on R2. See that README for Cloudflare setup.

**Local (offline):**

```bash
models/.venv/bin/python models/evaluation/labeler.py
```

Opens http://127.0.0.1:8765/ with the existing YOLO labels loaded. **Looks right** writes `labels/` and marks the photo reviewed.

Seed local photos into the cloud labeler:

```bash
LABELER_URL=http://127.0.0.1:8787 models/.venv/bin/python models/tools/sync_r2.py --push
```

