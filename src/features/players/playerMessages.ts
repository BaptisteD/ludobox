/**
 * French copy for the player-form validation codes (creation and inline rename).
 * The rules live in the domain (`validation.ts`); this is pure presentation —
 * mapping a domain {@link ValidationErrorCode} to a user-facing message.
 */
import type { ValidationErrorCode } from '@/domain/validation';

const MESSAGES: Partial<Record<ValidationErrorCode, string>> = {
  EMPTY_PLAYER_NAME: 'Un nom est requis.',
  DUPLICATE_PLAYER_NAME: 'Ce nom est déjà utilisé.',
};

export function playerErrorMessage(code: ValidationErrorCode): string {
  return MESSAGES[code] ?? 'Saisie invalide.';
}
