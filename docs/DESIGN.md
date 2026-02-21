# NaturaLens MVP — Design Document

**Version:** 0.0.1
**Date:** February 2026
**Status:** MVP / Prototype

---

## 1. Product Overview

### 1.1 Vision

NaturaLens is a client-side web application for detecting wildlife — primarily bears — in images, video, and live camera feeds. It runs entirely in the browser using on-device machine learning, requiring no backend server, user accounts, or cloud processing. The goal is to provide field researchers, wildlife enthusiasts, and conservation teams with a lightweight, instantly deployable detection tool.

### 1.2 Problem Statement

Wildlife monitoring traditionally requires expensive camera trap hardware, proprietary software, and manual review of thousands of images. Teams in the field need a quick way to confirm animal presence from a phone or laptop without uploading data to a third-party service.

### 1.3 Target Users

| Persona | Description |
|---------|-------------|
| **Field researcher** | Needs to quickly scan trail camera footage for bears on a laptop at a base camp |
| **Conservation officer** | Uses a phone to capture and identify wildlife during patrols |
| **Wildlife enthusiast** | Wants to identify animals in personal photos and videos |

### 1.4 Key Principles

- **Privacy-first** — All processing happens on-device. No images or video leave the browser.
- **Zero infrastructure** — Static site deployment (e.g. GitHub Pages, Netlify). No backend, no database, no auth.
- **Mobile-first** — Designed for phone-in-hand field use, with a full desktop experience as well.
- **Instant utility** — One onboarding flow, then straight to detection. No setup required beyond granting camera access.

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Browser                         │
│                                                     │
│  ┌──────────┐   ┌─────────────┐   ┌─────────────┐  │
│  │  React   │──▶│  MediaPipe  │──▶│   Canvas     │  │
│  │  UI      │   │  WASM       │   │   Renderer   │  │
│  │          │◀──│  Detector   │◀──│              │  │
│  └──────────┘   └─────────────┘   └─────────────┘  │
│        │                                  │         │
│        ▼                                  ▼         │
│  ┌──────────┐                    ┌─────────────┐    │
│  │ MapLibre │                    │  Results     │    │
│  │ GL       │                    │  Panel       │    │
│  └──────────┘                    └─────────────┘    │
│                                                     │
│  Storage: localStorage (theme, onboarding state)    │
└─────────────────────────────────────────────────────┘

External:
  - OpenStreetMap tile server (map tiles only)
  - Google Fonts CDN (Figtree typeface)
```

### 2.2 Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **UI Framework** | React 18 | Hooks-based, no class components |
| **Language** | TypeScript 5.6 | Strict mode enabled |
| **Build Tool** | Vite 5.4 | HMR, COOP/COEP headers for SharedArrayBuffer |
| **ML Runtime** | MediaPipe Tasks Vision 0.10 | WASM-based, runs on-device |
| **ML Model** | EfficientDet Lite0 (float16) | COCO-trained, general object detection |
| **Maps** | MapLibre GL + react-map-gl 8 | OpenStreetMap raster tiles |
| **Styling** | Vanilla CSS + CSS Custom Properties | Neobrutalism design system |
| **Font** | Figtree (Google Fonts) | Variable weight, modern geometric sans |

### 2.3 Project Structure

```
src/
├── components/          # Shared UI components
│   ├── MobileTabBar     # Bottom navigation (mobile)
│   ├── MobileSettingsSheet  # Slide-up settings drawer (mobile)
│   ├── OnboardingOverlay    # First-run 3-step onboarding
│   ├── ResultsPanel     # Detection results display
│   ├── Tabs             # Horizontal tab bar (desktop)
│   └── ThemeToggle      # Light/dark mode switch
│
├── contexts/
│   └── ThemeContext      # Theme state via React Context + localStorage
│
├── hooks/
│   └── useMediaQuery     # Responsive breakpoint (600px)
│
├── layouts/
│   ├── DesktopLayout     # Centered card layout (max 480px)
│   └── MobileLayout      # Fullscreen camera/map with bottom tabs
│
├── lib/
│   ├── detector          # MediaPipe ObjectDetector init & inference
│   └── draw              # Canvas bounding box rendering
│
├── tabs/
│   ├── CameraTab         # Live camera capture & detect
│   ├── ImageTab          # Static image upload & detect
│   ├── VideoTab          # Video upload, frame sampling, gallery
│   ├── MediaTab          # Container switching between Image/Video
│   └── MapTab            # Interactive map with capture markers
│
├── data/
│   └── dummyCaptures     # Seed data for map view
│
├── App.tsx               # Root: state, filtering, layout routing
├── main.tsx              # Entry point
├── types.ts              # Shared TypeScript interfaces
└── styles.css            # Complete design system & component styles

public/
├── wasm/                 # MediaPipe WASM runtime (copied from node_modules)
├── models/               # EfficientDet Lite0 .tflite model
└── icons/wildlife/       # Bear, bird, deer, fox, wolf SVGs
```

---

## 3. Data Model

### 3.1 Core Types

```typescript
interface Detection {
  label: string;          // Category name from model (e.g. "bear")
  score: number;          // Confidence score 0.0–1.0
  bbox: {
    x: number;            // Top-left X (pixels)
    y: number;            // Top-left Y (pixels)
    w: number;            // Width (pixels)
    h: number;            // Height (pixels)
  };
}

interface FrameResults {
  detections: Detection[];
  timestamp?: number;     // Video: time in seconds
  frameIndex?: number;    // Video: sequential index
}

interface VideoResults {
  frames: FrameResults[];
  thumbnails: string[];   // JPEG data URLs with bounding boxes drawn
}

interface Capture {
  id: string;
  lat: number;
  lng: number;
  detections: Detection[];
  timestamp: number;      // Unix epoch ms
  source: 'camera' | 'image' | 'video';
}
```

### 3.2 State Management

All state lives in React hooks within `App.tsx`. No external state library is used.

| State | Type | Purpose |
|-------|------|---------|
| `activeTab` | `TabId` | Current view (camera / media / map) |
| `scoreThreshold` | `number` | Min confidence to display a detection (0.1–0.9) |
| `showOnlyBears` | `boolean` | Filter to bear-labeled detections only |
| `frameResults` | `FrameResults \| null` | Latest camera/image detection result |
| `videoDetections` | `Detection[] \| null` | Selected video frame detections |
| `videoFrameMeta` | `object \| null` | Timestamp/index of selected video frame |
| `onboardingComplete` | `boolean` | Persisted in localStorage |
| `initError` | `string \| null` | Error banner message |

### 3.3 Persistence

| Data | Storage | Lifetime |
|------|---------|----------|
| Theme preference | `AsyncStorage` (`naturalens-theme`) | Permanent |
| Onboarding seen flag | `AsyncStorage` (`naturalens-onboarding-seen`) | Permanent |
| Detection results | In-memory only | Session |
| Uploaded media | Not stored | Discarded after processing |

---

## 4. Features

### 4.1 Live Camera Detection

**Flow:**
1. App requests camera permission (`getUserMedia`, rear-facing preferred)
2. Live video preview is displayed (mirrored)
3. User taps "Capture & Detect"
4. Current frame is drawn to a canvas, run through MediaPipe ObjectDetector
5. Filtered detections are drawn as lime-green bounding boxes
6. Results panel updates with labels, scores, and bbox coordinates

**Constraints:**
- Requires HTTPS or localhost
- Camera auto-starts on tab mount, stops on unmount
- Mobile layout uses a circular FAB capture button; desktop uses pill buttons

### 4.2 Image Upload & Detection

**Flow:**
1. User selects a JPG or PNG file
2. Image is loaded into an `<img>` element
3. Drawn to canvas, run through detector
4. Bounding boxes overlaid, results displayed

**Constraints:**
- Accepted formats: JPEG, PNG
- No server upload — file is read client-side via `FileReader` / object URL

### 4.3 Video Processing

**Flow:**
1. User selects an MP4 or MOV file
2. Configures sampling FPS (1–10, default 2) and max frames (1–500, default 200)
3. Taps "Process Video"
4. App seeks through video at the configured interval
5. Each frame is drawn to an offscreen canvas, run through detector
6. Thumbnails (JPEG, 50% quality) are generated with bounding boxes drawn
7. Thumbnail gallery displays with "Bear" badges on frames with detections
8. User clicks thumbnails to inspect individual frames
9. Results panel updates for the selected frame
10. "Download JSON" exports full `VideoResults` as a structured JSON file

**Constraints:**
- Sequential frame processing (no parallelism due to single detector instance)
- Large videos with high FPS sampling can be slow — max frames cap mitigates this

### 4.4 Map View

**Flow:**
1. Interactive MapLibre map loads with OpenStreetMap tiles
2. Capture markers are plotted (currently using seed data)
3. Clicking a marker opens a popup with detection count, animal labels, source type, and timestamp

**Current state:** Map displays hardcoded dummy captures centered on Winnipeg, MB. Future versions will plot real captures from camera/image/video detections.

### 4.5 Detection Filtering

Two global controls affect all detection results:

- **Score threshold** (slider, 0.10–0.90): Detections below this confidence are hidden
- **Show only bears** (toggle, default ON): Filters to `label === "bear"` only

These filters are applied post-inference, so changing them does not require re-running detection.

### 4.6 Onboarding

A 3-slide modal overlay on first visit:

| Slide | Content |
|-------|---------|
| 1 — Hero | Product name, tagline ("Spot wildlife in photos and videos"), CTA |
| 2 — Features | Camera and Media feature cards with icons |
| 3 — Ready | Confirmation message, "Start detecting wildlife" CTA |

- Dismissible with Escape key
- Completion persisted in `localStorage`; not shown again

### 4.7 Theme Support

- Light and dark modes via `data-theme` attribute on `<html>`
- Toggle available in header (desktop) and overlay/settings (mobile)
- Preference persisted in `localStorage`
- Smooth CSS transitions on theme change

---

## 5. UI / UX Design

### 5.1 Design System — Neobrutalism

The app uses a neobrutalism aesthetic: bold borders, hard-edged offset shadows, high contrast, and vibrant accent colors.

**Design tokens:**

| Token | Light | Dark |
|-------|-------|------|
| Background | `#e5e5e5` | `#1a1a1a` |
| Surface | `#ffffff` | `#262626` |
| Border | `#000000` (2.5px) | `#ffffff` (2.5px) |
| Shadow | `5px 5px 0 #000` | `5px 5px 0 #fff` |
| Primary accent | `#ef4444` (red) | `#ef4444` |
| Secondary accent | `#facc15` (yellow) | `#eab308` |
| Highlight | `#84cc16` (lime) | `#84cc16` |
| Purple accent | `#a855f7` | `#a855f7` |
| Error | `#dc2626` | `#f87171` |

**Typography:**
- Font family: Figtree (Google Fonts), fallback to system-ui
- Base weight: 500
- Line height: 1.55

### 5.2 Responsive Layout

**Breakpoint:** 600px (via `useMediaQuery` hook)

**Desktop (> 600px):**
- Centered card container, max-width 480px
- Persistent header with title + theme toggle
- Detection settings card always visible
- Horizontal tab bar: "01. Camera" / "02. Media" / "03. Map"
- Results panel always visible below content (except on map tab)

**Mobile (≤ 600px):**
- Camera tab: fullscreen video preview with floating FAB capture button
- Map tab: fullscreen map
- Media tab: standard scrollable layout with header
- Settings accessible via floating gear button → slide-up sheet
- Bottom tab bar with Camera / Media / Map icons
- Header hidden on camera and map tabs for maximum viewport usage
- Results panel shown conditionally (camera tab: only when detections exist)

### 5.3 Component Hierarchy

```
App
├── OnboardingOverlay (conditional, first visit)
├── DesktopLayout (> 600px)
│   ├── Header (title + ThemeToggle)
│   ├── ErrorBanner (conditional)
│   ├── GlobalControlsCard (threshold + bears-only)
│   ├── Tabs
│   │   ├── CameraTab
│   │   ├── MediaTab
│   │   │   ├── ImageTab
│   │   │   └── VideoTab
│   │   └── MapTab
│   └── ResultsPanel
│
└── MobileLayout (≤ 600px)
    ├── MobileHeader (conditional, hidden on camera/map)
    ├── ErrorBanner (conditional)
    ├── MobileSettingsSheet (slide-up drawer)
    ├── CameraTab (fullscreen + FAB) / MapTab (fullscreen) / MediaTab
    ├── ResultsPanel (conditional)
    └── MobileTabBar
```

---

## 6. ML Pipeline

### 6.1 Model

- **Model:** EfficientDet Lite0 (float16)
- **Source:** [MediaPipe Model Zoo](https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/latest/efficientdet_lite0.tflite)
- **Training data:** COCO dataset (80 object categories including "bear")
- **Max results per detection:** 5 categories
- **Running mode:** IMAGE (single-frame inference)

### 6.2 Inference Pipeline

```
Input (HTMLVideoElement | HTMLImageElement | HTMLCanvasElement)
  │
  ▼
MediaPipe ObjectDetector.detect()
  │
  ▼
Raw detections [{categories, boundingBox}]
  │
  ▼
Transform → Detection[] (label, score, bbox)
  │
  ▼
Filter: score ≥ threshold
  │
  ▼
Filter: bears only (optional)
  │
  ▼
Draw bounding boxes on canvas (lime green, 3px stroke)
  │
  ▼
Display in ResultsPanel
```

### 6.3 Detector Lifecycle

- **Lazy initialization:** Detector is created on first detection request, not on page load
- **Singleton pattern:** One detector instance is reused across all tabs
- **Options-based re-init:** If score threshold changes, the detector is re-created with new options
- **Error recovery:** Failed initialization clears the instance and allows retry

### 6.4 WASM Requirements

MediaPipe requires SharedArrayBuffer, which needs the following response headers:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

These are configured in `vite.config.ts` for the dev server.

---

## 7. Performance Considerations

| Concern | Mitigation |
|---------|------------|
| Model download (~4MB) | Loaded once, cached by browser |
| WASM cold start | ~1-2s on first detection; subsequent detections are instant |
| Video frame processing | Capped at 500 frames max; configurable FPS to balance speed vs coverage |
| Thumbnail memory | JPEG at 50% quality; data URLs for simplicity over blob URLs |
| Canvas operations | Offscreen canvas for video processing to avoid layout thrashing |
| Map tile loading | Raster tiles from OSM; no vector tile overhead |
| Bundle size | Vite tree-shaking; MediaPipe excluded from dep optimization |

---

## 8. Security & Privacy

- **No network requests** for inference — all ML runs locally in WASM
- **No data collection** — no analytics, no telemetry, no cookies (beyond localStorage for preferences)
- **No file uploads** — images and videos are processed client-side and never leave the browser
- **Camera access** gated by browser permission prompt
- **COOP/COEP headers** provide cross-origin isolation for SharedArrayBuffer security

---

## 9. Known Limitations (MVP)

| Limitation | Description |
|------------|-------------|
| **General-purpose model** | EfficientDet Lite0 is trained on COCO, not wildlife-specific. Bear detection works but other wildlife categories are limited to COCO labels. |
| **No real-time streaming** | Camera detection is manual (tap to capture), not continuous frame-by-frame. |
| **No persistent storage** | Detection results are lost on page refresh. No export for camera/image results. |
| **Dummy map data** | Map markers use hardcoded seed data; not connected to actual captures. |
| **Sequential video processing** | Frames are processed one at a time; no Web Worker parallelism. |
| **No offline support** | No service worker or PWA manifest (depends on CDN for fonts, map tiles). |
| **Single model** | No model selection; cannot swap to a wildlife-specific model from the UI. |

---

## 10. Future Roadmap

### Phase 2 — Enhanced Detection
- [ ] Custom wildlife-specific model (fine-tuned on iNaturalist or wildlife datasets)
- [ ] Real-time continuous detection mode (frame-by-frame with throttle)
- [ ] Multi-class wildlife identification (species-level, not just COCO categories)
- [ ] Confidence calibration and detection aggregation across video frames

### Phase 3 — Data Persistence
- [ ] IndexedDB storage for captures with images, detections, and GPS
- [ ] Export captures as CSV / GeoJSON
- [ ] Connect map view to real captured data
- [ ] Session history and capture timeline

### Phase 4 — Field Deployment
- [ ] PWA with service worker for offline use
- [ ] Background sync for uploading captures when connectivity returns
- [ ] Geolocation tagging on camera captures
- [ ] Batch processing for SD card dump (hundreds of trail cam images)

### Phase 5 — Collaboration
- [ ] Optional cloud sync (encrypted, user-controlled)
- [ ] Shared team map with pooled captures
- [ ] Annotation tools for correcting/confirming detections
- [ ] Model feedback loop (user corrections improve future models)

---

## 11. Development

### Prerequisites
- Node.js 18+
- npm

### Setup
```bash
npm install

# Copy WASM runtime
cp -r node_modules/@mediapipe/tasks-vision/wasm/* public/wasm/

# Download model
curl -o public/models/efficientdet_lite0.tflite \
  "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/latest/efficientdet_lite0.tflite"
```

### Run
```bash
npm run dev          # Dev server at localhost:5173
npm run build        # Production build to dist/
npm run preview      # Preview production build
```

### Key Configuration

**`vite.config.ts`** sets COOP/COEP headers and excludes MediaPipe from Vite's dependency optimization (it ships its own WASM loader).

**`tsconfig.json`** uses strict mode with ES2020 target and ESNext module resolution.

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| **COCO** | Common Objects in Context — a large-scale object detection dataset with 80 categories |
| **COOP/COEP** | Cross-Origin-Opener-Policy / Cross-Origin-Embedder-Policy — HTTP headers enabling SharedArrayBuffer |
| **EfficientDet** | A family of efficient object detection models by Google |
| **FAB** | Floating Action Button — a circular button overlaid on content |
| **MediaPipe** | Google's framework for building cross-platform ML pipelines |
| **Neobrutalism** | A design aesthetic characterized by bold borders, flat colors, and offset shadows |
| **SharedArrayBuffer** | A JS primitive for shared memory between threads, required by MediaPipe WASM |
| **TFLite** | TensorFlow Lite — a lightweight ML model format for on-device inference |
