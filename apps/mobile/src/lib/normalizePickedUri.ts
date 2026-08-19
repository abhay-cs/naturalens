import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * Copy a PHPicker / Android Photo Picker URI into cache as JPEG.
 *
 * The system picker can hand back a `content://` URI or a PHPicker token that does not
 * survive a long-lived identify. Re-encoding into our cache is the file we freeze and
 * send to Gemini — not the raw picker handle.
 */
export async function normalizePickedUri(uri: string): Promise<string> {
  const rendered = await ImageManipulator.manipulate(uri).renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 1 });
  return saved.uri;
}
