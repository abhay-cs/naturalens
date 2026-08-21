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

function fileExists(file: File): boolean {
  try {
    return file.exists;
  } catch {
    return false;
  }
}

function fileExistsUri(uri: string | undefined): boolean {
  if (!uri) return false;
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

/** Names stored in AsyncStorage — not absolute file:// URLs, which die when iOS changes container UUID. */
function storedPhotoName(id: string) {
  return `${id}.jpg`;
}
function storedThumbName(id: string) {
  return `${id}_thumb.jpg`;
}

function persistable(entry: HistoryEntry): HistoryEntry {
  return {
    ...entry,
    photoUri: storedPhotoName(entry.id),
    thumbUri: entry.thumbUri ? storedThumbName(entry.id) : undefined,
  };
}

/**
 * Resolve a stored path to a URI the Image component can load in *this* container.
 *
 * After a TestFlight update the Documents files migrate but AsyncStorage still has the
 * previous UUID. Prefer the canonical file for this id; fall back to the stored URI if
 * that file still exists; otherwise keep the stored string so the row stays (gray).
 */
function hydrate(entry: HistoryEntry): HistoryEntry {
  const canonicalPhoto = photoFile(entry.id);
  const canonicalThumb = thumbFile(entry.id);

  let photoUri = entry.photoUri;
  if (fileExists(canonicalPhoto)) {
    photoUri = canonicalPhoto.uri;
  } else if (fileExistsUri(entry.photoUri)) {
    photoUri = entry.photoUri;
  } else if (entry.photoUri && !entry.photoUri.includes('://')) {
    photoUri = canonicalPhoto.uri;
  }

  let thumbUri = entry.thumbUri;
  if (fileExists(canonicalThumb)) {
    thumbUri = canonicalThumb.uri;
  } else if (fileExistsUri(entry.thumbUri)) {
    thumbUri = entry.thumbUri;
  } else if (entry.thumbUri && !entry.thumbUri.includes('://')) {
    thumbUri = canonicalThumb.uri;
  }

  return { ...entry, photoUri, thumbUri };
}

function needsPersistRewrite(raw: HistoryEntry): boolean {
  return (
    raw.photoUri !== storedPhotoName(raw.id) ||
    (raw.thumbUri != null && raw.thumbUri !== storedThumbName(raw.id))
  );
}

function livePhotoUri(entry: HistoryEntry): string | undefined {
  const canonical = photoFile(entry.id);
  if (fileExists(canonical)) return canonical.uri;
  if (fileExistsUri(entry.photoUri)) return entry.photoUri;
  return undefined;
}

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

function tryDelete(file: File) {
  try {
    file.delete();
  } catch {
    // Already gone, or never written.
  }
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

  const updated = hydrate({ ...entry, ...patch });

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(history.map((e) => persistable(e.id === id ? updated : e)))
  );

  return updated;
}

/** Reads the saved detections, newest first. Image URIs are resolved for this container. */
export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const hydrated = parsed.map((row: HistoryEntry) => hydrate(row));
    if (parsed.some((row: HistoryEntry) => needsPersistRewrite(row))) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(hydrated.map(persistable)));
    }

    return hydrated;
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
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history.map(persistable)));

  return entry;
}

/**
 * Gives a find a thumbnail when the thumb file is missing but the full photo is still here.
 * Returns null if there was nothing to do, or the row is gone.
 */
export async function ensureThumbnail(entry: HistoryEntry): Promise<HistoryEntry | null> {
  if (fileExists(thumbFile(entry.id)) || fileExistsUri(entry.thumbUri)) return null;

  const source = livePhotoUri(entry);
  if (!source) return null;

  const thumb = thumbFile(entry.id);
  await writeResized(source, thumb, THUMB_WIDTH, 0.7);

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
    JSON.stringify(history.filter((e) => e.id !== id).map(persistable))
  );

  // Canonical files in this container — not the stale UUID paths in storage.
  const photo = photoFile(id);
  const thumb = thumbFile(id);
  tryDelete(photo);
  tryDelete(thumb);
  if (entry.photoUri && entry.photoUri !== photo.uri) {
    try {
      tryDelete(new File(entry.photoUri));
    } catch {
      // Stored URI wasn't a path we can open.
    }
  }
  if (entry.thumbUri && entry.thumbUri !== thumb.uri) {
    try {
      tryDelete(new File(entry.thumbUri));
    } catch {
      // Stored URI wasn't a path we can open.
    }
  }
}
