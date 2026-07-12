import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import type { Detection, HistoryEntry } from '../types';

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
  };

  const history = [entry, ...(await loadHistory())];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));

  return entry;
}
