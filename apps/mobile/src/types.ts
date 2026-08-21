/** IUCN Red List categories, least to most at risk. */
export const CONSERVATION_STATUSES = [
  'Least Concern',
  'Near Threatened',
  'Vulnerable',
  'Endangered',
  'Critically Endangered',
  'Extinct in the Wild',
  'Data Deficient',
] as const;

export type ConservationStatus = (typeof CONSERVATION_STATUSES)[number];

/** What the model knows about the species, beyond its name. */
export interface SpeciesInfo {
  description: string;
  habitat: string;
  diet: string;
  conservationStatus: ConservationStatus;
}

/** A single label guess from the classifier. */
export interface Detection {
  label: string;
  /** Confidence, 0 to 1. */
  score: number;
  info: SpeciesInfo;
}

/**
 * Where a find was made.
 *
 * Resolved once, at capture. `place` is reverse-geocoded there and then rather than on
 * open, so the detail screen can name the spot without a network call.
 */
export interface FindLocation {
  lat: number;
  lon: number;
  /** Nearest street or locality, e.g. "Beechwood Lane". Absent if the lookup failed. */
  place?: string;
}

/** A saved detection, persisted across app restarts. */
export interface HistoryEntry {
  id: string;
  label: string;
  /** Confidence, 0 to 1. */
  score: number;
  /**
   * Display URI for the capture. On disk we persist `{id}.jpg` under Documents/history
   * and resolve it against the current container — absolute file:// paths die when iOS
   * rotates the app UUID on a TestFlight update.
   */
  photoUri: string;
  timestamp: number;
  /** Absent on finds saved before species info existed — render without it. */
  info?: SpeciesInfo;
  /**
   * Small copy for the history list. Absent on finds saved before it existed, and
   * backfilled on load — until then the row falls back to the full photo.
   */
  thumbUri?: string;
  /**
   * Where the capture happened. Absent on every find saved before location existed, and
   * on any find where permission was denied or the fix timed out.
   *
   * Unlike `info`, this can never be backfilled — the moment is gone. Finds without it
   * read "not geotagged" and simply don't appear on the map.
   */
  location?: FindLocation;
}
