import type { ConservationStatus } from '../types';

export const Colors = {
  primary: '#135c3e', // Forest green — the action colour: buttons, active tab
  brand: '#1a3c40', // Deep teal — the identity colour: camera surface, badges
  background: '#ffffff',
  surface: '#f5f5f5',
  cardBackground: '#f1ede4', // light tan — cards only
  splashBackground: '#FAFAF8', // matches native splash + frosted icon tile
  textPrimary: '#000000',
  textSecondary: '#666666',
  white: '#ffffff',
  border: '#e0e0e0',
  error: '#dc2626',
};

/**
 * IUCN status, safe to alarming. Data Deficient is grey rather than green — "we don't know"
 * is not the same as "it's fine", and colouring it like the latter would be a lie.
 */
export const ConservationColors: Record<ConservationStatus, string> = {
  'Least Concern': '#15803d',
  'Near Threatened': '#65a30d',
  Vulnerable: '#ca8a04',
  Endangered: '#ea580c',
  'Critically Endangered': '#dc2626',
  'Extinct in the Wild': '#450a0a',
  'Data Deficient': '#6b7280',
};
