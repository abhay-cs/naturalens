# Brand asset pipeline

Source of truth for the NaturaLens owl mark:

- [`brand/owl-mark.svg`](../../brand/owl-mark.svg) — body uses `currentColor`, eyes are amber `#EEAE34`
- [`brand/owl-mark-mono.svg`](../../brand/owl-mark-mono.svg) — monochrome (eyes stay as negative space)

## Regenerate rasters

```bash
python3 tools/brand/build-brand.py
```

Requires `rsvg-convert` (librsvg) and Pillow. Inter Bold is fetched once into
`tools/brand/.fonts/` for the OG image wordmark (gitignored).

Outputs land in `apps/mobile/assets/` and `apps/web/` (favicon, apple icon,
PWA icons, OG image, manifest).
