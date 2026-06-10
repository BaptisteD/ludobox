import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LudoboxDB } from '@/db/db';
import { createGameRepository } from '@/db/gameRepository';
import { createPlayRepository } from '@/db/playRepository';
import type { Game } from '@/domain/types';
import { loadCollection, sortGamesByName } from './collectionData';

const game = (over: Partial<Game> = {}): Game => ({
  id: crypto.randomUUID(),
  name: 'Catan',
  type: 'competitive',
  ...over,
});

describe('sortGamesByName', () => {
  it('sorts alphabetically, ignoring case and accents (French locale)', () => {
    const sorted = sortGamesByName([
      game({ name: 'Zoo' }),
      game({ name: 'élan' }),
      game({ name: 'Awalé' }),
      game({ name: 'azul' }),
    ]);
    expect(sorted.map((g) => g.name)).toEqual(['Awalé', 'azul', 'élan', 'Zoo']);
  });

  it('breaks ties deterministically by id (unreachable guard)', () => {
    const a = game({ id: 'aaa', name: 'Catan' });
    const b = game({ id: 'bbb', name: 'catan' });
    expect(sortGamesByName([b, a]).map((g) => g.id)).toEqual(['aaa', 'bbb']);
  });

  it('does not mutate its input', () => {
    const input = [game({ name: 'B' }), game({ name: 'A' })];
    sortGamesByName(input);
    expect(input.map((g) => g.name)).toEqual(['B', 'A']);
  });
});

describe('loadCollection', () => {
  let db: LudoboxDB;
  let deps: {
    games: ReturnType<typeof createGameRepository>;
    plays: ReturnType<typeof createPlayRepository>;
  };

  beforeEach(() => {
    db = new LudoboxDB(`test-${crypto.randomUUID()}`);
    deps = { games: createGameRepository(db), plays: createPlayRepository(db) };
  });

  afterEach(async () => {
    await db.delete();
  });

  it('returns sorted entries each carrying a read-time play count', async () => {
    const catan = await deps.games.create({
      name: 'Catan',
      type: 'competitive',
    });
    await deps.games.create({ name: 'Azul', type: 'competitive' });
    await deps.plays.create({
      gameId: catan.id,
      participations: [{ playerId: 'a', isWinner: true }],
    });
    await deps.plays.create({
      gameId: catan.id,
      participations: [{ playerId: 'b', isWinner: true }],
    });

    const entries = await loadCollection(deps);

    expect(entries.map((e) => e.game.name)).toEqual(['Azul', 'Catan']);
    expect(entries.find((e) => e.game.name === 'Catan')?.playCount).toBe(2);
    expect(entries.find((e) => e.game.name === 'Azul')?.playCount).toBe(0);
  });

  it('returns an empty array when the collection is empty', async () => {
    expect(await loadCollection(deps)).toEqual([]);
  });
});
