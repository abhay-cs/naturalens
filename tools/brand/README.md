# Brand asset pipeline

Source of truth for the NaturaLens owl mark:

- [`brand/source/owl-mark-source.png`](../../brand/source/owl-mark-source.png) — raster master (transparent PNG)
- [`brand/owl-mark.svg`](../../brand/owl-mark.svg) — traced vector; body uses `currentColor`
- [`brand/owl-mark-mono.svg`](../../brand/owl-mark-mono.svg) — same monochrome mark

## Trace the mark

If the source PNG changes:

```bash
python3 tools/brand/trace-mark.py
```

Requires `potrace` and Pillow.

## Regenerate rasters

```bash
python3 tools/brand/build-brand.py
```

Requires `rsvg-convert` (librsvg) and Pillow (+ numpy for the frosted-glass tiles). Inter Bold is fetched once into
`tools/brand/.fonts/` for the OG image wordmark (gitignored).

Outputs land in `apps/mobile/assets/` and `apps/web/` (favicon, apple icon,
PWA icons, OG image, manifest).
