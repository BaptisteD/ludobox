/**
 * Read access to participations. Participations are written as part of a play
 * (see `playRepository`); this repository exposes the indexed lookups the
 * stats selectors and history views need.
 */
import { db as defaultDb, LudoboxDB } from './db';
import type { Participation } from '@/domain/types';

export function createParticipationRepository(db: LudoboxDB = defaultDb) {
  function listByPlay(playId: string): Promise<Participation[]> {
    return db.participations.where('playId').equals(playId).toArray();
  }

  function listByPlayer(playerId: string): Promise<Participation[]> {
    return db.participations.where('playerId').equals(playerId).toArray();
  }

  function getAll(): Promise<Participation[]> {
    return db.participations.toArray();
  }

  /**
   * Read-time count of plays per player (never stored). A player takes part in a
   * play at most once, so their participation count equals their distinct play
   * count (fiche joueur §8.1). Players with no plays are absent from the map.
   */
  async function countByPlayer(): Promise<Map<string, number>> {
    const all = await db.participations.toArray();
    const counts = new Map<string, number>();
    for (const part of all) {
      counts.set(part.playerId, (counts.get(part.playerId) ?? 0) + 1);
    }
    return counts;
  }

  return { listByPlay, listByPlayer, getAll, countByPlayer };
}

export const participationRepository = createParticipationRepository();
