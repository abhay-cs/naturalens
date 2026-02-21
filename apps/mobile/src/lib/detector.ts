import type { Detection } from '../types';

/**
 * Mock detector for UI development. MediaPipe web package does not run in React Native.
 * Replace with react-native-mediapipe or TFLite when available.
 */
export type InitOptions = { scoreThreshold: number };

export async function detectInImage(
  _imageSource: unknown,
  options: InitOptions
): Promise<Detection[]> {
  await new Promise((r) => setTimeout(r, 300));
  const mockDetections: Detection[] = [
    {
      label: 'Bear',
      score: Math.max(options.scoreThreshold, 0.85),
      bbox: { x: 0.2, y: 0.25, w: 0.4, h: 0.5 },
    },
  ];
  return mockDetections;
}
