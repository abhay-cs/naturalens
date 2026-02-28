import type { Sighting } from '../types';
import { SPECIES } from './collectionSpecies';

export const RECENT_SIGHTINGS: Sighting[] = [
  {
    id: 'sight-1',
    speciesId: 'sp-7',
    imageUrl: SPECIES.find((s) => s.id === 'sp-7')!.imageUrl,
    label: 'Waterbuck Deer',
    region: 'Saharan Africa',
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    id: 'sight-2',
    speciesId: 'sp-8',
    imageUrl: SPECIES.find((s) => s.id === 'sp-8')!.imageUrl,
    label: 'Giraffe',
    region: 'East Africa',
    timestamp: Date.now() - 86400000,
  },
  {
    id: 'sight-3',
    speciesId: 'sp-1',
    imageUrl: SPECIES.find((s) => s.id === 'sp-1')!.imageUrl,
    label: 'Red Fox',
    region: 'North America',
    timestamp: Date.now() - 86400000 * 1,
  },
  {
    id: 'sight-4',
    speciesId: 'sp-2',
    imageUrl: SPECIES.find((s) => s.id === 'sp-2')!.imageUrl,
    label: 'Mountain Bluebird',
    region: 'Western North America',
    timestamp: Date.now() - 86400000 * 2,
  },
  {
    id: 'sight-5',
    speciesId: 'sp-3',
    imageUrl: SPECIES.find((s) => s.id === 'sp-3')!.imageUrl,
    label: 'Monarch Butterfly',
    region: 'Americas',
    timestamp: Date.now() - 86400000 * 3,
  },
  {
    id: 'sight-6',
    speciesId: 'sp-6',
    imageUrl: SPECIES.find((s) => s.id === 'sp-6')!.imageUrl,
    label: 'American Pika',
    region: 'Western North America',
    timestamp: Date.now() - 86400000 * 4,
  },
];
