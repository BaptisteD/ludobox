import { describe, expect, it } from 'vitest';
import { gameErrorMessage } from './gameMessages';

describe('gameErrorMessage', () => {
  it('maps each game-form validation code to French copy', () => {
    expect(gameErrorMessage('EMPTY_GAME_NAME')).toBe('Un nom est requis.');
    expect(gameErrorMessage('MISSING_GAME_TYPE')).toBe('Choisis un type.');
    expect(gameErrorMessage('DUPLICATE_GAME_NAME')).toBe(
      'Ce nom est déjà utilisé.',
    );
    expect(gameErrorMessage('MIN_GREATER_THAN_MAX')).toBe(
      'Le minimum ne peut pas dépasser le maximum.',
    );
    expect(gameErrorMessage('INVALID_DURATION')).toMatch(/durée/i);
  });

  it('falls back to a generic message for unrelated codes', () => {
    expect(gameErrorMessage('NO_WINNER')).toBe('Saisie invalide.');
  });
});
