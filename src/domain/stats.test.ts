import { describe, expect, it } from 'vitest';
import {
  competitiveGameStats,
  cooperativeGameStats,
  playerStats,
  sortPlaysForHistory,
} from './stats';
import type { Game, Participation, Play, Player } from './types';

// --- Fixtures -------------------------------------------------------------
// A competitive game with three plays and a small cast, including one archived
// player who must still count everywhere.

const alice: Player = { id: 'alice', name: 'Alice', status: 'active' };
const bob: Player = { id: 'bob', name: 'Bob', status: 'active' };
const carol: Player = { id: 'carol', name: 'Carol', status: 'archived' };
const players = [alice, bob, carol];

const catan: Game = { id: 'catan', name: 'Catan', type: 'competitive' };
const pandemic: Game = {
  id: 'pandemic',
  name: 'Pandemic',
  type: 'cooperative',
};

const play = (over: Partial<Play>): Play => ({
  id: crypto.randomUUID(),
  gameId: catan.id,
  playedAt: new Date('2026-01-01'),
  createdAt: new Date('2026-01-01T00:00:00Z'),
  ...over,
});

const part = (over: Partial<Participation>): Participation => ({
  id: crypto.randomUUID(),
  playId: 'play',
  playerId: alice.id,
  score: null,
  isWinner: false,
  ...over,
});

describe('competitiveGameStats', () => {
  // Carol (archived) holds the high score; Alice wins most.
  const p1 = play({ id: 'p1', gameId: catan.id });
  const p2 = play({ id: 'p2', gameId: catan.id });
  const p3 = play({ id: 'p3', gameId: catan.id });
  const plays = [p1, p2, p3];
  const participations = [
    part({ playId: 'p1', playerId: alice.id, score: 7, isWinner: true }),
    part({ playId: 'p1', playerId: bob.id, score: 5 }),
    part({ playId: 'p2', playerId: alice.id, score: 8, isWinner: true }),
    part({ playId: 'p2', playerId: carol.id, score: 12, isWinner: false }),
    part({ playId: 'p3', playerId: bob.id, score: 6, isWinner: true }),
    part({ playId: 'p3', playerId: carol.id, score: 4 }),
  ];

  it('counts the plays', () => {
    expect(
      competitiveGameStats(catan, plays, participations, players).playCount,
    ).toBe(3);
  });

  it('reports the record: high score value and its holder (even archived)', () => {
    const { record } = competitiveGameStats(
      catan,
      plays,
      participations,
      players,
    );
    expect(record).toEqual({ score: 12, holderName: 'Carol' });
  });

  it('ranks players by win count, descending', () => {
    const { ranking } = competitiveGameStats(
      catan,
      plays,
      participations,
      players,
    );
    expect(ranking.map((r) => [r.playerName, r.wins])).toEqual([
      ['Alice', 2],
      ['Bob', 1],
      ['Carol', 0],
    ]);
  });

  it('ignores null scores for the record (returns null when none entered)', () => {
    const noScores = [
      part({ playId: 'p1', playerId: alice.id, isWinner: true, score: null }),
    ];
    expect(
      competitiveGameStats(catan, [p1], noScores, players).record,
    ).toBeNull();
  });
});

describe('cooperativeGameStats', () => {
  const plays = [
    play({ id: 'c1', gameId: pandemic.id, coopResult: 'success' }),
    play({ id: 'c2', gameId: pandemic.id, coopResult: 'failure' }),
    play({ id: 'c3', gameId: pandemic.id, coopResult: 'success' }),
    play({ id: 'c4', gameId: pandemic.id, coopResult: undefined }), // defaults to success
  ];

  it('counts successes, failures and the success rate', () => {
    const stats = cooperativeGameStats(pandemic, plays);
    expect(stats.playCount).toBe(4);
    expect(stats.successCount).toBe(3);
    expect(stats.failureCount).toBe(1);
    expect(stats.successRate).toBe(0.75);
  });

  it('returns a zero success rate when there are no plays', () => {
    expect(cooperativeGameStats(pandemic, []).successRate).toBe(0);
  });
});

describe('playerStats', () => {
  // Alice wins a competitive play and is in a successful coop play.
  const cp = play({ id: 'cp', gameId: catan.id });
  const coop = play({ id: 'coop', gameId: pandemic.id, coopResult: 'success' });
  const plays = [cp, coop];
  const games = [catan, pandemic];
  const participations = [
    part({ playId: 'cp', playerId: alice.id, isWinner: true, score: 10 }),
    part({ playId: 'coop', playerId: alice.id, isWinner: false }),
  ];

  it('counts plays the player took part in', () => {
    expect(playerStats(alice, plays, participations, games).playCount).toBe(2);
  });

  it('counts wins only from competitive games (coop successes excluded)', () => {
    expect(playerStats(alice, plays, participations, games).winCount).toBe(1);
  });
});

describe('sortPlaysForHistory', () => {
  it('sorts by playedAt desc, then createdAt desc as a deterministic tie-break', () => {
    const older = play({
      id: 'older',
      playedAt: new Date('2026-01-01'),
      createdAt: new Date('2026-01-01T08:00:00Z'),
    });
    const sameDayEarlyEntry = play({
      id: 'early',
      playedAt: new Date('2026-02-01'),
      createdAt: new Date('2026-02-01T08:00:00Z'),
    });
    const sameDayLateEntry = play({
      id: 'late',
      playedAt: new Date('2026-02-01'),
      createdAt: new Date('2026-02-01T20:00:00Z'),
    });

    const sorted = sortPlaysForHistory([
      sameDayEarlyEntry,
      older,
      sameDayLateEntry,
    ]);
    expect(sorted.map((p) => p.id)).toEqual(['late', 'early', 'older']);
  });

  it('does not mutate the input array', () => {
    const input = [play({ id: 'a' }), play({ id: 'b' })];
    const copy = [...input];
    sortPlaysForHistory(input);
    expect(input).toEqual(copy);
  });
});
