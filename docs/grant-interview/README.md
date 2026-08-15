# NaturaLens — Grant Interview Tech Brief

Companion markdown for `NaturaLens_Grant_Interview_Tech_Brief.pdf`.
Regenerate the PDF with:

```bash
python3 docs/grant-interview/build_pdf.py
```

## Elevator (60s)

NaturaLens is a mobile wildlife recognition app. Point your phone at an animal; we name the species, show confidence and a short species card (habitat, diet, IUCN status), and keep a personal log of finds. Identification today runs via Google Gemini (cloud-first). In parallel we run an internal labeling product and a polar-bear detector training pipeline aimed at offline, low-latency on-device use.

**Soundbite:** Cloud to learn fast; on-device to scale privately, cheaply, and offline.

## Status snapshot

| Component | Status |
|-----------|--------|
| `apps/mobile` | MVP — identify + local history |
| `apps/web` | Built — landing + D1 waitlist |
| `apps/labeler` | Built — Skim labeling / runs / Colab |
| `services/api` | Not started |
| `services/inference` | Not started |
| `models/training` | SSDLite polar-bear + Colab loop |
| `tools/data-pipeline` | Not started (GBIF/IUCN planned) |

## Stack

- **Mobile:** Expo 54, React Native, TypeScript, Gemini 3.1 Flash-Lite
- **Web:** Next.js 16 on Cloudflare Workers + D1
- **ML ops:** Cloudflare Worker + D1 + R2 labeler; PyTorch SSDLite → ONNX/TFLite
- **License:** MIT

## Key technical talking points

1. Cloud-first MVP collects real photos/corrections for future training.
2. Gemini tuned to ~1.5–2s (`flash-lite`, 1024px, minimal thinking, JSON schema).
3. `isAnimal` guard prevents non-animals becoming fake species.
4. On-device TFLite needs a custom Expo build (Expo Go limitation) — intentional sequencing.
5. Switch criteria: per-class P/R, hard conditions, &lt;1s on-device, staged rollout — not “95% accuracy” alone.
6. Labeler has integrity features (sha256 IDs, versioning, label history) and R2 free-tier hard caps.

## What grant funding unlocks

Expand labeled datasets; GPU training/eval; `services/api` + inference; custom on-device builds; GBIF/IUCN enrichment; field pilots.
