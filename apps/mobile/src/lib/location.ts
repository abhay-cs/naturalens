import * as Location from 'expo-location';
import type { FindLocation } from '../types';

/**
 * Where a capture happened.
 *
 * Every function here degrades to `undefined` rather than throwing. A find without a
 * location is a normal find — permission denied, indoors with no fix, airplane mode — and
 * losing the photo because the GPS was slow would be a far worse outcome than losing the
 * pin. Nothing in this module is allowed to fail a capture.
 */

/**
 * How long to wait for a fix before giving up and saving the find without one.
 *
 * A cold GPS start can run past 30s. The user is standing there with a frozen frame on
 * screen waiting to save, so we take the coarse answer or none at all.
 */
const FIX_TIMEOUT_MS = 4000;

/** Reverse geocoding is a network call on Android and can hang; it is pure garnish. */
const GEOCODE_TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([
    promise,
    new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms)),
  ]);
}

/**
 * Ask for foreground location, once.
 *
 * Returns whether we have it. Deliberately not called at launch — the permission prompt
 * makes far more sense on the first capture, when there is something to attach a place to.
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}

/** Whether location has already been granted, without prompting. */
export async function hasLocationPermission(): Promise<boolean> {
  try {
    const { granted } = await Location.getForegroundPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}

/**
 * Resolve the current position and the name of the place, for attaching to a new find.
 *
 * `place` is looked up here rather than when the detail screen opens because a find can be
 * opened offline, months later, a thousand miles away — and by then the only honest answer
 * would be coordinates.
 */
export async function getCurrentFindLocation(): Promise<FindLocation | undefined> {
  try {
    if (!(await hasLocationPermission())) return undefined;

    const position = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      FIX_TIMEOUT_MS,
    );
    if (!position) return undefined;

    const { latitude, longitude } = position.coords;
    return {
      lat: latitude,
      lon: longitude,
      place: await describePlace(latitude, longitude),
    };
  } catch (err) {
    console.warn('location lookup failed', err);
    return undefined;
  }
}

/**
 * Name a coordinate the way someone would say it out loud — the street if we have one,
 * otherwise the district, otherwise the city.
 */
async function describePlace(lat: number, lon: number): Promise<string | undefined> {
  try {
    const results = await withTimeout(
      Location.reverseGeocodeAsync({ latitude: lat, longitude: lon }),
      GEOCODE_TIMEOUT_MS,
    );
    const first = results?.[0];
    if (!first) return undefined;

    return first.street || first.district || first.subregion || first.city || undefined;
  } catch {
    return undefined;
  }
}

/** Coordinates as they appear on the find detail — 4dp is roughly 11m, plenty for a pin. */
export function formatCoords({ lat, lon }: FindLocation): string {
  const format = (n: number) => `${n < 0 ? '−' : ''}${Math.abs(n).toFixed(4)}`;
  return `${format(lat)}, ${format(lon)}`;
}
