/** A single label guess from the classifier. */
export interface Detection {
  label: string;
  /** Confidence, 0 to 1. */
  score: number;
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
}
