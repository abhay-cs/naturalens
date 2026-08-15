/**
 * Google Maps style JSON — the map, reduced to terrain.
 *
 * Volume One's map is an abstraction: pale ground, a few road lines, the occasional street
 * name set in the label ramp. Everything a consumer map adds to sell you things — business
 * pins, transit, shields, satellite texture — is noise against a black square pin, so it
 * comes off.
 *
 * **Android only.** Apple Maps ignores `customMapStyle`; `MapScreen` falls back to
 * `mutedStandard` on iOS, which is the closest stock equivalent and still noticeably busier.
 * Closing that gap means replacing react-native-maps with MapLibre and a vector style,
 * which costs the Expo Go workflow — see `apps/mobile/README.md`.
 *
 * Greys are the chrome tokens: `#F2F2F0` ground (a hair warmer than `surface`), `#E7E7E5`
 * water, `#E2E2E0` roads, `caption` for the few labels that survive.
 */
export const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#F2F2F0' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#999999' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#F2F2F0' }] },

  // Anything commercial or administrative. A map of finds shouldn't also be a directory.
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },

  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#EDEDEB' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#E7E7E5' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#AFAFAF' }] },

  // Roads as line work only — no casing, no fill, no shields.
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#E2E2E0' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#DEDEDC' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#AFAFAF' }] },
];
