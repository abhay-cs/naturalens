export type SpeciesCategory = 'mammal' | 'bird' | 'insect' | 'flora' | 'reptile';

export interface CollectionSpecies {
  id: string;
  label: string;
  category: SpeciesCategory;
  imageUrl: string;
  isFavorite: boolean;
  capturedAt: number;
}

export const COLLECTION_SPECIES: CollectionSpecies[] = [
  {
    id: 'sp-1',
    label: 'Red Fox',
    category: 'mammal',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Vulpes_vulpes_laying_in_snow.jpg/440px-Vulpes_vulpes_laying_in_snow.jpg',
    isFavorite: true,
    capturedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'sp-2',
    label: 'Mountain Bluebird',
    category: 'bird',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Mountain_Bluebird.jpg/440px-Mountain_Bluebird.jpg',
    isFavorite: false,
    capturedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'sp-3',
    label: 'Monarch Butterfly',
    category: 'insect',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Monarch_In_May.jpg/440px-Monarch_In_May.jpg',
    isFavorite: false,
    capturedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'sp-4',
    label: 'Sword Fern',
    category: 'flora',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Polystichum_munitum.jpg/440px-Polystichum_munitum.jpg',
    isFavorite: false,
    capturedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'sp-5',
    label: 'Green Turtle',
    category: 'reptile',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Chelonia_mydas_%28Hawaiian_Green_Sea_Turtle%29_on_Papah%C4%81naumoku%C4%81kea.jpg/440px-Chelonia_mydas_%28Hawaiian_Green_Sea_Turtle%29_on_Papah%C4%81naumoku%C4%81kea.jpg',
    isFavorite: false,
    capturedAt: Date.now() - 86400000 * 7,
  },
  {
    id: 'sp-6',
    label: 'American Pika',
    category: 'mammal',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Ochotona_princeps.jpg/440px-Ochotona_princeps.jpg',
    isFavorite: true,
    capturedAt: Date.now() - 86400000 * 10,
  },
];
