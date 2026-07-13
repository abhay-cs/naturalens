import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import type { Detection, HistoryEntry, SpeciesInfo } from '../types';

/** Versioned so a future schema change can migrate rather than misread old data. */
const STORAGE_KEY = 'naturalens-history-v1';

function photoDirectory(): Directory {
  const dir = new Directory(Paths.document, 'history');
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** Reads the saved detections, newest first. */
export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Corrupt or unreadable — start clean rather than crash on launch.
    return [];
  }
}

/** Saves a detection, copying its photo somewhere the OS won't reclaim. */
export async function addHistoryEntry(
  detection: Detection,
  capturedPhotoUri: string
): Promise<HistoryEntry> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // expo-camera writes captures to the cache directory, which iOS and Android are
  // free to purge under storage pressure. Copy it into the document directory so
  // the list still has its thumbnails after a restart.
  const destination = new File(photoDirectory(), `${id}.jpg`);
  new File(capturedPhotoUri).copy(destination);

  const entry: HistoryEntry = {
    id,
    label: detection.label,
    score: detection.score,
    photoUri: destination.uri,
    timestamp: Date.now(),
    info: detection.info,
  };

  const history = [entry, ...(await loadHistory())];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));

  return entry;
}

/**
 * Fills in the species details of a find saved before we looked them up. Returns the
 * updated entry, or null if it was deleted while the lookup was in flight.
 */
export async function setHistoryEntryInfo(
  id: string,
  info: SpeciesInfo
): Promise<HistoryEntry | null> {
  // Re-read rather than trusting a snapshot: the lookup is a network round trip, and the
  // row could have been deleted while it was out.
  const history = await loadHistory();
  const entry = history.find((e) => e.id === id);
  if (!entry) return null;

  const updated = { ...entry, info };

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(history.map((e) => (e.id === id ? updated : e)))
  );

  return updated;
}

/** Forgets a detection, and takes its photo with it. */
export async function deleteHistoryEntry(id: string): Promise<void> {
  const history = await loadHistory();
  const entry = history.find((e) => e.id === id);
  if (!entry) return;

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(history.filter((e) => e.id !== id))
  );

  // addHistoryEntry copied this photo into the document directory, where nothing else will
  // ever reclaim it. Deleting the row without deleting the file leaks it forever.
  try {
    new File(entry.photoUri).delete();
  } catch {
    // Already gone, or never written. The row is what the user asked us to remove.
  }
}
