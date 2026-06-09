import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LudoboxDB } from './db';
import { createGameRepository } from './gameRepository';
import { createPlayRepository } from './playRepository';
import { DomainError } from '@/domain/validation';

let db: LudoboxDB;
let games: ReturnType<typeof createGameRepository>;
let plays: ReturnType<typeof createPlayRepository>;

beforeEach(() => {
  db = new LudoboxDB(`test-${crypto.randomUUID()}`);
  games = createGameRepository(db);
  plays = createPlayRepository(db);
});

afterEach(async () => {
  await db.delete();
});

describe('gameRepository', () => {
  it('creates a game with a generated id and persists it', async () => {
    const created = await games.create({ name: 'Catan', type: 'competitive' });
    expect(created.id).toBeTruthy();
    expect(await games.get(created.id)).toEqual(created);
  });

  it('rejects a duplicate name (case/accent-insensitive)', async () => {
    await games.create({ name: 'Café', type: 'competitive' });
    await expect(
      games.create({ name: 'cafe', type: 'competitive' }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_GAME_NAME' });
  });

  it('allows renaming a game to its own current name', async () => {
    const g = await games.create({ name: 'Catan', type: 'competitive' });
    const updated = await games.update(g.id, { name: 'Catan ' });
    expect(updated.name).toBe('Catan ');
  });

  it('locks the type once a play exists', async () => {
    const g = await games.create({ name: 'Catan', type: 'competitive' });
    await plays.create({
      gameId: g.id,
      participations: [{ playerId: 'x', isWinner: true }],
    });
    await expect(
      games.update(g.id, { type: 'cooperative' }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('allows changing the type before any play exists', async () => {
    const g = await games.create({ name: 'Catan', type: 'competitive' });
    const updated = await games.update(g.id, { type: 'cooperative' });
    expect(updated.type).toBe('cooperative');
  });

  it('cascades delete to plays and their participations', async () => {
    const g = await games.create({ name: 'Catan', type: 'competitive' });
    const play = await plays.create({
      gameId: g.id,
      participations: [
        { playerId: 'a', isWinner: true, score: 10 },
        { playerId: 'b', isWinner: false, score: 5 },
      ],
    });

    await games.remove(g.id);

    expect(await games.get(g.id)).toBeUndefined();
    expect(await plays.get(play.id)).toBeUndefined();
    expect(
      await db.participations.where('playId').equals(play.id).count(),
    ).toBe(0);
  });
});
