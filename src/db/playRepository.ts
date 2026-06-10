/**
 * CRUD for plays. A play is created together with its participations in a
 * single transaction, after validating against the game's type (competitive vs
 * cooperative rules). Deleting a play removes its participations too.
 */
import { db as defaultDb, LudoboxDB } from './db';
import type { CoopResult, Participation, Play } from '@/domain/types';
import { assertValid, validatePlay } from '@/domain/validation';

export interface NewParticipation {
  playerId: string;
  score?: number | null;
  isWinner?: boolean;
}

export interface NewPlay {
  gameId: string;
  playedAt?: Date;
  note?: string;
  coopResult?: CoopResult;
  participations: NewParticipation[];
}

export function createPlayRepository(db: LudoboxDB = defaultDb) {
  async function create(input: NewPlay): Promise<Play> {
    const game = await db.games.get(input.gameId);
    if (!game) throw new Error(`Game ${input.gameId} not found.`);

    const participations = input.participations.map((p) => ({
      playerId: p.playerId,
      score: p.score ?? null,
      isWinner: p.isWinner ?? false,
    }));

    // Cooperative plays default to a 'success' result; competitive plays carry none.
    const coopResult =
      game.type === 'cooperative'
        ? (input.coopResult ?? 'success')
        : input.coopResult;

    assertValid(
      validatePlay({ gameType: game.type, coopResult, participations }),
    );

    const play: Play = {
      id: crypto.randomUUID(),
      gameId: input.gameId,
      playedAt: input.playedAt ?? new Date(),
      createdAt: new Date(),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(coopResult !== undefined ? { coopResult } : {}),
    };

    const rows: Participation[] = participations.map((p) => ({
      id: crypto.randomUUID(),
      playId: play.id,
      ...p,
    }));

    await db.transaction('rw', db.plays, db.participations, async () => {
      await db.plays.add(play);
      await db.participations.bulkAdd(rows);
    });

    return play;
  }

  function get(id: string): Promise<Play | undefined> {
    return db.plays.get(id);
  }

  function listByGame(gameId: string): Promise<Play[]> {
    return db.plays.where('gameId').equals(gameId).toArray();
  }

  /**
   * Play count per game id, computed at read time (the project invariant: counts
   * are never stored). Games with no play are simply absent from the map.
   */
  async function countByGame(): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    for (const { gameId } of await db.plays.toArray()) {
      counts.set(gameId, (counts.get(gameId) ?? 0) + 1);
    }
    return counts;
  }

  /** Deletes the play and its participations in one transaction. */
  async function remove(id: string): Promise<void> {
    await db.transaction('rw', db.plays, db.participations, async () => {
      await db.participations.where('playId').equals(id).delete();
      await db.plays.delete(id);
    });
  }

  return { create, get, listByGame, countByGame, remove };
}

export const playRepository = createPlayRepository();
