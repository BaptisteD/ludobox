/**
 * French copy for the validation codes that can surface from saving a play.
 * The rules live in the domain (`validation.ts`); this is pure presentation —
 * mapping a domain {@link ValidationErrorCode} to a user-facing message.
 */
import type { ValidationErrorCode } from '@/domain/validation';

const MESSAGES: Partial<Record<ValidationErrorCode, string>> = {
  DUPLICATE_PLAYER_NAME: 'Un joueur actif porte déjà ce nom.',
  EMPTY_PLAYER_NAME: 'Donne un nom au joueur.',
  NO_WINNER: 'Désigne le gagnant pour enregistrer la partie.',
  NO_PARTICIPANTS: 'Ajoute au moins un joueur.',
};

export function playFormErrorMessage(code: ValidationErrorCode): string {
  return MESSAGES[code] ?? 'Impossible d’enregistrer la partie.';
}
