import type { ConservationStatus } from '../types';

/**
 * Form-based severity for ConservationBadge.
 * Volume One is monochrome — severity reads as fill density, not hue.
 * - outline: Least Concern → Vulnerable
 * - filled: Endangered and above
 * - muted-outline: Data Deficient ("we don't know" ≠ "it's fine")
 */
export type ConservationForm = 'outline' | 'filled' | 'muted-outline';

export const ConservationForms: Record<ConservationStatus, ConservationForm> = {
  'Least Concern': 'outline',
  'Near Threatened': 'outline',
  Vulnerable: 'outline',
  Endangered: 'filled',
  'Critically Endangered': 'filled',
  'Extinct in the Wild': 'filled',
  'Data Deficient': 'muted-outline',
};

/** @deprecated Prefer ConservationForms — kept for any leftover imports. */
export const ConservationColors: Record<ConservationStatus, string> = {
  'Least Concern': '#000000',
  'Near Threatened': '#000000',
  Vulnerable: '#000000',
  Endangered: '#000000',
  'Critically Endangered': '#000000',
  'Extinct in the Wild': '#000000',
  'Data Deficient': '#666666',
};

export {
  Colors,
  InvertedColors,
} from './tokens';
