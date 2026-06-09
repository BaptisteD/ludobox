/**
 * CRUD for games. Enforces name uniqueness and the immutable-type invariant,
 * and cascades deletion to the game's plays and their participations.
 */
import { db as defaultDb, LudoboxDB } from './db';
import type { Game } from '@/domain/types';
import {
  assertValid,
  checkGameNameAvailable,
  checkGameTypeChange,
} from '@/domain/validation';

export type NewGame = Omit<Game, 'id'>;

export function createGameRepository(db: LudoboxDB = defaultDb) {
  async function create(input: NewGame): Promise<Game> {
    const existing = await db.games.toArray();
    assertValid(checkGameNameAvailable(input.name, existing));
    const game: Game = { id: crypto.randomUUID(), ...input };
    await db.games.add(game);
    return game;
  }

  function get(id: string): Promise<Game | undefined> {
    return db.games.get(id);
  }

  function getAll(): Promise<Game[]> {
    return db.games.toArray();
  }

  async function update(id: string, changes: Partial<NewGame>): Promise<Game> {
    const current = await db.games.get(id);
    if (!current) throw new Error(`Game ${id} not found.`);

    if (changes.name !== undefined) {
      const existing = await db.games.toArray();
      assertValid(
        checkGameNameAvailable(changes.name, existing, { excludeId: id }),
      );
    }
    if (changes.type !== undefined && changes.type !== current.type) {
      const hasPlays = (await db.plays.where('gameId').equals(id).count()) > 0;
      assertValid(checkGameTypeChange(current.type, changes.type, hasPlays));
    }

    const updated: Game = { ...current, ...changes };
    await db.games.put(updated);
    return updated;
  }

  /** Deletes the game and, in one transaction, its plays and their participations. */
  async function remove(id: string): Promise<void> {
    await db.transaction(
      'rw',
      db.games,
      db.plays,
      db.participations,
      async () => {
        const playIds = await db.plays.where('gameId').equals(id).primaryKeys();
        await db.participations.where('playId').anyOf(playIds).delete();
        await db.plays.where('gameId').equals(id).delete();
        await db.games.delete(id);
      },
    );
  }

  return { create, get, getAll, update, remove };
}

export const gameRepository = createGameRepository();
