# ADR 001: Monorepo Structure

**Date:** 2026-02-20
**Status:** Accepted

## Context

NaturaLens consists of multiple components: a mobile app (React Native / Expo), a landing page, a backend API, an ML inference service, model training pipelines, data ingestion tools, and infrastructure configs.

We needed to decide between a single monorepo or multiple separate repositories.

## Decision

We chose a **single monorepo** with clear directory boundaries:

- `apps/` for deployable user-facing applications
- `services/` for backend processes
- `models/` for ML training and evaluation
- `tools/` for internal utilities
- `docs/` for documentation
- `infra/` for infrastructure as code

## Rationale

- **Simplicity at our scale.** A small team benefits from having everything in one place. No cross-repo dependency management, no version syncing.
- **Atomic changes.** A change that touches the API contract and the mobile app can be a single PR.
- **Unified CI.** One CI config can lint, test, and build any workspace.
- **Easy onboarding.** New contributors clone one repo and see the entire project.

## Consequences

- Large clone size over time (mitigated by `.gitignore` excluding model weights, build artifacts, and dependencies).
- Need discipline with directory boundaries — each workspace should be self-contained with its own dependency management.
- May adopt a monorepo tool (Turborepo, nx) later if coordinated builds across JS workspaces become necessary.
