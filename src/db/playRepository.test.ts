import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LudoboxDB } from './db';
import { createGameRepository } from './gameRepository';
import { createPlayRepository } from './playRepository';
import { createParticipationRepository } from './participationRepository';

let db: LudoboxDB;
let games: ReturnType<typeof createGameRepository>;
let plays: ReturnType<typeof createPlayRepository>;
let participations: ReturnType<typeof createParticipationRepository>;

beforeEach(() => {
  db = new LudoboxDB(`test-${crypto.randomUUID()}`);
  games = createGameRepository(db);
  plays = createPlayRepository(db);
  participations = createParticipationRepository(db);
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
