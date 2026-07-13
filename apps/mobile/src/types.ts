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

/** A saved detection, persisted across app restarts. */
export interface HistoryEntry {
  id: string;
  label: string;
  /** Confidence, 0 to 1. */
  score: number;
  /** Permanent on-disk copy of the capture — not the camera's cache URI. */
  photoUri: string;
  timestamp: number;
  /** Absent on finds saved before species info existed — render without it. */
  info?: SpeciesInfo;
  /**
   * Small copy for the history list. Absent on finds saved before it existed, and
   * backfilled on load — until then the row falls back to the full photo.
   */
  thumbUri?: string;
}
