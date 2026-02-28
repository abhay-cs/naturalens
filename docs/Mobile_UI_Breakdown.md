# NaturaLens Mobile App — UI Breakdown

## App Architecture

```
App.tsx
└── SafeAreaProvider
    └── ThemeProvider
        └── AppStateProvider
            └── AppContent
                ├── OnboardingOverlay (first launch only)
                ├── MainLayout
                │   ├── Floating Action Buttons (settings, theme toggle)
                │   ├── ErrorBanner (conditional)
                │   ├── SettingsSheet (modal)
                │   ├── Active Screen
                │   │   ├── CameraScreen
                │   │   ├── MediaScreen
                │   │   └── MapScreen
                │   ├── ResultsPanel (Camera & Media tabs)
                │   └── TabBar
                └── StatusBar
```

### Tech Stack

- **Framework:** React Native (Expo ~54.0.33)
- **Language:** TypeScript
- **Navigation:** Custom tab bar (3 tabs)
- **State:** React Context (AppStateContext, ThemeContext)
- **Storage:** AsyncStorage (theme, onboarding)
- **Icons:** Ionicons via @expo/vector-icons
- **Font:** Figtree (Regular, SemiBold, Bold)
- **Design System:** Neobrutalism

---

## File Structure

```
apps/mobile/
├── App.tsx                          # Entry point, font loading, onboarding gate
├── index.ts                         # Expo entry
├── app.json                         # Expo config
├── package.json
├── tsconfig.json
└── src/
    ├── theme.ts                     # Color tokens, shadow presets
    ├── types.ts                     # Detection, FrameResults, Capture types
    ├── contexts/
    │   ├── AppStateContext.tsx       # Active tab, detections, settings state
    │   └── ThemeContext.tsx          # Light/dark theme with persistence
    ├── layouts/
    │   └── MainLayout.tsx           # Main app shell with all UI regions
    ├── components/
    │   ├── TabBar.tsx               # Bottom tab navigation
    │   ├── ResultsPanel.tsx         # Detection results display
    │   ├── SettingsSheet.tsx        # Detection settings bottom sheet
    │   ├── ErrorBanner.tsx          # Dismissable error notification
    │   ├── ThemeToggle.tsx          # Light/dark mode button
    │   └── OnboardingOverlay.tsx    # First-launch walkthrough
    ├── screens/
    │   ├── CameraScreen.tsx         # Live camera + capture
    │   ├── MediaScreen.tsx          # Image/video upload
    │   ├── MapScreen.tsx            # Environment-aware map loader
    │   ├── MapWebView.tsx           # Leaflet map for Expo Go
    │   ├── MapNativeView.tsx        # react-native-maps for dev builds
    │   └── MapFallbackView.tsx      # Card list fallback
    ├── lib/
    │   └── detector.ts              # Mock detector (placeholder for ML)
    └── data/
        └── dummyCaptures.ts         # 5 sample captures for map view
```

---

## Design System (Neobrutalism)

### Color Palette

| Token          | Light     | Dark      | Usage                    |
|----------------|-----------|-----------|--------------------------|
| `bg`           | `#e5e5e5` | `#1a1a1a` | Screen backgrounds       |
| `surface`      | `#ffffff` | `#262626` | Cards, sheets, tab bar   |
| `border`       | `#000000` | `#ffffff` | All borders              |
| `shadow`       | `#000000` | `#ffffff` | Hard shadow color        |
| `accent`       | `#ef4444` | `#ef4444` | Primary CTA (red)        |
| `accentAlt`    | `#facc15` | `#eab308` | Secondary accent (yellow)|
| `accentPurple` | `#a855f7` | `#a855f7` | Map popups               |
| `highlight`    | `#84cc16` | `#84cc16` | Map markers (green)      |
| `text`         | `#000000` | `#ffffff` | Primary text             |
| `textInv`      | `#ffffff` | `#000000` | Inverted text on accent  |
| `error`        | `#dc2626` | `#f87171` | Error messages           |

### Shadow System

All shadows are **hard** (0 blur radius, 100% opacity).

| Preset         | Offset  | Usage                     |
|----------------|---------|---------------------------|
| `neoShadow`    | 4px/4px | Standard cards, buttons   |
| `neoShadowSm`  | 2px/2px | Small elements, toggles   |
| `neoShadowLg`  | 6px/6px | Modals, image previews    |

Shadow color flips: black in light mode, white in dark mode.

### Typography

| Weight    | Family               | Usage                        |
|-----------|----------------------|------------------------------|
| Regular   | `Figtree_400Regular` | Body text, descriptions      |
| SemiBold  | `Figtree_600SemiBold`| Labels, buttons, tab labels  |
| Bold      | `Figtree_700Bold`    | Titles, headings             |

### Common Patterns

- **Borders:** 2px solid, theme-aware color
- **Border radius:** 10–12px for cards/containers, 22px (full) for circular buttons
- **Buttons:** Solid fill + 2px border + hard shadow
- **Cards:** Surface background + 2px border + hard shadow + 12px radius
- **Containers:** Each screen wraps content in a bordered, shadowed, rounded container

---

## Screens & Components

### 1. Onboarding Overlay

**File:** `src/components/OnboardingOverlay.tsx`
**Shown:** Once on first app launch (persisted via AsyncStorage key `naturalens-onboarding-seen`)

A full-screen modal with 3 slides:

#### Slide 0 — Welcome
- **Title:** "NaturaLens" — 36px, Figtree Bold
- **Tagline:** "Spot wildlife in photos and videos" — 16px, centered
- **CTA:** "Get started" — red button with neo shadow

#### Slide 1 — How It Works
- **Subtitle:** "How it works" — 20px, SemiBold
- **Feature cards** (2, stacked vertically, yellow background):
  - **Camera** — camera icon in white circle → "Capture live and detect wildlife in real time."
  - **Media** — images icon in white circle → "Upload images or videos to analyze for wildlife."
- Cards: 20px padding, 12px radius, 2px border, neo shadow

#### Slide 2 — Completion
- **Subtitle:** "You're all set" — 20px, SemiBold
- **Tagline:** "Start detecting wildlife with your camera or uploads."
- **CTA:** "Start detecting wildlife" — red button with neo shadow

#### Navigation
- **Back/Next:** text buttons at bottom, red accent color
- **Dot indicators:** 3 dots (8px), active = red, inactive = border color

#### Styling
- Full-screen semi-transparent backdrop (`rgba(0,0,0,0.4)`)
- Centered modal: surface background, 2px border, large neo shadow, 16px radius, 36px padding
- Max width: 400px

---

### 2. Main Layout

**File:** `src/layouts/MainLayout.tsx`
**Role:** Persistent app shell wrapping all screens.

#### Layout Regions (top to bottom)

1. **Floating Action Buttons** — absolute positioned, top-right (`top: 69px, right: 16px`)
   - Two 44px circular buttons in a horizontal row (8px gap):
     - **Settings** — gear icon (`settings-outline`, 22px, white)
     - **Theme toggle** — sun/moon icon
   - Background: `rgba(0,0,0,0.35)` with 2px border

2. **Error Banner** — shown conditionally when `initError` is set

3. **Settings Sheet** — modal, triggered by settings button

4. **Screen Content** — fills available flex space
   - Renders `CameraScreen`, `MediaScreen`, or `MapScreen` based on `activeTab`

5. **Results Panel** — shown on Camera and Media tabs (hidden on Map)
   - **Camera mode:** absolute positioned floating card, bottom offset `260px + safe area`, transparent background
   - **Media mode:** docked below screen, theme background, border-top, padded for tab bar

6. **Tab Bar** — fixed at bottom, surface background, 2px top border, safe area bottom padding

---

### 3. Tab Bar

**File:** `src/components/TabBar.tsx`
**Role:** Bottom navigation with 3 equal-width tabs.

| Tab    | Icon (Ionicons) | Label    |
|--------|-----------------|----------|
| Camera | `camera`        | "Camera" |
| Media  | `images`        | "Media"  |
| Map    | `map`           | "Map"    |

- **Icon size:** 28px
- **Label:** 12px, Figtree SemiBold, 4px below icon
- **Active state:** red accent color for icon + label
- **Inactive state:** theme text color
- **Container:** surface background, 2px top border, flex row

---

### 4. Camera Screen

**File:** `src/screens/CameraScreen.tsx`
**Role:** Live camera viewfinder with capture-and-detect.

#### States

**Loading (no permission object yet):**
- Full overlay with `ActivityIndicator` centered, dark semi-transparent background

**Web platform:**
- Centered message: "Camera preview is not available on web. Use a physical device or simulator."
- Secondary note about iOS Simulator limitations

**Permission denied:**
- Centered message: "Camera permission is required."
- Red CTA button: "Grant permission" with neo shadow

**Active (permission granted):**
- `CameraView` fills container (back-facing camera)
- Loading overlay while camera initializes (`onCameraReady`)
- Capture overlay at bottom center:
  - **Capture button (FAB):** 72px red circle, 2px border, neo shadow
    - **Inner circle:** 56px white (shutter appearance)
    - **Capturing state:** shows `ActivityIndicator`, opacity reduced to 0.6, disabled

#### Container
- 2px border, 12px radius, overflow hidden, neo shadow
- Minimum height: 300px

---

### 5. Media Screen

**File:** `src/screens/MediaScreen.tsx`
**Role:** Image and video upload with detection processing.

#### Layout (ScrollView)

**Section 1 — Upload Image:**
- **Heading:** "Upload Image" — 16px, SemiBold
- **Button:** "Select Image (JPG/PNG)" — red, neo shadow
  - Changes to "Detecting..." while processing (disabled, opacity 0.6)
- **Image preview** (shown after selection):
  - 200px height, `contain` resize mode
  - Bordered card with large neo shadow, 12px radius

**Section 2 — Upload Video:**
- **Heading:** "Upload Video" — 16px, SemiBold
- **Button:** "Select Video" — surface background (secondary style), neo shadow
- **Hint text:** "Video frame detection requires a dev build. Coming soon." — 12px, Regular

#### Container
- 2px border, 12px radius, overflow hidden, neo shadow
- Content padding: 16px horizontal, 32px bottom

---

### 6. Map Screen

**File:** `src/screens/MapScreen.tsx`
**Role:** Environment-aware map loader.

Chooses implementation based on runtime:

#### MapWebView (Expo Go)

**File:** `src/screens/MapWebView.tsx`

Embeds a Leaflet.js map in a `WebView`:

- **Tile layer:** CARTO (light or dark based on theme)
- **Tile filter:** `sepia(0.2) saturate(1.15)`
- **Gradient overlay:** purple → green → purple (30%/25% opacity)
- **Markers:** custom div icons
  - Green (`#84cc16`) teardrop shape (rotated 45°)
  - 2px border, hard shadow
  - 24x24px
- **Popups:** purple (`#a855f7`) background
  - 2px border, 10px radius, neo shadow
  - Content: detection count title, animals list, source, timestamp
  - White text
- **Zoom controls:** bottom-right, neo-styled (surface bg, border, green hover)
- **Attribution:** neo-styled (surface bg, border)

#### MapNativeView (Dev Build)

**File:** `src/screens/MapNativeView.tsx`

Uses `react-native-maps`:

- **Initial region:** lat 45.5, lng -73.5, delta 20
- **Custom markers:** `NeoMarkerPin` component
  - Green highlight, 2px border, rotated teardrop (24x24px)
  - Hard shadow (2px offset)
- **Callouts:** purple background
  - 2px border, 10px radius, neo shadow
  - Content: detection count, animals, source, timestamp
  - White inverted text

#### MapFallbackView

**File:** `src/screens/MapFallbackView.tsx`

ScrollView listing captures as cards when maps are unavailable:

- **Title:** "Map" — 24px, Bold
- **Subtitle:** instructions about dev builds
- **Capture cards:** surface background, 2px border, 12px radius, neo shadow
  - Detection count + coordinates
  - Animals, source, timestamp

#### Data
All map variants display 5 dummy captures from `src/data/dummyCaptures.ts`:

| ID    | Location        | Coords              | Source | Detections |
|-------|-----------------|----------------------|--------|------------|
| cap-1 | New York, USA   | 40.71, -74.01       | Camera | 1 Bear (92%) |
| cap-2 | Toronto, Canada | 43.65, -79.38       | Image  | 2 Bears (88%, 75%) |
| cap-3 | London, UK      | 51.51, -0.13        | Video  | 1 Bear (85%) |
| cap-4 | Seattle, USA    | 47.61, -122.33      | Camera | 1 Bear (91%) |
| cap-5 | Montreal, Canada| 45.50, -73.57       | Image  | 1 Bear (78%) |

#### Container (all variants)
- 2px border, 12px radius, overflow hidden, neo shadow

---

### 7. Results Panel

**File:** `src/components/ResultsPanel.tsx`
**Role:** Displays detection results in two layout modes.

#### Standard Mode (Media tab)

- **Header row:** "Results" title (20px, Bold) + detection count badge in red
- **Frame metadata** (video only): frame index + timestamp
- **Detection rows** (each as a card):
  - Surface background, 2px border, 12px radius, neo shadow
  - 16px padding, 10px bottom margin
  - **Label** — species name (16px, SemiBold)
  - **Score** — percentage in red (15px, SemiBold)
  - **Bbox** — coordinates (12px, Regular)
- **Empty state:** "No bears detected (above threshold)."
- Has 1px border-top, 24px padding

#### Compact Mode (Camera tab floating)

- Floating card: surface background, 2px border, 12px radius, neo shadow
- Max height: 120px (scrollable, 80px scroll area)
- **Header:** "Results" title + dismiss X button
- **Detection rows:** minimal styling (no card per row), tighter spacing (6px padding, 4px margin)
- Same data fields: label, score, bbox

---

### 8. Settings Sheet

**File:** `src/components/SettingsSheet.tsx`
**Role:** Bottom sheet modal for detection configuration.

#### Trigger
Settings gear button in floating actions (top-right).

#### Layout

- **Backdrop:** full-screen `rgba(0,0,0,0.4)`, tap to dismiss
- **Sheet:** slides up from bottom
  - Surface background, 2px top/left/right border
  - 16px top-left/right radius
  - 20px padding, 40px bottom padding

#### Controls

1. **Drag handle** — 36x4px bar, centered, border color, 2px radius

2. **Title:** "Detection settings" — 18px, SemiBold

3. **Threshold slider:**
   - Label: "Threshold"
   - `Slider` component: min 0.1, max 0.9, step 0.05, default 0.4
   - Red accent track and thumb
   - Current value display (e.g., "0.40") — 16px, SemiBold

4. **Bears only toggle:**
   - Label: "Bears only"
   - `Switch` component
   - Red track when on, border color track when off

---

### 9. Error Banner

**File:** `src/components/ErrorBanner.tsx`
**Role:** Dismissable error notification bar.

- **Background:** `rgba(239, 68, 68, 0.15)` (red tint)
- **Border:** 2px, theme border color, neo shadow
- **Layout:** horizontal row, space-between
- **Content:** error message text (14px, Regular, error color) + X close icon (20px)
- **Radius:** 12px
- **Margin:** 16px horizontal, 8px vertical
- **Padding:** 14px

---

### 10. Theme Toggle

**File:** `src/components/ThemeToggle.tsx`
**Role:** Light/dark mode switch button.

- **Size:** 44px circle (22px radius)
- **Icons:** moon (20px) in light mode, sunny (20px) in dark mode
- **Default variant:** surface background, theme border, small neo shadow
- **Light variant** (used on camera overlay): semi-transparent black background, white icons
- **Action:** toggles theme, persists to AsyncStorage

---

## State Management

### ThemeContext (`src/contexts/ThemeContext.tsx`)

| Value        | Type                | Description                        |
|--------------|---------------------|------------------------------------|
| `theme`      | `'light' \| 'dark'` | Current theme                      |
| `setTheme`   | function            | Switch theme (persists)            |
| `neo`        | `NeoTheme`          | Current color tokens               |
| `isDark`     | boolean             | Convenience flag                   |
| `neoShadow`  | style object        | Standard shadow with correct color |
| `neoShadowSm`| style object       | Small shadow                       |
| `neoShadowLg`| style object       | Large shadow                       |

Initializes from AsyncStorage, falls back to system color scheme.

### AppStateContext (`src/contexts/AppStateContext.tsx`)

| Value              | Type                  | Description                          |
|--------------------|-----------------------|--------------------------------------|
| `activeTab`        | `TabId`               | Current tab (camera/media/map)       |
| `scoreThreshold`   | number                | Detection confidence threshold (0.4) |
| `showOnlyBears`    | boolean               | Filter to bears only (default: true) |
| `initError`        | string \| null        | Current error message                |
| `filterDetections` | function              | Applies threshold + bear filter      |
| `detectorOptions`  | object                | `{ scoreThreshold }` for detector    |
| `setFrameResults`  | function              | Set image detection results          |
| `setVideoDetections`| function             | Set video detection results          |
| `setVideoFrameMeta`| function             | Set video frame metadata             |
| `displayFrame`     | FrameResults \| null  | Computed: active results to show     |
| `displayDetections`| Detection[] \| null   | Computed: active detections list     |

---

## Mock Detector

**File:** `src/lib/detector.ts`

Placeholder for real ML integration. Returns a single mock "Bear" detection after a 300ms delay. Score is `max(threshold, 0.85)`. Ready to be replaced with MediaPipe or TFLite.
