# NaturaLens

A global wildlife recognition platform. Point your phone at an animal, and NaturaLens names the species and keeps a log of what you've found.

Identification currently runs in the cloud, against the Gemini API. On-device inference is the eventual goal — see [docs/Architecture_Notes.md](docs/Architecture_Notes.md) for the criteria we'd want to hit before switching.

## Repo Map

```
naturalens/
├── apps/
│   ├── mobile/          # React Native (Expo) app — the core product
│   └── web/             # Landing page (TBD)
│
├── services/
│   ├── api/             # Backend API (TBD)
│   └── inference/       # ML inference service (TBD)
│
├── models/
│   ├── training/        # Model training scripts and notebooks
│   └── evaluation/      # Benchmarks and accuracy reporting
│
├── tools/
│   └── data-pipeline/   # Species DB compilation, GBIF/IUCN ingestion
│
├── docs/                # Design docs, ADRs
└── infra/               # Dockerfiles, IaC, deploy configs
```

## Getting Started

### Mobile App

```bash
cd apps/mobile
npm install
cp .env.example .env   # paste in a free Gemini API key
npm start
```

The app won't identify anything without that key. See [apps/mobile/README.md](apps/mobile/README.md) for details.

## Status

| Component | Status |
|-----------|--------|
| Mobile app (Expo) | MVP — capture a photo, identify the species, save it to a list |
| Landing page | Built — see `apps/web` |
| Backend API | Not started |
| Inference service | Not started — identification calls the Gemini API directly from the app |
| ML training | Not started |
| Data pipeline | Not started |

The `services/`, `models/`, `tools/`, and `infra/` directories are placeholders for that
roadmap. They hold a README and nothing else.

## License

See [LICENSE](LICENSE).
