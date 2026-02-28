# NaturaLens — HarmonyOS‑Inspired Design Spec (React Native)

This document defines the **target HarmonyOS‑inspired UI** for the NaturaLens mobile app.  
Use this as the **single source of truth** when refactoring the existing React Native UI.

- Keep **all business logic, navigation, and APIs** intact.  
- Limit changes to **styles, layout, and presentational components**.  
- Use this spec together with the existing architecture and file structure.

---

## 0. External Design References (Conceptual Only)

Use these as conceptual references for layout, visual language, and behavior:

- HarmonyOS NEXT Design  
  https://developer.huawei.com/consumer/en/design/

- HarmonyOS Design Resources  
  https://developer.huawei.com/consumer/en/design/resource/

- HarmonyOS Service Cards / Widgets (atomic services)  
  http://harmonyos.litebook.cn/docs/service-widget-overview.html

- HarmonyOS Design Technical Deep Dive  
  https://dev.to/moyantianwang/harmonyos-design-technical-deep-dive-51bc

Do **not** copy proprietary fonts, icons, or branding. Use HarmonyOS as inspiration only.

---

## 1. App Architecture (Unchanged)

The overall structure and behavior of the app remain the same:

```text
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


Key points for implementation:
	•	Do not change the above structure or navigation behavior.
	•	All redesign work should be achieved by:
	•	Introducing a HarmonyOS‑inspired theme
	•	Creating reusable UI components (buttons, cards, etc.)
	•	Refactoring existing screens to use those components.
2. HarmonyOS‑Inspired Design System
The design system defines tokens to be exposed from  ThemeContext  (or an equivalent  theme  module).
2.1 Color Tokens
Use a bright, clean, blue/white theme with neutral grays and restrained semantic colors.

colors: {
  // Base
  bg: '#F5F7FA',          // App background
  surface: '#FFFFFF',     // Primary surfaces: cards, sheets, tab bar
  surfaceMuted: '#F7F8FA',// Secondary surfaces, panels
  borderSubtle: '#E0E4EA',// Hairline borders, dividers

  // Primary
  primary: '#007DFF',     // Primary actions, active states
  primaryDark: '#0055B8', // Pressed/focused primary
  primarySoft: '#E0F0FF', // Subtle background tint, badges

  // Text
  textMain: '#111827',    // Main text
  textSecondary: '#6B7280',// Secondary text, hints

  // Semantic
  success: '#22C55E',
  warning: '#F59E0B',
  danger:  '#EF4444',

  // Overlays
  overlay: 'rgba(15,23,42,0.35)', // Backdrop for modals/sheets
}
For dark mode, use the same keys with darker values (example):
darkColors: {
  bg: '#050816',
  surface: '#111827',
  surfaceMuted: '#020617',
  borderSubtle: '#1F2937',
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primarySoft: '#1D314B',
  textMain: '#F9FAFB',
  textSecondary: '#9CA3AF',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger:  '#F97373',
  overlay: 'rgba(0,0,0,0.55)',
}
Implementation:
	•	Expose these through  ThemeContext  as  tokens.colors .
	•	All components should use these tokens instead of hardcoded colors.
2.2 Typography Tokens
Use Figtree with a Harmony‑style hierarchy.
typography: {
  display: {
    fontFamily: 'Figtree_700Bold',
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
  },
  titleLg: {
    fontFamily: 'Figtree_700Bold',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  titleMd: {
    fontFamily: 'Figtree_600SemiBold',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  titleSm: {
    fontFamily: 'Figtree_600SemiBold',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  body: {
    fontFamily: 'Figtree_400Regular',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodySm: {
    fontFamily: 'Figtree_400Regular',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontFamily: 'Figtree_500Medium',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
}
Guidelines:
	•	Titles: 16–24 px; use weight and spacing instead of huge size jumps.
	•	Body: 14–16 px; comfortable reading on mobile.
	•	Caption: for metadata, tags, and badges.
2.3 Spacing & Layout Tokens
Use a 4‑point grid.
spacing: {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
}
Rules:
	•	16–24 px internal padding inside cards, modals, and sheets.
	•	16 px between related elements.
	•	24+ px between major sections on a screen.
	•	Use spacing tokens in all layout styles.
2.4 Shape (Radius) & Elevation (Shadow) Tokens
Radius:
radius: {
  sm: 8,   // Inputs, small buttons
  md: 12,  // Cards, standard buttons
  lg: 16,  // Large cards, modals, sheets
  pill: 999, // Fully rounded pills
}

Shadows (soft, Harmony‑like):
shadows: {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
}

Implementation notes:
	•	Replace all hard neobrutalist shadows with  shadows.sm  /  shadows.md .
	•	Use borders sparingly (1 px  borderSubtle ) combined with elevation.
2.5 Motion Tokens
Use a standard Harmony‑style easing and duration set.

motion: {
  easingStandard: Easing.bezier(0.4, 0, 0.2, 1),
  durationShort: 150,
  durationMed: 230,
  durationLong: 300,
}

Usage:
	•	Buttons:  durationShort  for press feedback.
	•	Cards, overlays, sheets:  durationMed .
	•	Larger transitions (if customized): up to  durationLong .
3. Core UI Components
Implement or refactor these React Native components and then apply them across all screens.
3.1  <PrimaryButton /> 
Behavior:
	•	Used for primary CTAs.
Style:
	•	Background:  colors.primary 
	•	Text: white,  typography.titleSm  or  body 
	•	Radius:  radius.md  (12)
	•	Padding: horizontal  spacing.lg , vertical  spacing.sm – spacing.md 
	•	Shadow:  shadows.md 
	•	Disabled: opacity ~0.6, no extra shadow.
Interaction:
	•	 Pressable  with style callback:
	•	Pressed: background =  colors.primaryDark , scale ~0.96
	•	Transition:  motion.easingStandard ,  motion.durationShort .
3.2  <SecondaryButton /> 
Behavior:
	•	Secondary actions (e.g., “Select video”).
Style:
	•	Background:  colors.surfaceMuted 
	•	Border: 1 px  colors.borderSubtle 
	•	Text:  colors.primary 
	•	Radius:  radius.md 
	•	Shadow:  shadows.sm  or none.
Interaction: similar press feedback (lighter).
3.3  <HarmonyCard /> 
Generic card container.
Props (example):
	•	 title? ,  icon? ,  subtitle? ,  footer? ,  onPress? ,  children .
Style:
	•	Background:  colors.surface  or  surfaceMuted 
	•	Radius:  radius.md  or  radius.lg 
	•	Padding:  spacing.lg – spacing.xl 
	•	Border: optional 1 px  colors.borderSubtle 
	•	Shadow:  shadows.sm  (or  shadows.md  for elevated cards)
Layout:
	•	Optional header: horizontal row with icon + title ( typography.titleSm ) + optional badge.
	•	Body:  children , use  typography.body  /  bodySm .
	•	Optional footer: actions (buttons/chips) right‑aligned.
3.4  <AppBar />  / Top Bar
Used at the top of relevant screens (if not already built in layout).
Style:
	•	Height: ~56–64 px.
	•	Background:  colors.bg  or  colors.surface .
	•	Content:
	•	Left: back button if applicable.
	•	Center: title ( typography.titleMd ).
	•	Right: optional actions.
	•	Bottom border: 1 px  borderSubtle  or subtle shadow.
3.5  <TabBar />  (Existing, Restyled)
Keep behavior (3 tabs: Camera, Media, Map), update visual design:
Container:
	•	Background:  colors.surface 
	•	BorderTop: 1 px  colors.borderSubtle 
	•	Padding:  spacing.sm  + bottom safe area.
Tab item:
	•	Flex: 1, center aligned.
	•	Icon: 22–24 px.
	•	Label:  typography.caption .
States:
	•	Active: icon + label  colors.primary ; optional small primary indicator bar.
	•	Inactive:  colors.textSecondary .
Press feedback: slight scale/opacity change,  durationShort .
3.6  <FormField />  (for future use)
Pattern for text inputs:
	•	Label:  typography.titleSm  or  bodySm .
	•	Input:
	•	Full‑width
	•	Background:  colors.surfaceMuted 
	•	BorderRadius:  radius.md 
	•	Border: 1 px  borderSubtle 
	•	Padding:  spacing.sm – spacing.md 
	•	Focused: border color =  colors.primary .
	•	Error: border color =  colors.danger , helper text in  danger .
4. Screen & Component Specs
4.1 OnboardingOverlay
File:  src/components/OnboardingOverlay.tsx 
Shown only on first launch (logic unchanged).
Layout:
	•	Full‑screen overlay:  colors.overlay .
	•	Centered  HarmonyCard  with:
	•	Background:  colors.surface 
	•	Radius:  radius.lg  (16)
	•	Shadow:  shadows.md 
	•	Padding:  spacing.xl  (24)– spacing'2xl'  (32)
	•	Max width: 360–400
	•	Vertical gap: 16–20
Slide 0 — Welcome
	•	Title: “NaturaLens” —  typography.titleLg , centered.
	•	Tagline: “Spot wildlife in photos and videos” —  typography.body ,  colors.textSecondary .
	•	CTA:  <PrimaryButton>Get started</PrimaryButton>  centered.
Slide 1 — How it works
	•	Subtitle: “How it works” —  typography.titleMd , centered.
	•	Two feature cards (compact  HarmonyCard ):
	•	Background:  surfaceMuted 
	•	Radius:  radius.md 
	•	Padding:  spacing.lg 
	•	Layout: icon (40 px, circular  primarySoft  bg) + text column.
	•	Titles:  typography.titleSm 
	•	Body:  typography.bodySm ,  colors.textSecondary .
Content:
	•	“Camera” — “Capture live and detect wildlife in real time.”
	•	“Media” — “Upload images or videos to analyze for wildlife.”
Slide 2 — Completion
	•	Subtitle: “You’re all set” —  typography.titleMd .
	•	Tagline: “Start detecting wildlife with your camera or uploads.” —  typography.body .
	•	CTA:  <PrimaryButton>Start detecting wildlife</PrimaryButton> .
Navigation Controls
	•	Back/Next text buttons:
	•	Style:  typography.bodySm 
	•	Color:  colors.primary 
	•	Minimal padding.
	•	Dot indicators:
	•	3 dots, 8×8, radius 4.
	•	Active:  colors.primary , inactive:  colors.borderSubtle .
	•	Spacing: 6–8.
4.2 MainLayout
File:  src/layouts/MainLayout.tsx 
Regions unchanged; styling updated.
Floating Action Buttons
	•	Position: top right (just below status bar).
	•	Two small pill/circle buttons:
	•	Size: 36–40
	•	Background:  colors.surface  (or  overlay  variant on camera).
	•	Border: 1 px  borderSubtle 
	•	Shadow:  shadows.sm 
	•	Icon color:  textSecondary  (or white on dark overlay).
Screen Container
For Media and Map screens:
	•	Use a top‑level  HarmonyCard  style container:
	•	Background:  colors.surface 
	•	Radius:  radius.lg 
	•	Shadow:  shadows.md 
	•	Padding:  spacing.lg – spacing.xl 
	•	MarginHorizontal:  spacing.lg 
	•	MarginTop:  spacing.sm – spacing.md 
Camera screen uses similar container but with the camera filling it (see below).
ResultsPanel & TabBar
	•	See the dedicated sections below.
4.3 CameraScreen
File:  src/screens/CameraScreen.tsx 
Container
	•	Root container inside MainLayout:
	•	 HarmonyCard  with no internal padding for the camera area.
	•	Background:  surface 
	•	Radius:  radius.lg 
	•	Shadow:  shadows.md 
	•	Overflow:  'hidden' 
States
	•	Loading:
	•	Overlay view with  ActivityIndicator  and  bodySm  text ( textSecondary ).
	•	Backdrop:  rgba(0,0,0,0.25) .
	•	Web / permission denied:
	•	Centered small  HarmonyCard  with:
	•	Title:  titleSm 
	•	Body:  body 
	•	 <PrimaryButton>  “Grant permission” if applicable.
	•	Active:
	•	 CameraView  fills the card.
	•	Rounded corners handled by parent container.
Capture Control
	•	Bottom overlay:
	•	Linear gradient from transparent to  rgba(0,0,0,0.5) .
	•	Horizontal layout with center‑aligned capture.
	•	Capture button:
	•	Outer circle: 68–72 px,  surface ,  shadows.md .
	•	Inner circle: 52–56 px,  colors.primary .
	•	Press animation: scale to 0.95, color →  primaryDark .
	•	Capturing:
	•	Disable press, show  ActivityIndicator  instead of capture icon.
4.4 MediaScreen
File:  src/screens/MediaScreen.tsx 
Container:
	•	One  HarmonyCard :
	•	Background:  surface 
	•	Radius:  radius.lg 
	•	Shadow:  shadows.md 
	•	Padding:  spacing.lg – spacing.xl 
	•	Gap between sections:  spacing.xl .
Section — Upload Image
	•	Heading: “Upload image” —  titleSm .
	•	Optional helper text (short):  bodySm ,  textSecondary .
	•	Button:  <PrimaryButton>Select image (JPG/PNG)</PrimaryButton> :
	•	Disabled label: “Detecting…” with opacity ~0.6.
	•	Preview:
	•	Container:
	•	Background:  surfaceMuted 
	•	Radius:  radius.md 
	•	Border: 1 px  borderSubtle 
	•	Height: ~220
	•	Shadow:  shadows.sm  (optional).
	•	Image:  resizeMode="contain" .
Section — Upload Video
	•	Heading: “Upload video” —  titleSm .
	•	Button:  <SecondaryButton>Select video</SecondaryButton> .
	•	Hint:  bodySm ,  textSecondary , marginTop:  spacing.sm .
4.5 MapScreen
File:  src/screens/MapScreen.tsx 
Container:
	•	 HarmonyCard  around the map:
	•	Background:  surface 
	•	Radius:  radius.lg 
	•	Shadow:  shadows.md 
	•	Overflow:  'hidden' 
Map (web/native):
	•	Keep existing runtime logic and tile providers.
	•	Update overlay styling:
	•	Markers: rounded (e.g., circular) pins with soft shadow; no harsh borders.
	•	Callouts/popups:
	•	Background:  surface  or  surfaceMuted 
	•	Radius:  radius.md 
	•	Border: 1 px  borderSubtle 
	•	Text: title  titleSm , meta  caption  ( textSecondary ).
MapFallbackView:
	•	Title: “Map” —  titleLg .
	•	Subtitle:  bodySm ,  textSecondary .
	•	Capture cards:  HarmonyCard  style with detection info and meta.
4.6 ResultsPanel
File:  src/components/ResultsPanel.tsx 
Two modes: standard (Media) and compact (Camera).
Standard Mode (Media tab)
Container:
	•	Background:  surface 
	•	BorderTop: 1 px  borderSubtle  or small top shadow only.
	•	Padding: vertical  spacing.lg – spacing.xl , horizontal  spacing.lg .
Header:
	•	Row with:
	•	Left: “Results” —  titleSm .
	•	Right: badge:
	•	Background:  primarySoft 
	•	Text:  primary ,  caption 
	•	Padding: horizontal 10–12, vertical 4
	•	BorderRadius:  radius.pill .
Items:
	•	Each detection = small  HarmonyCard :
	•	Background:  surfaceMuted 
	•	Radius:  radius.md 
	•	Border: 1 px  borderSubtle 
	•	Padding:  spacing.md – spacing.lg 
	•	MarginBottom:  spacing.sm – spacing.md .
	•	Layout:
	•	Top row: species name ( titleSm ) + score (percentage,  bodySm , color  success  or  danger ).
	•	Bottom row: bbox/meta as  caption ,  textSecondary .
Empty state:
	•	Centered text in panel:  bodySm ,  textSecondary  (optional icon).
Compact Mode (Camera tab, floating)
Floating Container:
	•	Background:  surface 
	•	Radius:  radius.lg 
	•	Shadow:  shadows.md 
	•	Padding:  spacing.md – spacing.lg 
	•	Positioned above bottom and above capture button; respect safe area.
Content:
	•	Header:
	•	“Results” —  titleSm .
	•	Close icon: 24 px,  textSecondary .
	•	List:
	•	Simple text rows ( bodySm ), 8 px vertical padding, limited height with scroll.
4.7 SettingsSheet
File:  src/components/SettingsSheet.tsx 
Backdrop:
	•	Full screen  colors.overlay , tap to dismiss.
Sheet:
	•	Slide up from bottom using  motion.easingStandard  and  motion.durationMed  (~230 ms).
	•	Style:
	•	Background:  surface 
	•	Top radius:  radius.lg 
	•	BorderTop: 1 px  borderSubtle 
	•	Padding:  spacing.lg – spacing.xl 
	•	Extra bottom padding for safe area.
Content:
	•	Drag handle: 36×4, radius  radius.pill , fill  borderSubtle , centered.
	•	Title: “Detection settings” —  titleMd .
Controls:
	1.	Threshold slider:
	•	Label row:
	•	Left: “Threshold” —  titleSm .
	•	Right: value (e.g.,  0.40 ) —  titleSm .
	•	Slider:
	•	Active track:  primary 
	•	Inactive track:  borderSubtle 
	•	Thumb: circular,  primary ,  shadows.sm .
	2.	“Bears only” toggle:
	•	Row:
	•	Left: label “Bears only” ( titleSm ) + description in  bodySm ,  textSecondary .
	•	Right:  Switch :
	•	Active:  primary  track, white thumb.
	•	Inactive:  borderSubtle  track.
4.8 ErrorBanner
File:  src/components/ErrorBanner.tsx 
Style:
	•	Background:  rgba(239,68,68,0.06)  (soft red).
	•	Border: 1 px  danger  or  borderSubtle .
	•	Radius:  radius.md .
	•	Shadow:  shadows.sm  or none.
	•	Padding:  spacing.md – spacing.lg .
	•	Margin: horizontal  spacing.lg , vertical  spacing.sm .
Layout:
	•	Row,  space-between , center aligned.
	•	Text:  bodySm ,  colors.danger .
	•	Close icon: 20–24 px touch target,  textSecondary , slightly darker on press.
4.9 ThemeToggle
File:  src/components/ThemeToggle.tsx 
Default style (non‑camera):
	•	Size: 36–40 circle.
	•	Background:  surface .
	•	Border: 1 px  borderSubtle .
	•	Shadow:  shadows.sm .
	•	Icon: sun/moon, 18–20,  textSecondary .
Camera overlay variant:
	•	Background:  rgba(15,23,42,0.6)  (light) /  rgba(15,23,42,0.8)  (dark).
	•	Icon: white.
Press feedback: short‑duration scale + opacity change.
5. Theme & Context Integration
5.1 ThemeContext
Refactor  ThemeContext  to expose Harmony tokens:
	•	 theme :  'light' | 'dark' 
	•	 setTheme(theme) 
	•	 tokens :  { colors, typography, spacing, radius, shadows, motion } 
	•	 isDark : boolean
Remove:
	•	The old  neo  style tokens ( neoShadow ,  neoShadowSm , etc.).
	•	Any hard‑coded neobrutalist borders/shadows/colors.
6. Implementation Strategy (For Cursor)
	1.	Create/Update theme module
	•	In  src/theme.ts  (or existing theme file), implement the  tokens  as described above.
	•	Wire it into  ThemeContext  so components can use  const { tokens } = useTheme() .
	2.	Implement core components
	•	Add  PrimaryButton ,  SecondaryButton ,  HarmonyCard ,  AppBar  (if needed) in  src/components/ui  or similar.
	•	Refactor existing code to use these instead of inline styles.
	3.	Refactor screens/components in this order:
	•	 OnboardingOverlay.tsx 
	•	 MainLayout.tsx  (floating buttons, container, TabBar import)
	•	 TabBar.tsx 
	•	 CameraScreen.tsx 
	•	 MediaScreen.tsx 
	•	 MapScreen.tsx  +  MapWebView.tsx  +  MapNativeView.tsx  +  MapFallbackView.tsx 
	•	 ResultsPanel.tsx 
	•	 SettingsSheet.tsx 
	•	 ErrorBanner.tsx 
	•	 ThemeToggle.tsx 
	4.	Keep behavior intact
	•	Do not change business logic, data fetching, or navigation.
	•	Only adjust styles, component composition, and layout.
	5.	Polish & consistency
	•	Remove unused neobrutalism style constants and redundant inline styles.
	•	Ensure all screens use tokens for color/spacing/typography.
	•	Ensure all buttons and interactable elements have visible pressed states and sufficient touch targets.