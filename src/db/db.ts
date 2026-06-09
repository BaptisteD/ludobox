/**
 * Dexie (IndexedDB) database for Ludobox.
 *
 * Normalized schema, four tables, with the indexes the read paths rely on
 * (`plays.gameId`, `participations.playId`, `participations.playerId`, and
 * `players.status` for active-list filtering). Statistics are never stored —
 * see `@/domain/stats`.
 */
import Dexie, { type Table } from 'dexie';
import type { Game, Participation, Play, Player } from '@/domain/types';

export class LudoboxDB extends Dexie {
  games!: Table<Game, string>;
  players!: Table<Player, string>;
  plays!: Table<Play, string>;
  participations!: Table<Participation, string>;

  constructor(name = 'ludobox') {
    super(name);
    this.version(1).stores({
      games: 'id',
      players: 'id, status',
      plays: 'id, gameId',
      participations: 'id, playId, playerId',
    });
  }
}

/** Shared singleton used by the app (tests build their own isolated instances). */
export const db = new LudoboxDB();
