import { describe, expect, it } from 'vitest';
import {
  competitiveGameStats,
  cooperativeGameStats,
  gameHistory,
  playerHistory,
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

describe('playerHistory', () => {
  const games = [catan, pandemic];
  const comp = play({
    id: 'comp',
    gameId: catan.id,
    playedAt: new Date('2026-03-10'),
    createdAt: new Date('2026-03-10T10:00:00Z'),
  });
  const coopOk = play({
    id: 'coopOk',
    gameId: pandemic.id,
    coopResult: 'success',
    playedAt: new Date('2026-03-12'),
    createdAt: new Date('2026-03-12T10:00:00Z'),
  });
  const compNoScore = play({
    id: 'noscore',
    gameId: catan.id,
    playedAt: new Date('2026-03-08'),
    createdAt: new Date('2026-03-08T10:00:00Z'),
  });
  const plays = [comp, coopOk, compNoScore];
  const participations = [
    part({ playId: 'comp', playerId: alice.id, isWinner: true, score: 42 }),
    part({ playId: 'coopOk', playerId: alice.id }),
    part({
      playId: 'noscore',
      playerId: alice.id,
      isWinner: false,
      score: null,
    }),
    // Bob's participation must never leak into Alice's history.
    part({ playId: 'comp', playerId: bob.id, isWinner: false, score: 5 }),
  ];

  it('returns only the player’s own plays, newest first', () => {
    const history = playerHistory(alice, plays, participations, games);
    expect(history.map((e) => e.playId)).toEqual(['coopOk', 'comp', 'noscore']);
  });

  it('carries the competitive score and win flag', () => {
    const [, comp] = playerHistory(alice, plays, participations, games);
    expect(comp).toMatchObject({
      gameName: 'Catan',
      gameType: 'competitive',
      isWinner: true,
      score: 42,
    });
  });

  it('keeps null score for an unentered competitive participation', () => {
    const entry = playerHistory(alice, plays, participations, games).find(
      (e) => e.playId === 'noscore',
    );
    expect(entry?.score).toBeNull();
  });

  it('resolves coop result (defaulting absent to success) and never a winner', () => {
    const [coop] = playerHistory(alice, plays, participations, games);
    expect(coop).toMatchObject({
      gameType: 'cooperative',
      coopResult: 'success',
      isWinner: false,
      score: null,
    });
  });

  it('is empty for a player with no participations', () => {
    expect(playerHistory(bob, [coopOk], participations, games)).toEqual([]);
  });
});

describe('gameHistory', () => {
  // Two plays of Catan (competitive) plus a Pandemic play that must never leak.
  const g1 = play({
    id: 'g1',
    gameId: catan.id,
    note: 'belle partie',
    playedAt: new Date('2026-04-10'),
    createdAt: new Date('2026-04-10T10:00:00Z'),
  });
  const g2 = play({
    id: 'g2',
    gameId: catan.id,
    playedAt: new Date('2026-04-12'),
    createdAt: new Date('2026-04-12T10:00:00Z'),
  });
  const other = play({ id: 'other', gameId: pandemic.id });
  const coop = play({
    id: 'coop',
    gameId: pandemic.id,
    coopResult: 'failure',
    playedAt: new Date('2026-04-11'),
    createdAt: new Date('2026-04-11T10:00:00Z'),
  });
  const plays = [g1, g2, other, coop];
  const participations = [
    // g1: alice & carol both win (ex-aequo), bob loses; carol is archived.
    part({ playId: 'g1', playerId: alice.id, isWinner: true, score: 8 }),
    part({ playId: 'g1', playerId: carol.id, isWinner: true, score: 8 }),
    part({ playId: 'g1', playerId: bob.id, isWinner: false, score: 5 }),
    // g2: bob wins, alice has no score entered.
    part({ playId: 'g2', playerId: bob.id, isWinner: true, score: null }),
    part({ playId: 'g2', playerId: alice.id, isWinner: false, score: null }),
    // coop participation (no winner / score in coop).
    part({ playId: 'coop', playerId: alice.id }),
  ];

  it('returns only this game’s plays, newest first', () => {
    const history = gameHistory(catan, plays, participations, players);
    expect(history.map((e) => e.playId)).toEqual(['g2', 'g1']);
  });

  it('orders participants winners-first, then by name (case/accent-insensitive)', () => {
    const g1Entry = gameHistory(catan, plays, participations, players).find(
      (e) => e.playId === 'g1',
    );
    expect(g1Entry?.participants.map((p) => p.name)).toEqual([
      'Alice',
      'Carol',
      'Bob',
    ]);
  });

  it('carries per-participant score, win flag and archived flag (archived by name)', () => {
    const g1Entry = gameHistory(catan, plays, participations, players).find(
      (e) => e.playId === 'g1',
    );
    expect(g1Entry?.participants).toEqual([
      { playerId: 'alice', name: 'Alice', score: 8, isWinner: true, isArchived: false },
      { playerId: 'carol', name: 'Carol', score: 8, isWinner: true, isArchived: true },
      { playerId: 'bob', name: 'Bob', score: 5, isWinner: false, isArchived: false },
    ]);
  });

  it('keeps null score for an unentered competitive participation', () => {
    const g2Entry = gameHistory(catan, plays, participations, players).find(
      (e) => e.playId === 'g2',
    );
    expect(g2Entry?.participants.find((p) => p.name === 'Alice')?.score).toBeNull();
  });

  it('flags the presence of a note', () => {
    const history = gameHistory(catan, plays, participations, players);
    expect(history.find((e) => e.playId === 'g1')?.hasNote).toBe(true);
    expect(history.find((e) => e.playId === 'g2')?.hasNote).toBe(false);
  });

  it('resolves the cooperative collective result', () => {
    const [entry] = gameHistory(pandemic, plays, participations, players);
    expect(entry).toMatchObject({ playId: 'coop', coopResult: 'failure' });
  });

  it('is empty for a game with no plays', () => {
    const lonely: Game = { id: 'lonely', name: 'Lonely', type: 'competitive' };
    expect(gameHistory(lonely, plays, participations, players)).toEqual([]);
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
