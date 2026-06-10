import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LudoboxDB } from '@/db/db';
import { createGameRepository } from '@/db/gameRepository';
import { createParticipationRepository } from '@/db/participationRepository';
import { createPlayerRepository } from '@/db/playerRepository';
import { createPlayRepository } from '@/db/playRepository';
import type { Player } from '@/domain/types';
import {
  formatHistoryDate,
  loadPlayers,
  loadPlayerSheet,
  sortPlayersByName,
} from './playersData';

const player = (over: Partial<Player> = {}): Player => ({
  id: crypto.randomUUID(),
  name: 'Alice',
  status: 'active',
  ...over,
});

describe('sortPlayersByName', () => {
  it('sorts alphabetically, ignoring case and accents (French locale)', () => {
    const sorted = sortPlayersByName([
      player({ name: 'Zoé' }),
      player({ name: 'élise' }),
      player({ name: 'Adam' }),
      player({ name: 'amélie' }),
    ]);
    expect(sorted.map((p) => p.name)).toEqual([
      'Adam',
      'amélie',
      'élise',
      'Zoé',
    ]);
  });

  it('does not mutate its input', () => {
    const input = [player({ name: 'B' }), player({ name: 'A' })];
    sortPlayersByName(input);
    expect(input.map((p) => p.name)).toEqual(['B', 'A']);
  });
});

describe('formatHistoryDate', () => {
  it('splits a date into day number and short uppercase French month', () => {
    expect(formatHistoryDate(new Date(2026, 4, 7))).toEqual({
      day: 7,
      month: 'MAI',
    });
  });
});

describe('player loaders', () => {
  let db: LudoboxDB;
  let games: ReturnType<typeof createGameRepository>;
  let players: ReturnType<typeof createPlayerRepository>;
  let plays: ReturnType<typeof createPlayRepository>;
  let participations: ReturnType<typeof createParticipationRepository>;

  beforeEach(() => {
    db = new LudoboxDB(`test-${crypto.randomUUID()}`);
    games = createGameRepository(db);
    players = createPlayerRepository(db);
    plays = createPlayRepository(db);
    participations = createParticipationRepository(db);
  });

  afterEach(async () => {
    await db.delete();
  });

  describe('loadPlayers', () => {
    it('returns active players sorted, each with a read-time play count', async () => {
      const catan = await games.create({ name: 'Catan', type: 'competitive' });
      const alice = await players.create({ name: 'Alice' });
      const bob = await players.create({ name: 'Bob' });
      await plays.create({
        gameId: catan.id,
        participations: [{ playerId: alice.id, isWinner: true, score: 10 }],
      });

      const entries = await loadPlayers({ players, participations });

      expect(entries.map((e) => e.player.name)).toEqual(['Alice', 'Bob']);
      expect(entries.find((e) => e.player.id === alice.id)?.playCount).toBe(1);
      expect(entries.find((e) => e.player.id === bob.id)?.playCount).toBe(0);
    });

    it('omits archived players', async () => {
      const ghost = await players.create({ name: 'Ghost' });
      await players.archive(ghost.id);
      expect(await loadPlayers({ players, participations })).toEqual([]);
    });
  });

  describe('loadPlayerSheet', () => {
    it('returns the player counters and newest-first cross-game history', async () => {
      const catan = await games.create({ name: 'Catan', type: 'competitive' });
      const pandemic = await games.create({
        name: 'Pandemic',
        type: 'cooperative',
      });
      const alice = await players.create({ name: 'Alice' });
      await plays.create({
        gameId: catan.id,
        playedAt: new Date('2026-03-01'),
        participations: [{ playerId: alice.id, isWinner: true, score: 30 }],
      });
      await plays.create({
        gameId: pandemic.id,
        playedAt: new Date('2026-03-05'),
        coopResult: 'failure',
        participations: [{ playerId: alice.id }],
      });

      const sheet = await loadPlayerSheet(alice.id, {
        players,
        participations,
        plays,
        games,
      });

      expect(sheet?.stats).toEqual({ playCount: 2, winCount: 1 });
      expect(sheet?.history.map((e) => e.gameName)).toEqual([
        'Pandemic',
        'Catan',
      ]);
    });

    it('returns null for a missing or archived player (reachability guard)', async () => {
      const ghost = await players.create({ name: 'Ghost' });
      await players.archive(ghost.id);

      const deps = { players, participations, plays, games };
      expect(await loadPlayerSheet(ghost.id, deps)).toBeNull();
      expect(await loadPlayerSheet('nope', deps)).toBeNull();
    });
  });
});
