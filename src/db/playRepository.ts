/**
 * CRUD for plays. A play is created together with its participations in a
 * single transaction, after validating against the game's type (competitive vs
 * cooperative rules). Deleting a play removes its participations too.
 */
import { db as defaultDb, LudoboxDB } from './db';
import type { CoopResult, Participation, Play, Player } from '@/domain/types';
import {
  assertValid,
  checkPlayerNameAvailable,
  validatePlay,
  validatePlayerDraft,
} from '@/domain/validation';

/** An existing player participating. */
export interface NewParticipation {
  playerId: string;
  score?: number | null;
  isWinner?: boolean;
}

/** A brand-new active player, created inside the play's transaction (§8.6). */
export interface NewPlayerParticipation {
  name: string;
  score?: number | null;
  isWinner?: boolean;
}

export type DraftParticipation = NewParticipation | NewPlayerParticipation;

const isExisting = (p: DraftParticipation): p is NewParticipation =>
  'playerId' in p;

export interface NewPlay {
  gameId: string;
  playedAt?: Date;
  note?: string;
  coopResult?: CoopResult;
  participations: DraftParticipation[];
}

export interface UpdatePlay {
  playedAt?: Date;
  note?: string;
  coopResult?: CoopResult;
  participations: DraftParticipation[];
}

/** Note is stored only when non-empty after trimming (parallels the form). */
const cleanNote = (note?: string): string | undefined => {
  const t = (note ?? '').trim();
  return t.length ? t : undefined;
};

/**
 * For each draft participation that names a new player, build the Player row
 * (validated + unique among active players, including names earlier in the same
 * batch). Returns an array aligned by index: null where the participation refers
 * to an existing playerId. Runs inside the caller's transaction.
 */
async function resolveNewPlayers(
  db: LudoboxDB,
  participations: DraftParticipation[],
): Promise<(Player | null)[]> {
  const existingPlayers = await db.players.toArray();
  const created: Player[] = [];
  return participations.map((p) => {
    if (isExisting(p)) return null;
    const name = p.name.trim();
    assertValid(validatePlayerDraft(name));
    assertValid(
      checkPlayerNameAvailable(name, [...existingPlayers, ...created]),
    );
    const player: Player = { id: crypto.randomUUID(), name, status: 'active' };
    created.push(player);
    return player;
  });
}

export function createPlayRepository(db: LudoboxDB = defaultDb) {
  async function create(input: NewPlay): Promise<Play> {
    const game = await db.games.get(input.gameId);
    if (!game) throw new Error(`Game ${input.gameId} not found.`);

    const coopResult =
      game.type === 'cooperative'
        ? (input.coopResult ?? 'success')
        : input.coopResult;

    const note = cleanNote(input.note);

    return db.transaction(
      'rw',
      db.games,
      db.players,
      db.plays,
      db.participations,
      async () => {
        const playId = crypto.randomUUID();
        const newPlayers = await resolveNewPlayers(db, input.participations);
        const resolved = input.participations.map((p, i) => ({
          playerId: isExisting(p) ? p.playerId : newPlayers[i]!.id,
          score: p.score ?? null,
          isWinner: p.isWinner ?? false,
        }));

        assertValid(
          validatePlay({
            gameType: game.type,
            coopResult,
            participations: resolved,
          }),
        );

        const play: Play = {
          id: playId,
          gameId: input.gameId,
          playedAt: input.playedAt ?? new Date(),
          createdAt: new Date(),
          ...(note !== undefined ? { note } : {}),
          ...(coopResult !== undefined ? { coopResult } : {}),
        };
        const rows: Participation[] = resolved.map((p) => ({
          id: crypto.randomUUID(),
          playId,
          ...p,
        }));

        await db.players.bulkAdd(
          newPlayers.filter((p): p is Player => p !== null),
        );
        await db.plays.add(play);
        await db.participations.bulkAdd(rows);
        return play;
      },
    );
  }

  async function update(id: string, input: UpdatePlay): Promise<Play> {
    return db.transaction(
      'rw',
      db.games,
      db.players,
      db.plays,
      db.participations,
      async () => {
        const current = await db.plays.get(id);
        if (!current) throw new Error(`Play ${id} not found.`);
        const game = await db.games.get(current.gameId);
        if (!game) throw new Error(`Game ${current.gameId} not found.`);

        const coopResult =
          game.type === 'cooperative'
            ? (input.coopResult ?? 'success')
            : input.coopResult;
        const note = cleanNote(input.note);

        const newPlayers = await resolveNewPlayers(db, input.participations);
        const resolved = input.participations.map((p, i) => ({
          playerId: isExisting(p) ? p.playerId : newPlayers[i]!.id,
          score: p.score ?? null,
          isWinner: p.isWinner ?? false,
        }));

        assertValid(
          validatePlay({
            gameType: game.type,
            coopResult,
            participations: resolved,
          }),
        );

        const play: Play = {
          id: current.id,
          gameId: current.gameId,
          createdAt: current.createdAt,
          playedAt: input.playedAt ?? current.playedAt,
          ...(note !== undefined ? { note } : {}),
          ...(coopResult !== undefined ? { coopResult } : {}),
        };
        const rows: Participation[] = resolved.map((p) => ({
          id: crypto.randomUUID(),
          playId: id,
          ...p,
        }));

        await db.players.bulkAdd(
          newPlayers.filter((p): p is Player => p !== null),
        );
        await db.participations.where('playId').equals(id).delete();
        await db.plays.put(play);
        await db.participations.bulkAdd(rows);
        return play;
      },
    );
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

  return { create, update, get, listByGame, countByGame, remove };
}

export const playRepository = createPlayRepository();
