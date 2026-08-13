# Naturalens Design System

**Volume One — black and white only.** Depth via contrast, weight, and space. No hue.

This package is the single source of truth for brand tokens and the owl mark across:

- `apps/web` (marketing site)
- `apps/labeler` (internal tools, inverted theme)
- `apps/mobile` (Expo app)

## What you edit

| File | Purpose |
|------|---------|
| [`tokens.json`](tokens.json) | **The only file you edit for color, type, space, radius, motion** |
| [`mark/owl.svg`](mark/owl.svg) | Canonical line mark — 32 grid, 2px stroke |
| [`mark/owl-small.svg`](mark/owl-small.svg) | 2.5px stroke for sizes under 40px |
| [`mark/owl-square.svg`](mark/owl-square.svg) | 512 lockup for favicon / app icon |

**Never edit generated files by hand.** They carry a `GENERATED — do not edit` header.

## Regenerate

```bash
node packages/design/build/generate.mjs
```

Writes:

- `apps/web/src/app/tokens.css`
- `apps/labeler/public/tokens.css`
- `apps/mobile/src/theme/tokens.ts`

Check that committed outputs match the source (CI-ready):

```bash
node packages/design/build/generate.mjs --check
```

Brand rasters (favicon, OG, Expo icons) are a separate pipeline:

```bash
python3 tools/brand/build-brand.py
```

## Adding a token

1. Add it to `tokens.json` under the right group (`color`, `space`, `radius`, …).
2. Run the generator.
3. Use the new CSS custom property (`--nl-*`) or the TypeScript export — do not hardcode the value in apps.

## Themes

`:root` is paper white / ink black. Internal tools set `data-theme="inverted"` on `<html>` for black paper / white type. Same tokens, opposite polarity — not a second palette.

## Type ramp

Fluid sizes store `min` and `max` in JSON. Web codegen emits `clamp()`; mobile emits a plain `max` number. Weight is numeric; mobile maps it to Expo family strings (`Outfit_200ExtraLight`, `Archivo_500Medium`). `RequiredFontFamilies` lists every family the ramp names — pass that list to `useFonts` so the load list cannot drift from the ramp.

## Radius rule

Full-pill (`999`) belongs to **one primary action per screen**. Everything else is rectangular at 0–2px (media / inputs) or 8px (panels).

## Spec

Browsable reference: [`apps/design/Naturalens Design System.dc.html`](../../apps/design/Naturalens%20Design%20System.dc.html) and the landing mock beside it.
