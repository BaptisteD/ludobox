import { describe, expect, it } from 'vitest';
import type { Game, Participation, Player } from './types';
import {
  assertValid,
  checkGameNameAvailable,
  checkGameTypeChange,
  checkPlayerNameAvailable,
  DomainError,
  validatePlay,
} from './validation';

const game = (over: Partial<Game> = {}): Game => ({
  id: crypto.randomUUID(),
  name: 'Catan',
  type: 'competitive',
  ...over,
});

const player = (over: Partial<Player> = {}): Player => ({
  id: crypto.randomUUID(),
  name: 'Alice',
  status: 'active',
  ...over,
});

const part = (over: Partial<Participation> = {}): Participation => ({
  id: crypto.randomUUID(),
  playId: 'p',
  playerId: crypto.randomUUID(),
  score: null,
  isWinner: false,
  ...over,
});

describe('checkGameNameAvailable', () => {
  it('accepts a name not present in the collection', () => {
    expect(checkGameNameAvailable('Catan', []).ok).toBe(true);
  });

  it('rejects a duplicate name ignoring case and accents ("Café" vs "cafe")', () => {
    const result = checkGameNameAvailable('cafe', [game({ name: 'Café' })]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('DUPLICATE_GAME_NAME');
  });

  it('ignores the game being edited via excludeId', () => {
    const existing = game({ name: 'Catan' });
    expect(
      checkGameNameAvailable('Catan', [existing], { excludeId: existing.id })
        .ok,
    ).toBe(true);
  });
});

describe('checkPlayerNameAvailable', () => {
  it('rejects a name matching an active player (case/accent-insensitive)', () => {
    const result = checkPlayerNameAvailable('alice', [
      player({ name: 'Alice' }),
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('DUPLICATE_PLAYER_NAME');
  });

  it('accepts a name matching only an archived player (homonym allowed)', () => {
    const result = checkPlayerNameAvailable('Alice', [
      player({ name: 'Alice', status: 'archived' }),
    ]);
    expect(result.ok).toBe(true);
  });

  it('ignores the player being renamed via excludeId', () => {
    const existing = player({ name: 'Alice' });
    expect(
      checkPlayerNameAvailable('Alice', [existing], { excludeId: existing.id })
        .ok,
    ).toBe(true);
  });
});

describe('checkGameTypeChange', () => {
  it('allows changing type while no play exists', () => {
    expect(checkGameTypeChange('competitive', 'cooperative', false).ok).toBe(
      true,
    );
  });

  it('allows a no-op (same type) even after plays exist', () => {
    expect(checkGameTypeChange('competitive', 'competitive', true).ok).toBe(
      true,
    );
  });

  it('locks the type once at least one play exists', () => {
    const result = checkGameTypeChange('competitive', 'cooperative', true);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('GAME_TYPE_LOCKED');
  });
});

describe('validatePlay — competitive', () => {
  it('rejects a play with no participants', () => {
    const result = validatePlay({
      gameType: 'competitive',
      participations: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('NO_PARTICIPANTS');
  });

  it('rejects a play with no winner', () => {
    const result = validatePlay({
      gameType: 'competitive',
      participations: [part({ isWinner: false }), part({ isWinner: false })],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('NO_WINNER');
  });

  it('accepts ex-aequo (two winners)', () => {
    const result = validatePlay({
      gameType: 'competitive',
      participations: [part({ isWinner: true }), part({ isWinner: true })],
    });
    expect(result.ok).toBe(true);
  });

  it('accepts a solo play where the lone participant is the winner', () => {
    const result = validatePlay({
      gameType: 'competitive',
      participations: [part({ isWinner: true })],
    });
    expect(result.ok).toBe(true);
  });

  it('accepts a null score (not entered) and a negative score', () => {
    const result = validatePlay({
      gameType: 'competitive',
      participations: [
        part({ isWinner: true, score: -5 }),
        part({ isWinner: false, score: null }),
      ],
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a non-integer score', () => {
    const result = validatePlay({
      gameType: 'competitive',
      participations: [part({ isWinner: true, score: 3.5 })],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('INVALID_SCORE');
  });

  it('rejects a coopResult on a competitive play', () => {
    const result = validatePlay({
      gameType: 'competitive',
      coopResult: 'success',
      participations: [part({ isWinner: true })],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('COOP_RESULT_ON_COMPETITIVE');
  });
});

describe('validatePlay — cooperative', () => {
  it('accepts a play with participants and the default (success) result', () => {
    const result = validatePlay({
      gameType: 'cooperative',
      participations: [part(), part()],
    });
    expect(result.ok).toBe(true);
  });

  it('accepts an explicit failure result', () => {
    const result = validatePlay({
      gameType: 'cooperative',
      coopResult: 'failure',
      participations: [part()],
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a play with no participants', () => {
    const result = validatePlay({
      gameType: 'cooperative',
      participations: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('NO_PARTICIPANTS');
  });

  it('rejects a winner on a cooperative play', () => {
    const result = validatePlay({
      gameType: 'cooperative',
      participations: [part({ isWinner: true })],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('WINNER_ON_COOPERATIVE');
  });

  it('rejects a score on a cooperative play', () => {
    const result = validatePlay({
      gameType: 'cooperative',
      participations: [part({ score: 10 })],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('SCORE_ON_COOPERATIVE');
  });
});

describe('assertValid / DomainError', () => {
  it('does nothing for a valid result', () => {
    expect(() => assertValid({ ok: true })).not.toThrow();
  });

  it('throws a DomainError carrying the code for an invalid result', () => {
    try {
      assertValid({ ok: false, code: 'NO_WINNER', message: 'no winner' });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe('NO_WINNER');
    }
  });
});
