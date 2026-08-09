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
2. **Identify** — the frame freezes on the still we actually analysed, and we name the
   species, score our confidence, and say something about it.
3. **Keep** — save the find; it persists across restarts and appears in a list.
4. **Revisit** — tap a find to see it full-size with its species details, or delete it.

Step 2 freezing is the point: an identification shown over a live camera feed is an
identification of a frame the user can no longer see.

Step 4 is what stops the list being a dead end. A find that can only ever be a 64px
thumbnail isn't a discovery, it's a receipt.

Everything else is roadmap.

### 1.3 Non-goals for the MVP

- No accounts, no sync, no backend of our own. History is local to the device.
- No continuous/live detection — one photo, on a button press.
- No bounding boxes. The model returns a label, not a location in the frame.
- No offline mode. Identification is a network call and fails without one.
- No map, and no video or image-file upload.
- **No location.** Deliberate, but note it can't be backfilled: finds saved before location
  is ever added will never have one.

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
│  HistoryScreen ──tap──> SpeciesDetailScreen        │
│                              └──delete──> both     │
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
| Response | JSON schema | `{ isAnimal, label, confidence, description, habitat, diet, conservationStatus }` — structured output beats parsing prose. |

The prompt asks for the most specific species name the model can reasonably support ("red
fox" rather than "fox") in plain English rather than Latin, plus a sentence or two about the
species and a short phrase each for habitat and diet.

Species info rides along on the **same call** — it is not a second request. Measured against
the shipped 3-field schema on the same 1024px image, five interleaved runs each: **1454ms →
1681ms median, so the extra four fields cost ~230ms (16%).** That was the number the decision
hung on; the fallback, had it been worse, was to return the label immediately and fetch the
details lazily when the detail view opens.

`conservationStatus` is an **`enum` in the schema**, not free text, so `ConservationBadge` can
switch on it and always have a colour. The code still falls back to `Data Deficient` for an
off-list value — it's a model, not a database.

Three things about the result:

- **`isAnimal: false` returns an empty list, not an error.** A photo of a chair is a valid
  answer, and the UI freezes on the still and says "No animal here".
- **That guard is load-bearing.** Shown a chair, the model happily fills in `label: "chair"`,
  `confidence: 1`, and a description of the upholstery. `!result.isAnimal` is the only thing
  standing between that and "chair" being saved as a species.
- **Confidence is self-reported** by the model, so it's clamped to `[0, 1]` rather than
  trusted. Treat it as a hint, not a calibrated probability.

The model, image size, and thinking budget together took a detection from ~9s to ~2s.

---

## 4. Persistence (`src/lib/history.ts`)

Metadata (`id`, `label`, `score`, `photoUri`, `thumbUri?`, `timestamp`, `info?`) is JSON in
AsyncStorage under a **versioned key** (`naturalens-history-v1`), so a future schema change
can migrate rather than misread old rows. A corrupt read starts clean instead of crashing at
launch.

The images are **written into the document directory, not the camera's cache**. `expo-camera`
writes captures to cache, which iOS and Android are free to purge under storage pressure —
which would leave the history list full of broken thumbnails. That copy is what makes a saved
find actually saved.

**We keep two sizes, and neither is the original** (`DISPLAY_WIDTH` 1600px, `THUMB_WIDTH`
256px):

| File | Used by |
|---|---|
| `history/{id}.jpg` | `SpeciesDetailScreen`, which renders it 360px tall |
| `history/{id}_thumb.jpg` | `HistoryScreen` rows, 64pt squares |

`takePictureAsync` returns whatever the sensor gives, around 4032px wide. The detector never
uploads more than 1024px and the detail view never shows more than 360px tall, so the original
is megabytes of pixels nothing will ever look at. It was also what the **list** was decoding —
a ~48MB bitmap per row, to fill a 64pt square. That cost grew with every photo taken and would
have OOM'd a low-end Android.

So **`deleteHistoryEntry` has to delete the files, not just the row** — and there are two of
them now. Nothing else will ever reclaim them; dropping the AsyncStorage row alone leaks both
for the life of the install.

Both `SpeciesInfo` and `thumbUri` were added to `HistoryEntry` as **optional** fields rather
than as version bumps. Additive means entries already on disk keep loading with no migration
code at all. The version in the key is still there for a genuinely breaking change.

`thumbUri` is backfilled from the full photo on load, in `AppStateContext` — **sequentially**,
because this is image decoding and firing twenty at once is how you run out of memory doing
the thing that was supposed to save it. Their full-size originals are left alone: rewriting a
file the user already has is a worse risk than leaving some disk on the floor.

Those older finds are then **backfilled lazily**: open one, and the detail view calls
`fetchSpeciesInfo(label)` — a text-only Gemini call, no photo — and persists the result, so
it's instant every time after. This works because **species facts follow from the label, not
the image**, which is exactly what makes them recoverable where something like a capture
location never would be. Doing it on open rather than as a bulk migration at launch means we
only pay for finds someone actually looks at.

The lookup degrades rather than lies: a junk label returns `Data Deficient` and a description
saying so, instead of a confident-looking status for a species that doesn't exist. On a network
failure the card offers a retry rather than silently re-hammering the API.

---

## 5. State

`AppStateContext` holds what's shared: the active tab, the error banner, the history list,
and which find is open in the detail view. React context with no state library is the right
size for this.

The pending detection is deliberately **not** in there — it lives in
`CameraDetectionScreen`'s local state, because nothing else needs to read it. It gets
promoted to shared state only when the user saves it.

The open find is stored as an **id**, and the entry is derived from `history`. That's what
makes delete work without a special case: remove the row and `selectedEntry` becomes `null`
on its own, so the detail view closes itself.

Navigation is hand-rolled — there is no navigation library. The detail view is a React Native
`<Modal>` rather than an absolute-fill `View`, because `onRequestClose` is what makes
Android's hardware back button close the detail instead of backgrounding the app.

---

## 5a. Errors

An error thrown in `detector.ts` reaches the user's eyes. `CameraDetectionScreen` catches it,
passes `err.message` to `setInitError`, and `ErrorBanner` renders that string — so **the
message is the UI copy**, not a log line. It cannot be a status code and a slice of someone
else's JSON.

`askGemini` maps failures to sentences (`messageForStatus`), and `console.warn`s the real
status and body so it stays debuggable:

| Failure | What the user reads |
|---|---|
| `fetch` rejects | "You're offline. Connect and try again." |
| 429 | "Too many photos too quickly — wait a moment and try again." |
| 403, or 400 with "api key" in the body | "Your Gemini API key was rejected." |
| 5xx | "Gemini is having trouble right now." |
| anything else | "Couldn't identify that photo. Try again." |

Two of those rules are load-bearing and were checked against the live API rather than guessed:

- **A 400 does not by itself mean a bad key.** A bad key returns 400 (`"API key not valid"`),
  but so does a request we have malformed ourselves. Mapping every 400 to "bad key" would
  blame the user's key for our bug — hence the body check. (An *empty* key returns 403, though
  `askGemini` catches that before it can leave the phone.)
- **`fetch` only rejects on a network-level failure.** A 4xx or 5xx *resolves*. So anything
  landing in the `catch` around it means the request never made it off the device, which is
  what makes "you're offline" a safe thing to say there.

Free-tier rate limits are tight, so 429 is a routine outcome of tapping the shutter a few
times — not an edge case.

---

## 6. Design system

- **Color** (`src/theme/colors.ts`) — `primary` (forest green) is the *action* color:
  buttons, active tab. `brand` (deep teal) is the *identity* color: logo, splash, camera
  surface. Keeping them apart is what stops the camera chrome from reading as a button.
  `ConservationColors` maps IUCN status to a colour, safe to alarming. `Data Deficient` is
  grey, not green — "we don't know" is not "it's fine", and colouring it like the latter
  would be a lie told in a design token.
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
