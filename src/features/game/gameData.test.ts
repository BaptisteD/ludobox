import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LudoboxDB } from '@/db/db';
import { createGameRepository } from '@/db/gameRepository';
import { createParticipationRepository } from '@/db/participationRepository';
import { createPlayerRepository } from '@/db/playerRepository';
import { createPlayRepository } from '@/db/playRepository';
import type { GameHistoryEntry } from '@/domain/stats';
import { loadGameSheet, toHistoryRow } from './gameData';

const entry = (over: Partial<GameHistoryEntry> = {}): GameHistoryEntry => ({
  playId: 'p',
  playedAt: new Date('2026-05-24'),
  participants: [],
  coopResult: 'success',
  hasNote: false,
  ...over,
});

describe('toHistoryRow', () => {
  it('puts the winner and winning score on the title, others in the meta', () => {
    const row = toHistoryRow(
      entry({
        participants: [
          { playerId: 'c', name: 'Camille', score: 142, isWinner: true, isArchived: false },
          { playerId: 'l', name: 'Léa', score: 118, isWinner: false, isArchived: false },
          { playerId: 't', name: 'Tom', score: 96, isWinner: false, isArchived: false },
        ],
        hasNote: true,
      }),
      'competitive',
    );
    expect(row).toMatchObject({
      title: 'Camille',
      trophy: true,
      score: 142,
      meta: 'Léa 118 · Tom 96 · note',
    });
  });

  it('joins ex-aequo winners and marks an archived participant', () => {
    const row = toHistoryRow(
      entry({
        participants: [
          { playerId: 'c', name: 'Camille', score: 130, isWinner: true, isArchived: false },
          { playerId: 'l', name: 'Léa', score: 130, isWinner: true, isArchived: false },
          { playerId: 's', name: 'Sacha', score: 88, isWinner: false, isArchived: true },
        ],
      }),
      'competitive',
    );
    expect(row.title).toBe('Camille & Léa');
    expect(row.meta).toBe('Sacha 88 · archivé');
  });

  it('shows the unset score state when no winner has a score', () => {
    const row = toHistoryRow(
      entry({
        participants: [
          { playerId: 'b', name: 'Bob', score: null, isWinner: true, isArchived: false },
          { playerId: 'a', name: 'Alice', score: null, isWinner: false, isArchived: false },
        ],
      }),
      'competitive',
    );
    expect(row).toMatchObject({ title: 'Bob', trophy: true, score: 'unset', meta: 'Alice' });
  });

  it('maps a cooperative entry to a result chip and a participant meta', () => {
    const row = toHistoryRow(
      entry({
        coopResult: 'failure',
        participants: [
          { playerId: 'c', name: 'Camille', score: null, isWinner: false, isArchived: false },
          { playerId: 'l', name: 'Léa', score: null, isWinner: false, isArchived: false },
        ],
      }),
      'cooperative',
    );
    expect(row).toMatchObject({ result: 'echec', meta: 'Camille · Léa' });
    expect(row.title).toBeUndefined();
    expect(row.trophy).toBeUndefined();
  });
});

describe('loadGameSheet', () => {
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

  const deps = () => ({ games, players, plays, participations });

  it('loads competitive stats + newest-first history (archived holder kept)', async () => {
    const catan = await games.create({ name: 'Catan', type: 'competitive' });
    const alice = await players.create({ name: 'Alice' });
    const ghost = await players.create({ name: 'Ghost' });
    await plays.create({
      gameId: catan.id,
      playedAt: new Date('2026-03-01'),
      participations: [{ playerId: alice.id, isWinner: true, score: 30 }],
    });
    await plays.create({
      gameId: catan.id,
      playedAt: new Date('2026-03-05'),
      participations: [{ playerId: ghost.id, isWinner: true, score: 99 }],
    });
    await players.archive(ghost.id);

    const sheet = await loadGameSheet(catan.id, deps());

    expect(sheet?.type).toBe('competitive');
    if (sheet?.type !== 'competitive') throw new Error('expected competitive');
    expect(sheet.stats.playCount).toBe(2);
    expect(sheet.stats.record).toEqual({ score: 99, holderName: 'Ghost' });
    expect(sheet.history.map((e) => e.playId).length).toBe(2);
    // Newest first.
    expect(sheet.history[0].participants[0].name).toBe('Ghost');
  });

  it('loads cooperative success-rate stats', async () => {
    const pandemic = await games.create({ name: 'Pandemic', type: 'cooperative' });
    const alice = await players.create({ name: 'Alice' });
    await plays.create({
      gameId: pandemic.id,
      coopResult: 'success',
      participations: [{ playerId: alice.id }],
    });
    await plays.create({
      gameId: pandemic.id,
      coopResult: 'failure',
      participations: [{ playerId: alice.id }],
    });

    const sheet = await loadGameSheet(pandemic.id, deps());

    expect(sheet?.type).toBe('cooperative');
    if (sheet?.type !== 'cooperative') throw new Error('expected cooperative');
    expect(sheet.stats).toMatchObject({
      playCount: 2,
      successCount: 1,
      failureCount: 1,
    });
  });

  it('returns null for a missing game (reachability guard)', async () => {
    expect(await loadGameSheet('nope', deps())).toBeNull();
  });
});
