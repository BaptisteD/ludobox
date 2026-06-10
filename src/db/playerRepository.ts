/**
 * CRUD for players. Names are unique among active players; "deletion" is an
 * archive (status change), never a physical delete, so past participations and
 * derived stats stay intact.
 */
import { db as defaultDb, LudoboxDB } from './db';
import type { Player } from '@/domain/types';
import {
  assertValid,
  checkPlayerNameAvailable,
  validatePlayerDraft,
} from '@/domain/validation';

export function createPlayerRepository(db: LudoboxDB = defaultDb) {
  async function create(input: { name: string }): Promise<Player> {
    const name = input.name.trim();
    assertValid(validatePlayerDraft(name));
    const existing = await db.players.toArray();
    assertValid(checkPlayerNameAvailable(name, existing));
    const player: Player = {
      id: crypto.randomUUID(),
      name,
      status: 'active',
    };
    await db.players.add(player);
    return player;
  }

  function get(id: string): Promise<Player | undefined> {
    return db.players.get(id);
  }

  function getAll(): Promise<Player[]> {
    return db.players.toArray();
  }

  function getActive(): Promise<Player[]> {
    return db.players.where('status').equals('active').toArray();
  }

  async function rename(id: string, name: string): Promise<Player> {
    const current = await db.players.get(id);
    if (!current) throw new Error(`Player ${id} not found.`);
    const trimmed = name.trim();
    assertValid(validatePlayerDraft(trimmed));
    const existing = await db.players.toArray();
    assertValid(checkPlayerNameAvailable(trimmed, existing, { excludeId: id }));
    const updated: Player = { ...current, name: trimmed };
    await db.players.put(updated);
    return updated;
  }

  /** Archiving is the "delete": the player drops out of active lists but is kept. */
  async function archive(id: string): Promise<Player> {
    const current = await db.players.get(id);
    if (!current) throw new Error(`Player ${id} not found.`);
    const updated: Player = { ...current, status: 'archived' };
    await db.players.put(updated);
    return updated;
  }

  return { create, get, getAll, getActive, rename, archive };
}

export const playerRepository = createPlayerRepository();
