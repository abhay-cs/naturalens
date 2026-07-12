import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { Detection } from '../types';

/**
 * Species identification via the Gemini API.
 *
 * Cloud rather than on-device: Expo Go can only load the native modules it ships
 * with, so an on-device TFLite runtime would mean giving up the Expo Go workflow.
 */
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const MODEL = 'gemini-3.5-flash';

/** Plenty of detail for identification, and keeps the upload small. */
const MAX_WIDTH = 1024;

const PROMPT =
  'Identify the animal in this photo. Give the most specific species name you can ' +
  'reasonably support (for example "red fox" rather than "fox", "brown bear" rather ' +
  'than "bear"), in plain English rather than Latin. Set confidence to how sure you ' +
  'are, from 0 to 1. If there is no animal in the photo, set isAnimal to false.';

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    isAnimal: { type: 'boolean' },
    label: { type: 'string' },
    confidence: { type: 'number' },
  },
  required: ['isAnimal', 'label', 'confidence'],
};

interface GeminiResult {
  isAnimal: boolean;
  label: string;
  confidence: number;
}

/** Shrinks the capture and returns it base64-encoded for an inline upload. */
async function toBase64Jpeg(photoUri: string): Promise<string> {
  const rendered = await ImageManipulator.manipulate(photoUri)
    .resize({ width: MAX_WIDTH })
    .renderAsync();

  const { base64 } = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.8,
    base64: true,
  });

  if (!base64) throw new Error('Could not encode the photo.');
  return base64;
}

/** The generated text sits on the model_output step. */
function extractText(body: any): string {
  const step = body?.steps?.find((s: any) => s.type === 'model_output');
  const text = step?.content?.find((c: any) => c.type === 'text')?.text;

  if (typeof text !== 'string') {
    throw new Error('Unexpected response from Gemini.');
  }
  return text;
}

/** Classifies a captured photo. Returns an empty list when there's no animal in frame. */
export async function detectInImage(photoUri: string): Promise<Detection[]> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing EXPO_PUBLIC_GEMINI_API_KEY. Add it to apps/mobile/.env and restart the dev server.'
    );
  }

  const image = await toBase64Jpeg(photoUri);

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        { type: 'text', text: PROMPT },
        { type: 'image', data: image, mime_type: 'image/jpeg' },
      ],
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Gemini request failed (${response.status}). ${detail.slice(0, 120)}`);
  }

  let result: GeminiResult;
  try {
    result = JSON.parse(extractText(await response.json()));
  } catch {
    throw new Error('Could not read the identification. Try again.');
  }

  if (!result.isAnimal || !result.label) return [];

  return [
    {
      label: result.label,
      // Clamp: the model reports its own confidence, so don't trust the range blindly.
      score: Math.min(1, Math.max(0, result.confidence ?? 0)),
    },
  ];
}
