# Brand asset pipeline

Source of truth for the Naturalens design system:

- [`packages/design/tokens.json`](../../packages/design/tokens.json) — color, type, space, radius, motion
- [`packages/design/mark/owl.svg`](../../packages/design/mark/owl.svg) — line mark, 2px stroke
- [`packages/design/mark/owl-small.svg`](../../packages/design/mark/owl-small.svg) — 2.5px stroke for sizes under 40px
- [`packages/design/mark/owl-square.svg`](../../packages/design/mark/owl-square.svg) — 512 lockup for favicon / app icon

Volume One is **black and white only**. No amber eyes, no frosted glass, no gradients.

## Regenerate tokens

```bash
node packages/design/build/generate.mjs
```

Writes CSS/TS into `apps/web`, `apps/labeler`, and `apps/mobile`. See
[`packages/design/README.md`](../../packages/design/README.md).

## Regenerate rasters

```bash
python3 tools/brand/build-brand.py
```

Requires `rsvg-convert` (librsvg) and Pillow. Outfit is fetched once into
`tools/brand/.fonts/` for the OG image wordmark (gitignored). Palette values are
read from `tokens.json` — do not hardcode hex in the script.

Outputs land in `apps/mobile/assets/` and `apps/web/` (favicon, apple icon,
PWA icons, OG image, manifest).
