import { describe, expect, it } from 'vitest';
import { playFormErrorMessage } from './playFormMessages';

describe('playFormErrorMessage', () => {
  it('maps the duplicate-player code to French', () => {
    expect(playFormErrorMessage('DUPLICATE_PLAYER_NAME')).toBe(
      'Un joueur actif porte déjà ce nom.',
    );
  });

  it('maps the no-winner and no-participant codes', () => {
    expect(playFormErrorMessage('NO_WINNER')).toBe(
      'Désigne le gagnant pour enregistrer la partie.',
    );
    expect(playFormErrorMessage('NO_PARTICIPANTS')).toBe(
      'Ajoute au moins un joueur.',
    );
  });

  it('falls back to a generic message for unexpected codes', () => {
    expect(playFormErrorMessage('INVALID_SCORE')).toBe(
      'Impossible d’enregistrer la partie.',
    );
  });
});
