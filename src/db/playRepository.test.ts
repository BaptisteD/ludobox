import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LudoboxDB } from './db';
import { createGameRepository } from './gameRepository';
import { createPlayRepository } from './playRepository';
import { createParticipationRepository } from './participationRepository';
import { createPlayerRepository } from './playerRepository';

let db: LudoboxDB;
let games: ReturnType<typeof createGameRepository>;
let plays: ReturnType<typeof createPlayRepository>;
let participations: ReturnType<typeof createParticipationRepository>;
let players: ReturnType<typeof createPlayerRepository>;

beforeEach(() => {
  db = new LudoboxDB(`test-${crypto.randomUUID()}`);
  games = createGameRepository(db);
  plays = createPlayRepository(db);
  participations = createParticipationRepository(db);
  players = createPlayerRepository(db);
});

afterEach(async () => {
  await db.delete();
});

async function competitiveGame() {
  return games.create({ name: 'Catan', type: 'competitive' });
}

async function cooperativeGame() {
  return games.create({ name: 'Pandemic', type: 'cooperative' });
}

describe('playRepository.create', () => {
  it('persists a competitive play with its participations, ids and createdAt', async () => {
    const g = await competitiveGame();
    const play = await plays.create({
      gameId: g.id,
      participations: [
        { playerId: 'a', isWinner: true, score: 10 },
        { playerId: 'b', isWinner: false, score: 5 },
      ],
    });

    expect(play.id).toBeTruthy();
    expect(play.createdAt).toBeInstanceOf(Date);
    const parts = await participations.listByPlay(play.id);
    expect(parts).toHaveLength(2);
    expect(parts.every((p) => p.id && p.playId === play.id)).toBe(true);
  });

  it('defaults playedAt to now when omitted', async () => {
    const g = await competitiveGame();
    const before = Date.now();
    const play = await plays.create({
      gameId: g.id,
      participations: [{ playerId: 'a', isWinner: true }],
    });
    expect(play.playedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('rejects a competitive play with no winner (and writes nothing)', async () => {
    const g = await competitiveGame();
    await expect(
      plays.create({
        gameId: g.id,
        participations: [{ playerId: 'a', isWinner: false }],
      }),
    ).rejects.toMatchObject({ code: 'NO_WINNER' });
    expect(await plays.listByGame(g.id)).toHaveLength(0);
    expect(await participations.getAll()).toHaveLength(0);
  });

  it('defaults a cooperative play result to success', async () => {
    const g = await cooperativeGame();
    const play = await plays.create({
      gameId: g.id,
      participations: [{ playerId: 'a' }],
    });
    expect(play.coopResult).toBe('success');
  });

  it('rejects a cooperative play that names a winner', async () => {
    const g = await cooperativeGame();
    await expect(
      plays.create({
        gameId: g.id,
        participations: [{ playerId: 'a', isWinner: true }],
      }),
    ).rejects.toMatchObject({ code: 'WINNER_ON_COOPERATIVE' });
  });
});

describe('playRepository.countByGame', () => {
  it('counts plays per game id, omitting games with none', async () => {
    const catan = await competitiveGame();
    const pandemic = await cooperativeGame();
    await plays.create({
      gameId: catan.id,
      participations: [{ playerId: 'a', isWinner: true }],
    });
    await plays.create({
      gameId: catan.id,
      participations: [{ playerId: 'b', isWinner: true }],
    });

    const counts = await plays.countByGame();

    expect(counts.get(catan.id)).toBe(2);
    expect(counts.has(pandemic.id)).toBe(false);
  });

  it('returns an empty map when no plays exist', async () => {
    expect((await plays.countByGame()).size).toBe(0);
  });
});

describe('playRepository.remove', () => {
  it('deletes the play and its participations', async () => {
    const g = await competitiveGame();
    const play = await plays.create({
      gameId: g.id,
      participations: [{ playerId: 'a', isWinner: true }],
    });

    await plays.remove(play.id);

    expect(await plays.get(play.id)).toBeUndefined();
    expect(await participations.listByPlay(play.id)).toHaveLength(0);
  });
});

describe('playRepository.create — on-the-fly players', () => {
  it('creates a named participant as an active player in the same write', async () => {
    const g = await competitiveGame();
    const play = await plays.create({
      gameId: g.id,
      participations: [{ name: 'Nina', isWinner: true, score: 12 }],
    });

    const all = await players.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ name: 'Nina', status: 'active' });
    const parts = await participations.listByPlay(play.id);
    expect(parts[0].playerId).toBe(all[0].id);
  });

  it('writes nothing — not even the new player — when the play is invalid', async () => {
    const g = await competitiveGame();
    await expect(
      plays.create({
        gameId: g.id,
        participations: [{ name: 'Nina', isWinner: false }],
      }),
    ).rejects.toMatchObject({ code: 'NO_WINNER' });
    expect(await players.getAll()).toHaveLength(0);
    expect(await plays.listByGame(g.id)).toHaveLength(0);
  });

  it('rejects a new name that duplicates an active player (writes nothing)', async () => {
    const g = await competitiveGame();
    await players.create({ name: 'Léa' });
    await expect(
      plays.create({
        gameId: g.id,
        participations: [{ name: 'lea', isWinner: true }],
      }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_PLAYER_NAME' });
    expect(await plays.listByGame(g.id)).toHaveLength(0);
  });

  it('still accepts existing playerId participations unchanged', async () => {
    const g = await competitiveGame();
    const play = await plays.create({
      gameId: g.id,
      participations: [{ playerId: 'fixed-id', isWinner: true, score: 3 }],
    });
    const parts = await participations.listByPlay(play.id);
    expect(parts[0].playerId).toBe('fixed-id');
  });

  it('rejects two new-player participations with the same name in one batch', async () => {
    const g = await competitiveGame();
    await expect(
      plays.create({
        gameId: g.id,
        participations: [
          { name: 'Nina', isWinner: true },
          { name: 'nina', isWinner: false },
        ],
      }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_PLAYER_NAME' });
    expect(await players.getAll()).toHaveLength(0);
    expect(await plays.listByGame(g.id)).toHaveLength(0);
  });
});

describe('playRepository.update', () => {
  it('replaces participations and updates fields, preserving createdAt', async () => {
    const g = await competitiveGame();
    const play = await plays.create({
      gameId: g.id,
      playedAt: new Date('2026-01-01'),
      participations: [{ playerId: 'a', isWinner: true, score: 5 }],
    });

    const updated = await plays.update(play.id, {
      playedAt: new Date('2026-02-02'),
      note: 'corrigé',
      participations: [{ playerId: 'a', isWinner: true, score: 50 }],
    });

    expect(updated.createdAt.getTime()).toBe(play.createdAt.getTime());
    expect(updated.playedAt.toISOString()).toBe(
      new Date('2026-02-02').toISOString(),
    );
    expect(updated.note).toBe('corrigé');
    const parts = await participations.listByPlay(play.id);
    expect(parts).toHaveLength(1);
    expect(parts[0].score).toBe(50);
  });

  it('clears a note when the new note is empty', async () => {
    const g = await competitiveGame();
    const play = await plays.create({
      gameId: g.id,
      note: 'avant',
      participations: [{ playerId: 'a', isWinner: true }],
    });
    const updated = await plays.update(play.id, {
      note: '   ',
      participations: [{ playerId: 'a', isWinner: true }],
    });
    expect(updated.note).toBeUndefined();
  });

  it('creates on-the-fly players during an edit', async () => {
    const g = await competitiveGame();
    const play = await plays.create({
      gameId: g.id,
      participations: [{ playerId: 'a', isWinner: true }],
    });
    await plays.update(play.id, {
      participations: [
        { playerId: 'a', isWinner: false },
        { name: 'Zoé', isWinner: true },
      ],
    });
    const all = await players.getAll();
    expect(all.map((p) => p.name)).toContain('Zoé');
    expect(await participations.listByPlay(play.id)).toHaveLength(2);
  });

  it('rejects an invalid edit and leaves the play untouched', async () => {
    const g = await competitiveGame();
    const play = await plays.create({
      gameId: g.id,
      participations: [{ playerId: 'a', isWinner: true, score: 9 }],
    });
    await expect(
      plays.update(play.id, {
        participations: [{ playerId: 'a', isWinner: false }],
      }),
    ).rejects.toMatchObject({ code: 'NO_WINNER' });
    const parts = await participations.listByPlay(play.id);
    expect(parts[0].score).toBe(9);
  });

  it('throws for a missing play', async () => {
    await expect(
      plays.update('nope', {
        participations: [{ playerId: 'a', isWinner: true }],
      }),
    ).rejects.toThrow();
  });

  it('persists an updated cooperative result', async () => {
    const g = await cooperativeGame();
    const play = await plays.create({
      gameId: g.id,
      coopResult: 'success',
      participations: [{ playerId: 'a' }],
    });
    const updated = await plays.update(play.id, {
      coopResult: 'failure',
      participations: [{ playerId: 'a' }],
    });
    expect(updated.coopResult).toBe('failure');
  });

  it('rejects coopResult set on a competitive edit', async () => {
    const g = await competitiveGame();
    const play = await plays.create({
      gameId: g.id,
      participations: [{ playerId: 'a', isWinner: true }],
    });
    await expect(
      plays.update(play.id, {
        coopResult: 'success',
        participations: [{ playerId: 'a', isWinner: true }],
      }),
    ).rejects.toMatchObject({ code: 'COOP_RESULT_ON_COMPETITIVE' });
  });
});
