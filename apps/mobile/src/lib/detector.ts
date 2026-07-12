import { loadTensorflowModel, type TensorflowModel } from 'react-native-fast-tflite';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { decode as decodeJpeg } from 'jpeg-js';
import type { Detection } from '../types';
import LABELS from '../../assets/model/labels.json';

/**
 * EfficientNet-Lite0, an ImageNet-1k classifier, running on-device via TFLite.
 * ImageNet covers a lot of wildlife (bear species, foxes, wolves, otter, skunk,
 * badger, many birds and reptiles), which is why it beats a generic label set here.
 */
const INPUT_SIZE = 224;

// Read from the model's own TFLite metadata (NormalizationOptions), not guessed.
const MEAN = 127;
const STD = 128;

const TOP_K = 3;

let modelPromise: Promise<TensorflowModel> | null = null;

/** Loads the model once; every later capture reuses it. */
function loadModel(): Promise<TensorflowModel> {
  if (!modelPromise) {
    // Empty delegate list = default CPU delegate.
    modelPromise = loadTensorflowModel(
      require('../../assets/model/efficientnet_lite0.tflite'),
      []
    );
  }
  return modelPromise;
}

/**
 * Builds the model's input tensor from decoded pixels.
 *
 * jpeg-js gives us RGBA at whatever size the JPEG happens to be, so we drop the
 * alpha channel and nearest-neighbour resample to INPUT_SIZE as we normalize —
 * that way we don't depend on the resize upstream landing on exact dimensions.
 */
function toInputTensor(
  rgba: Uint8Array,
  width: number,
  height: number
): Float32Array<ArrayBuffer> {
  const input = new Float32Array(INPUT_SIZE * INPUT_SIZE * 3);

  for (let y = 0; y < INPUT_SIZE; y++) {
    const srcY = Math.min(height - 1, Math.floor((y * height) / INPUT_SIZE));

    for (let x = 0; x < INPUT_SIZE; x++) {
      const srcX = Math.min(width - 1, Math.floor((x * width) / INPUT_SIZE));
      const src = (srcY * width + srcX) * 4;
      const dst = (y * INPUT_SIZE + x) * 3;

      input[dst] = (rgba[src] - MEAN) / STD;
      input[dst + 1] = (rgba[src + 1] - MEAN) / STD;
      input[dst + 2] = (rgba[src + 2] - MEAN) / STD;
    }
  }

  return input;
}

/**
 * The output head may or may not already have softmax applied. Probabilities sum
 * to ~1, raw logits don't — so only apply softmax when it's actually needed.
 * The winning label is the same either way, but the confidence we show is not.
 */
function toProbabilities(raw: Float32Array): Float32Array {
  let sum = 0;
  for (let i = 0; i < raw.length; i++) sum += raw[i];
  if (Math.abs(sum - 1) < 0.01) return raw;

  let max = -Infinity;
  for (let i = 0; i < raw.length; i++) max = Math.max(max, raw[i]);

  const out = new Float32Array(raw.length);
  let expSum = 0;
  for (let i = 0; i < raw.length; i++) {
    out[i] = Math.exp(raw[i] - max);
    expSum += out[i];
  }
  for (let i = 0; i < raw.length; i++) out[i] /= expSum;

  return out;
}

/** Classifies a captured photo, returning the best guesses, most confident first. */
export async function detectInImage(photoUri: string): Promise<Detection[]> {
  const model = await loadModel();

  const rendered = await ImageManipulator.manipulate(photoUri)
    .resize({ width: INPUT_SIZE, height: INPUT_SIZE })
    .renderAsync();
  const resized = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 1 });

  const jpeg = decodeJpeg(await new File(resized.uri).bytes(), { useTArray: true });
  const input = toInputTensor(jpeg.data, jpeg.width, jpeg.height);

  const outputs = await model.run([input.buffer]);
  const scores = toProbabilities(new Float32Array(outputs[0]));

  return Array.from(scores)
    .map((score, i) => ({ label: LABELS[i] ?? `class ${i}`, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);
}
