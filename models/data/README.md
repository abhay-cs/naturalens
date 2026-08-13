# Polar bear photos (local)

Drop a zip of field photos here. They stay on the machine — git ignores the zip and extracted images.

```bash
# from repo root, after the zip is in this folder
python3 models/evaluation/auto_box_polar_bears.py
```

That uses a COCO-pretrained detector (`bear`) to propose boxes, writes YOLO labels plus a JSON, and draws preview images so you can skim mistakes.
