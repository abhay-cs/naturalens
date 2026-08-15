import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { Detection, FindLocation, HistoryEntry, SpeciesInfo } from '../types';

/** Versioned so a future schema change can migrate rather than misread old data. */
const STORAGE_KEY = 'naturalens-history-v1';

/**
 * We keep two sizes of every capture, and neither is the original.
 *
 * `takePictureAsync` hands back whatever the sensor gives — around 4032px wide. The detail
 * view shows it 360px tall and the detector never uploads more than 1024px, so the original
 * is several megabytes of pixels that nothing will ever look at. Worse, the list was
 * decoding it — a ~48MB bitmap — to fill a 64pt square.
 */
const DISPLAY_WIDTH = 1600;
const THUMB_WIDTH = 256;

function photoDirectory(): Directory {
  const dir = new Directory(Paths.document, 'history');
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

const photoFile = (id: string) => new File(photoDirectory(), `${id}.jpg`);
const thumbFile = (id: string) => new File(photoDirectory(), `${id}_thumb.jpg`);

/** Resizes `sourceUri` and writes it to `destination`, which lives in the document dir. */
async function writeResized(
  sourceUri: string,
  destination: File,
  width: number,
  compress: number
): Promise<void> {
  const rendered = await ImageManipulator.manipulate(sourceUri)
    .resize({ width })
    .renderAsync();

  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress });

  // saveAsync writes to the cache directory, which the OS may reclaim — the same trap the
  // camera's own capture falls into. Move it somewhere permanent.
  new File(saved.uri).copy(destination);
}

/** Patches one row and writes the list back. Returns null if it's already been deleted. */
async function patchEntry(
  id: string,
  patch: Partial<HistoryEntry>
): Promise<HistoryEntry | null> {
  // Re-read rather than trusting a snapshot: callers get here after a network round trip or
  // an image decode, and the row could have been deleted while that was in flight.
  const history = await loadHistory();
  const entry = history.find((e) => e.id === id);
  if (!entry) return null;

  const updated = { ...entry, ...patch };

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(history.map((e) => (e.id === id ? updated : e)))
  );

  return updated;
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

/**
 * Saves a detection, writing its photo somewhere the OS won't reclaim.
 *
 * `location` is passed in rather than resolved here: it has to be read at the moment of
 * capture, not at the moment of save, and the caller is the only one who knows the
 * difference. Undefined is a perfectly ordinary value — see `src/lib/location.ts`.
 */
export async function addHistoryEntry(
  detection: Detection,
  capturedPhotoUri: string,
  location?: FindLocation
): Promise<HistoryEntry> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // expo-camera writes captures to the cache directory, which iOS and Android are free to
  // purge under storage pressure. Both of these land in the document directory instead, so
  // the list still has its images after a restart.
  const photo = photoFile(id);
  const thumb = thumbFile(id);

  await writeResized(capturedPhotoUri, photo, DISPLAY_WIDTH, 0.85);
  await writeResized(capturedPhotoUri, thumb, THUMB_WIDTH, 0.7);

  const entry: HistoryEntry = {
    id,
    label: detection.label,
    score: detection.score,
    photoUri: photo.uri,
    thumbUri: thumb.uri,
    timestamp: Date.now(),
    info: detection.info,
    location,
  };

  const history = [entry, ...(await loadHistory())];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));

  return entry;
}

/**
 * Gives a find saved before thumbnails existed one, from the full photo it already has.
 * Returns null if there was nothing to do, or the row is gone.
 */
export async function ensureThumbnail(entry: HistoryEntry): Promise<HistoryEntry | null> {
  if (entry.thumbUri) return null;

  const thumb = thumbFile(entry.id);
  await writeResized(entry.photoUri, thumb, THUMB_WIDTH, 0.7);

  return patchEntry(entry.id, { thumbUri: thumb.uri });
}

/**
 * Fills in the species details of a find saved before we looked them up. Returns the
 * updated entry, or null if it was deleted while the lookup was in flight.
 */
export async function setHistoryEntryInfo(
  id: string,
  info: SpeciesInfo
): Promise<HistoryEntry | null> {
  return patchEntry(id, { info });
}

/** Forgets a detection, and takes its images with it. */
export async function deleteHistoryEntry(id: string): Promise<void> {
  const history = await loadHistory();
  const entry = history.find((e) => e.id === id);
  if (!entry) return;

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(history.filter((e) => e.id !== id))
  );

  // We wrote these into the document directory, where nothing else will ever reclaim them.
  // Dropping the row without dropping the files leaks them for the life of the install —
  // and there are two of them now, so missing the thumb leaks it just as surely.
  for (const uri of [entry.photoUri, entry.thumbUri]) {
    if (!uri) continue;
    try {
      new File(uri).delete();
    } catch {
      // Already gone, or never written. The row is what the user asked us to remove.
    }
  }
}
