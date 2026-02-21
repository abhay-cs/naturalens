# NaturaLens — Mobile App

Wildlife recognition app built with React Native (Expo).

## Quick Start (Expo Go)

```bash
npm install
npm start
```

Press `i` for iOS simulator or `a` for Android emulator. Use Expo Go on device.

**Note:** In Expo Go, the Map tab shows a list fallback (no native maps). For the full map, use a development build.

## Map Functionality (Development Build)

Native maps require a **development build** (not Expo Go). Run:

### iOS
```bash
npm run dev:ios
```
Or: `npx expo prebuild` then `npx expo run:ios`

### Android
```bash
npm run dev:android
```
Or: `npx expo prebuild` then `npx expo run:android`

**Android:** You may need a [Google Maps API key](https://developers.google.com/maps/documentation/android-sdk/get-api-key) in `app.json`:
```json
"android": {
  "config": {
    "googleMaps": { "apiKey": "YOUR_API_KEY" }
  }
}
```

**iOS:** Uses Apple Maps by default (no API key needed).
