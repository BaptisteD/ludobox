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

  return { listByPlay, listByPlayer, getAll };
}

export const participationRepository = createParticipationRepository();
