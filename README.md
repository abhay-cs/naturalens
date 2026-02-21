# NaturaLens

A global wildlife recognition platform. Identify any animal species from a photo using on-device AI — contribute to conservation science while exploring the natural world.

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
npx expo start
```

See [apps/mobile/README.md](apps/mobile/README.md) for full setup instructions including model and WASM assets.

## Status

| Component | Status |
|-----------|--------|
| Mobile app (Expo) | MVP — camera, image upload, map, theming |
| Landing page | Not started |
| Backend API | Not started |
| Inference service | Not started |
| ML training | Not started |
| Data pipeline | Not started |

## License

See [LICENSE](LICENSE).
