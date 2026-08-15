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
3. **Keep** — save the find; it persists across restarts, appears in a list, and — if we
   got a fix in time — drops a pin on the map.
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
- No offline identification. Naming a species is a network call and fails without one;
  what *is* offline is everything already saved, and the app says which is which
  (§5b).
- No video or image-file upload.

### 1.4 Location and the map

Both were non-goals through the first release and are now in. The reasoning that made
location a non-goal is the reasoning that made it worth doing early rather than later:

**It cannot be backfilled.** Species facts follow from the label, so a find saved without
them can be enriched whenever (§4). A capture location follows from a moment that is gone.
Every find saved before this release will read `not geotagged` forever, and every day we
waited added more of them.

So `HistoryEntry.location` is optional and additive, like `info` and `thumbUri` before it —
no key bump, no migration. It is resolved at capture, never at open, and it is allowed to
fail: permission denied, no fix indoors, a 4s timeout. A find without a pin is a normal
find, and nothing about the location path is permitted to fail a capture. `place` — the
street or locality — is reverse-geocoded at capture too, so opening an old find offline in
another country still names where it happened.

The map draws terrain and pins, nothing else: no business listings, no transit, no
shields. On Android that's a `customMapStyle` (`src/theme/mapStyle.ts`); iOS gets Apple
Maps' `mutedStandard`, which lands closer than expected — pale ground, grey line work, no
POI pins — differing mainly in Apple's cream road fills and green parks where the design
wants neutral greys.

Note `customMapStyle` is passed **only** on Android. Handing it to Apple Maps doesn't just
get ignored, it suppresses `mapType`, which is the one lever iOS gives us — so passing it
on both platforms silently costs you the muted style and leaves a full-colour map.

**The map is the one screen that needs a development build.** `react-native-maps` is not
among the native modules Expo Go ships, so in Expo Go the tab draws its ground and says so
while the other two carry on working (§2.1). Location is still recorded there — the pins
are waiting for a build that can draw them.

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
| Font | Outfit (display) + Archivo (body/UI), via `@expo-google-fonts/outfit` and `@expo-google-fonts/archivo` |

### 2.1 Why cloud, not on-device

The original plan was on-device inference (TFLite). It was dropped because **Expo Go can
only load the native modules it ships with** — a TFLite runtime means a custom development
build, which means giving up the scan-a-QR-code workflow.

That tradeoff isn't permanent. `Architecture_Notes.md` lists the criteria we'd want to hit
before switching back.

The map is the first feature to test that constraint rather than bend to it.
`react-native-maps` isn't in Expo Go either, but unlike a TFLite runtime it isn't on the
critical path — so instead of the whole app requiring a development build, the Map tab
detects Expo Go (`Constants.executionEnvironment`) and renders an explanation where the
map would be. Capture, identification and the find log keep working over a QR code; the
map is what you build for. Anything that has to touch the core loop still has to justify
giving Expo Go up entirely.

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

`AppStateContext` holds what's shared: the active tab, the status banners, connectivity,
the history list, which find is open in the detail view, and which pin is selected on the
map. React context with no state library is the right size for this.

The pending detection is deliberately **not** in there — it lives in
`CameraDetectionScreen`'s local state, because nothing else needs to read it. It gets
promoted to shared state only when the user saves it.

The open find and the selected pin are both stored as an **id**, and the entry is derived
from `history`. That's what makes delete work without a special case: remove the row and
`selectedEntry` and `selectedPin` become `null` on their own, so the detail view closes
itself and the pin preview drops.

Navigation is hand-rolled — there is no navigation library, and three tabs did not change
that. `MainLayout` is a lookup from `activeTab` to a screen. The detail view is a React
Native `<Modal>` rather than an absolute-fill `View`, because `onRequestClose` is what
makes Android's hardware back button close the detail instead of backgrounding the app;
the settings sheet is a `<Modal>` for the same reason, and lives inside `FindsScreen`
beside the button that opens it. The map's pin preview is **not** a modal — the map has to
stay visible behind it, since the card's whole job is telling you which pin you tapped.

---

## 5a. Errors

An error thrown in `detector.ts` reaches the user's eyes. `CameraDetectionScreen` catches it,
passes `err.message` to `pushBanner`, and `Banner` renders that string — so **the
message is the UI copy**, not a log line. It cannot be a status code and a slice of someone
else's JSON.

`askGemini` maps failures to sentences (`messageForStatus`), and `console.warn`s the real
status and body so it stays debuggable:

| Failure | Tone | What the user reads |
|---|---|---|
| `fetch` rejects | neutral | "You're offline. Connect and try again." |
| 429 | warning | "Too many photos too quickly — wait a moment and try again." |
| 403, or 400 with "api key" in the body | danger | "Your Gemini API key was rejected." |
| 5xx | danger | "Gemini is having trouble right now." |
| anything else | danger | "Couldn't identify that photo. Try again." |

The tone travels with the message on a `DetectorError`, rather than being recovered by
matching on the string in the UI. They answer different questions: the message is copy and
has to stay exactly as written, the tone is chrome. Being offline is a condition of the
world and gets the neutral grey panel; a rate limit is a "wait" and gets warning; only
things we can't recover from spend the danger hue.

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

## 5b. Connectivity, and the state we can't reach

`useNetworkOnline` (`src/lib/network.ts`) watches `expo-network` and pushes a banner on
**transition** — never on first render, because opening with an accusation is rude and
"Back online" makes no sense as the first thing the app ever says. The offline banner is
neutral and sticks; the recovery banner is success and clears itself after a few seconds.
Both carry a fixed id, so a flapping radio replaces the banner rather than stacking six
copies of it.

It reports the **radio, not reachability** — a captive portal still reads as online. That's
why it drives the banner and never gates the shutter: `detector.ts` finding out the hard
way is the authoritative answer, and its message is the one that gets shown.

**One designed state is not reachable, and it's worth writing down why.** The prototype has
a frozen result identified offline, with the species details skeleton-loading in behind it.
That requires a label without its details — and `detectInImage` returns label, score *and*
`SpeciesInfo` from a single call, because splitting them measured at ~230ms and was
rejected (§3). Offline doesn't mean a label without details; it means no label at all.

So the skeleton ships where it *is* reachable — the find detail for entries saved before
species info existed (`SkeletonLines`, with a retry when the backfill fails). Making the
offline result real would mean saving an unlabelled find to identify later, which is a
change to the data model, not a screen.

---

## 6. Design system

Source of truth: [`packages/design/`](../packages/design/). Edit `tokens.json` once,
regenerate with `node packages/design/build/generate.mjs`, and every surface picks up
the change. The browsable Volume One spec lives in
[`apps/design/`](../apps/design/).

- **Color** — chrome is black and white (`bg` / `fg` / `muted` / `caption` / `border` /
  `surface`). The labeler matches landing polarity (paper white / ink black). Muted
  semantic hues (`success` / `warning` / `danger`) are allowed **only** on status pills,
  annotation boxes, and prediction overlays — not page chrome. Conservation badges still
  prefer **form** (outline vs filled) where hue is unnecessary — see `ConservationForms` in the
  mobile theme. Confidence is bar fill, not a green/amber spectrum.
- **Type** — Outfit for display, Archivo for body and UI. Weight comes from the
  family name on mobile (`Outfit_200ExtraLight`, `Archivo_500Medium`); never from
  `fontWeight`. `RequiredFontFamilies` in the generated tokens lists every family
  the ramp names — that list is what `useFonts` loads.
- **Radius** — full-pill belongs to one primary action per screen. Inputs are 2px;
  panels are 8px; media is square.
- **Mark** — line owl on a 32 grid, 2px stroke (`packages/design/mark/owl.svg`).
  Use the 2.5px variant under 40px. Brand rasters are built by
  `python3 tools/brand/build-brand.py`.
- **Launch** — the native splash and `BrandSplash` share white ground and the same
  mark, so the two read as one moment rather than two screens.

---

## 7. Known gaps

- The Gemini key ships to the client (§2.2).
- Nothing is tested — there's no test runner in the project.
- CI typechecks the mobile app only, and only on `main`, so branches get no CI. It also
  doesn't run `generate.mjs --check`, so the generated token outputs can drift from
  `tokens.json` without anything noticing.
- The resolved Android manifest still pulls in `READ/WRITE_EXTERNAL_STORAGE` from a
  dependency's config plugin. Worth tracking down — the app only writes to its own
  document directory.
- Confidence is uncalibrated (§3).
- **The map looks slightly different on the two platforms.** Apple Maps ignores
  `customMapStyle`, so iOS gets `mutedStandard` and Android gets the real style. Both read
  as pale line work; Android is the closer match.
- **The map needs a development build** (§1.4). Expo Go gets an explanation instead.
- The offline result state is drawn but unreachable (§5b).

---

## 8. Roadmap

The empty `services/`, `models/`, `tools/`, and `infra/` directories mark the intended shape
of this. They currently hold a README and nothing else.

**Next** — proxy Gemini behind `services/api` so the key leaves the client. Export history.

**Later** — `tools/data-pipeline` builds a species DB from GBIF/IUCN, so a bare label can be
enriched with range, conservation status, and reference photos. `models/` trains a custom
classifier and migrates to on-device inference once it clears the bar in
`Architecture_Notes.md` — at which point the offline and per-call-cost problems in §2.2 go
away together.
