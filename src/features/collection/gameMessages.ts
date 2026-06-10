/**
 * French copy for the game-form validation codes. The rules themselves live in
 * the domain (`validation.ts`); this is pure presentation — mapping a domain
 * {@link ValidationErrorCode} to a user-facing message, never re-deciding it.
 */
import type { ValidationErrorCode } from '@/domain/validation';

const MESSAGES: Partial<Record<ValidationErrorCode, string>> = {
  EMPTY_GAME_NAME: 'Un nom est requis.',
  MISSING_GAME_TYPE: 'Choisis un type.',
  DUPLICATE_GAME_NAME: 'Ce nom est déjà utilisé.',
  INVALID_PLAYER_COUNT: 'Le nombre de joueurs doit être un entier positif.',
  MIN_GREATER_THAN_MAX: 'Le minimum ne peut pas dépasser le maximum.',
  INVALID_DURATION: 'La durée doit être un nombre de minutes positif.',
  GAME_TYPE_LOCKED: 'Le type est verrouillé : une partie existe déjà.',
};

export function gameErrorMessage(code: ValidationErrorCode): string {
  return MESSAGES[code] ?? 'Saisie invalide.';
}
