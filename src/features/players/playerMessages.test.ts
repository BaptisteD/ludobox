import { describe, expect, it } from 'vitest';
import { playerErrorMessage } from './playerMessages';

describe('playerErrorMessage', () => {
  it('maps the empty-name code', () => {
    expect(playerErrorMessage('EMPTY_PLAYER_NAME')).toBe('Un nom est requis.');
  });

  it('maps the duplicate-name code', () => {
    expect(playerErrorMessage('DUPLICATE_PLAYER_NAME')).toBe(
      'Ce nom est déjà utilisé.',
    );
  });

  it('falls back for an unmapped code', () => {
    expect(playerErrorMessage('NO_WINNER')).toBe('Saisie invalide.');
  });
});
