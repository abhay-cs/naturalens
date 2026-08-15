/**
 * How a conservation status is drawn.
 *
 * Volume One prefers **form over hue** — an IUCN category is a rank, and a seven-colour
 * spectrum reads as decoration rather than information. So the low end is an outline in
 * ink, the severe end fills, and only the two genuinely alarming categories spend a
 * semantic hue. `Data Deficient` is muted because it is an absence, not a rank.
 *
 * See `docs/DESIGN.md` §6 and `packages/design/README.md` — semantic hues are permitted
 * on status pills and nowhere else in the chrome.
 */
import { Colors, SemanticColors } from './tokens';
import type { ConservationStatus } from '../types';

export interface ConservationForm {
  /** `outline` draws a 1px rule in `color`; `filled` fills with it and inverts the text. */
  form: 'outline' | 'filled';
  color: string;
}

export const ConservationForms: Record<ConservationStatus, ConservationForm> = {
  'Least Concern': { form: 'outline', color: Colors.fg },
  'Near Threatened': { form: 'outline', color: Colors.fg },
  Vulnerable: { form: 'outline', color: SemanticColors.warning },
  Endangered: { form: 'filled', color: SemanticColors.warning },
  'Critically Endangered': { form: 'filled', color: SemanticColors.danger },
  'Extinct in the Wild': { form: 'filled', color: Colors.fg },
  'Data Deficient': { form: 'outline', color: Colors.caption },
};
