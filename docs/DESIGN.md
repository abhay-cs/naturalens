# NaturaLens MVP — Design Document

**Version:** 0.1.0
**Status:** MVP

> Replaces an earlier draft that described NaturaLens as a browser-based, on-device bear
> detector built on MediaPipe, MapLibre, and Vite. That product was never built. This
> document describes what actually ships: an Expo mobile app that identifies species via
> the Gemini API.

---

## 1. Product Overview

### 1.1 Vision

Point your phone at an animal and find out what it is. NaturaLens names the species, says
how confident it is, and keeps a log of what you've found.

### 1.2 Scope of the MVP

The MVP is one loop:

1. **Capture** — open the camera, take a photo.
2. **Identify** — send it off, get a species name and a confidence score back.
3. **Keep** — save the find; it persists across restarts and appears in a list.

Everything else is roadmap.

### 1.3 Non-goals for the MVP

- No accounts, no sync, no backend of our own. History is local to the device.
- No continuous/live detection — one photo, on a button press.
- No bounding boxes. The model returns a label, not a location in the frame.
- No offline mode. Identification is a network call and fails without one.
- No map, and no video or image-file upload.

---

## 2. Architecture

```
┌──────────────── Expo app (Expo Go) ────────────────┐
│                                                    │
│  CameraDetectionScreen ──capture──> detector.ts ───┼──> Gemini API
│         │                                          │    (flash-lite)
│         │ save                                     │
│         v                                          │
│  AppStateContext ──> history.ts ──> AsyncStorage   │
│         │                       └──> document dir  │
│         v                                          │
│  HistoryScreen                                     │
└────────────────────────────────────────────────────┘
```

There is no server of ours. The app calls Gemini directly.

| Layer | Choice |
|---|---|
| Framework | React Native via Expo (SDK 54), runs in Expo Go |
| Language | TypeScript |
| Camera | `expo-camera` |
| Identification | Gemini API (`gemini-3.1-flash-lite`) |
| Persistence | `@react-native-async-storage/async-storage` + `expo-file-system` |
| State | React context — no external state library |
| Font | Figtree, via `@expo-google-fonts/figtree` |

### 2.1 Why cloud, not on-device

The original plan was on-device inference (TFLite). It was dropped because **Expo Go can
only load the native modules it ships with** — a TFLite runtime means a custom development
build, which means giving up the scan-a-QR-code workflow.

That tradeoff isn't permanent. `Architecture_Notes.md` lists the criteria we'd want to hit
before switching back.

### 2.2 What that choice costs

- **The API key ships to the client.** `EXPO_PUBLIC_*` vars are inlined into the bundle, so
  the key must be restricted in AI Studio rather than treated as secret. This is the
  strongest argument for putting `services/api` in front of it.
- **No offline use.** A field tool that needs signal is a compromised field tool.
- **Per-identification cost** scales with usage, where on-device would be free after the
  model download.

---

## 3. Identification (`src/lib/detector.ts`)

| Decision | Value | Why |
|---|---|---|
| Model | `gemini-3.1-flash-lite` | ~1.5s vs ~7–18s for `flash`, same answers on test images. Naming an animal doesn't need the bigger model's reasoning. |
| Image width | 1024px | Gemini tokenizes images in fixed tiles, so going smaller costs detail without saving tokens or latency — 512px measurably bought nothing. |
| Thinking | `minimal` | Default thinking burned ~230 reasoning tokens of pure latency per photo. |
| Response | JSON schema | `{ isAnimal, label, confidence }` — structured output beats parsing prose. |

The prompt asks for the most specific species name the model can reasonably support ("red
fox" rather than "fox") in plain English rather than Latin.

Two things about the result:

- **`isAnimal: false` returns an empty list, not an error.** A photo of a chair is a valid
  answer.
- **Confidence is self-reported** by the model, so it's clamped to `[0, 1]` rather than
  trusted. Treat it as a hint, not a calibrated probability.

Together these decisions took a detection from ~9s to ~2s.

---

## 4. Persistence (`src/lib/history.ts`)

Metadata (`id`, `label`, `score`, `photoUri`, `timestamp`) is JSON in AsyncStorage under a
**versioned key** (`naturalens-history-v1`), so a future schema change can migrate rather
than misread old rows. A corrupt read starts clean instead of crashing at launch.

The photo is **copied out of the camera's cache directory into the document directory**.
This is the subtle part: `expo-camera` writes captures to cache, which iOS and Android are
free to purge under storage pressure — which would leave the history list full of broken
thumbnails. The copy is what makes a saved find actually saved.

---

## 5. State

`AppStateContext` holds what's shared: the active tab, the error banner, and the history
list. React context with no state library is the right size for two screens.

The pending detection is deliberately **not** in there — it lives in
`CameraDetectionScreen`'s local state, because nothing else needs to read it. It gets
promoted to shared state only when the user saves it.

---

## 6. Design system

- **Color** (`src/theme/colors.ts`) — `primary` (forest green) is the *action* color:
  buttons, active tab. `brand` (deep teal) is the *identity* color: logo, splash, camera
  surface. Keeping them apart is what stops the camera chrome from reading as a button.
- **Type** (`src/theme/spacing.ts`) — Figtree in three weights. Weight comes from the family
  name (`Figtree_700Bold`), never from `fontWeight`: a custom font exposes each weight as
  its own family and `fontWeight` can't choose between them. A token naming a fourth weight
  needs that weight loaded in `App.tsx`, or it silently falls back to the system face.
- **Launch** — the native splash holds until the fonts resolve, then `BrandSplash` replays
  the owl mark on the same tan ground, so the two read as one moment rather than two
  screens.

---

## 7. Known gaps

- The Gemini key ships to the client (§2.2).
- Nothing is tested — there's no test runner in the project.
- CI typechecks the mobile app only, and only on `main`, so branches get no CI.
- The resolved Android manifest still pulls in `READ/WRITE_EXTERNAL_STORAGE` from a
  dependency's config plugin. Worth tracking down — the app only writes to its own
  document directory.
- Confidence is uncalibrated (§3).

---

## 8. Roadmap

The empty `services/`, `models/`, `tools/`, and `infra/` directories mark the intended shape
of this. They currently hold a README and nothing else.

**Next** — proxy Gemini behind `services/api` so the key leaves the client. Geotag captures
and show them on a map. Export history.

**Later** — `tools/data-pipeline` builds a species DB from GBIF/IUCN, so a bare label can be
enriched with range, conservation status, and reference photos. `models/` trains a custom
classifier and migrates to on-device inference once it clears the bar in
`Architecture_Notes.md` — at which point the offline and per-call-cost problems in §2.2 go
away together.
