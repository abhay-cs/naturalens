import type { Capture } from '../types';

export const DUMMY_CAPTURES: Capture[] = [
  {
    id: 'cap-1',
    lat: 40.7128,
    lng: -74.006,
    source: 'camera',
    timestamp: Date.now() - 86400000 * 2,
    detections: [
      { label: 'Bear', score: 0.92, bbox: { x: 0.2, y: 0.3, w: 0.4, h: 0.5 } },
    ],
  },
  {
    id: 'cap-2',
    lat: 43.6532,
    lng: -79.3832,
    source: 'image',
    timestamp: Date.now() - 86400000,
    detections: [
      { label: 'Bear', score: 0.88, bbox: { x: 0.1, y: 0.2, w: 0.35, h: 0.45 } },
      { label: 'Bear', score: 0.75, bbox: { x: 0.55, y: 0.4, w: 0.3, h: 0.4 } },
    ],
  },
  {
    id: 'cap-3',
    lat: 51.5074,
    lng: -0.1278,
    source: 'video',
    timestamp: Date.now() - 3600000,
    detections: [
      { label: 'Bear', score: 0.85, bbox: { x: 0.3, y: 0.25, w: 0.4, h: 0.5 } },
    ],
  },
  {
    id: 'cap-4',
    lat: 47.6062,
    lng: -122.3321,
    source: 'camera',
    timestamp: Date.now() - 7200000,
    detections: [
      { label: 'Bear', score: 0.91, bbox: { x: 0.15, y: 0.35, w: 0.45, h: 0.48 } },
    ],
  },
  {
    id: 'cap-5',
    lat: 45.5017,
    lng: -73.5673,
    source: 'image',
    timestamp: Date.now() - 43200000,
    detections: [
      { label: 'Bear', score: 0.78, bbox: { x: 0.4, y: 0.2, w: 0.35, h: 0.55 } },
    ],
  },
];
