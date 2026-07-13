# NaturaLens — Mobile App

Wildlife recognition app built with React Native (Expo). Take a photo, get a species
name and a confidence score, save it to your list of finds.

## Quick Start (Expo Go)

```bash
npm install
cp .env.example .env
npm start
```

Press `i` for the iOS simulator, `a` for the Android emulator, or scan the QR code with
Expo Go on a real device. Use a real device if you want to actually capture anything —
simulators have no camera.

### The API key is required

Identification calls the Gemini API, so the app needs a key in `.env`:

```
EXPO_PUBLIC_GEMINI_API_KEY=...
```

Get a free one at [AI Studio](https://aistudio.google.com/apikey) — no credit card. Without
it, every capture fails with a "Missing EXPO_PUBLIC_GEMINI_API_KEY" banner.

`EXPO_PUBLIC_*` variables are inlined into the app bundle, so this key ships to anyone who
has the app. Restrict it in AI Studio rather than relying on it staying secret. Moving
identification behind our own API — so the key stays on a server — is what `services/api`
is a placeholder for.

Restart the dev server after editing `.env`; Expo only reads it at startup.

## How it works

`src/lib/detector.ts` shrinks the capture to 1024px, sends it to `gemini-3.1-flash-lite`
with a JSON response schema, and gets back `{ isAnimal, label, confidence }`. Thinking is
set to `minimal` — naming an animal doesn't need a reasoning budget, and it was costing
latency for nothing.

`src/lib/history.ts` persists saved finds. The metadata goes into AsyncStorage; the photo
is copied out of the camera's cache directory (which the OS may purge under storage
pressure) into the document directory, so thumbnails survive a restart.

Identification runs in the cloud rather than on-device because Expo Go can only load the
native modules it ships with — an on-device TFLite runtime would mean giving up the Expo
Go workflow. See [docs/Architecture_Notes.md](../../docs/Architecture_Notes.md).

## Native builds

Expo Go covers everything the app currently does, so you shouldn't need one. If you want
one anyway:

```bash
npm run dev:ios       # expo prebuild && expo run:ios
npm run dev:android   # expo prebuild && expo run:android
```
