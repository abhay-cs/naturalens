/** Single detection from MediaPipe ObjectDetector */
export interface Detection {
  label: string;
  score: number;
  /** Bounding box: x, y, width, height in normalized 0-1 or pixel coords */
  bbox: { x: number; y: number; w: number; h: number };
}

/** Results for a single frame (image or camera capture) */
export interface FrameResults {
  detections: Detection[];
  /** For video: timestamp in seconds */
  timestamp?: number;
  /** For video: frame index */
  frameIndex?: number;
}

/** All results for a video, keyed by frame index */
export interface VideoResults {
  frames: FrameResults[];
  /** Thumbnail data URLs for gallery */
  thumbnails: string[];
}

/** A capture with location (for map view) */
export interface Capture {
  id: string;
  lat: number;
  lng: number;
  detections: Detection[];
  timestamp: number;
  source: 'camera' | 'image' | 'video';
}
