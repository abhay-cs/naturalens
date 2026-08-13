# Polar bear photos (local)

Drop a zip of field photos here, or pass `--zip`. Photos stay gitignored.

```bash
python3.12 -m venv models/.venv
source models/.venv/bin/activate
pip install -r models/evaluation/requirements-autobox.txt
python3 models/evaluation/auto_box_polar_bears.py --zip ~/Downloads/PolarBearphotos-1-001.zip
```

Uses Mask R-CNN ResNet-50 on the Apple GPU, two scales, and a flip pass. Open `previews/` to skim mistakes.

