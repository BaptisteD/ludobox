/**
 * Domain entities for Ludobox — a personal board-game play journal.
 *
 * Data is stored normalized across four tables (games, players, plays,
 * participations); statistics are always computed at read time, never stored
 * (see `stats.ts`). These types are the contract shared by the persistence
 * layer, the validation rules, and the stats selectors.
 */

export type GameType = 'competitive' | 'cooperative';

export interface Game {
  id: string;
  name: string;
  type: GameType;
  /** Optional metadata, surfaced in the game sheet. */
  minPlayers?: number;
  maxPlayers?: number;
  durationMin?: number;
}

export type PlayerStatus = 'active' | 'archived';

export interface Player {
  id: string;
  name: string;
  /**
   * Deleting a player archives them (never a physical delete) so past
   * participations stay intact and derived stats remain coherent. Archived
   * players drop out of active lists / autocomplete but still count everywhere
   * their real plays appear (record, ranking, history).
   */
  status: PlayerStatus;
}

/** Collective outcome of a cooperative play (competitive plays leave this unset). */
export type CoopResult = 'success' | 'failure';

export interface Play {
  id: string;
  gameId: string;
  /** The date the game was played — user-editable. */
  playedAt: Date;
  note?: string;
  /**
   * Immutable creation timestamp. Used as the deterministic secondary sort key
   * when two plays share the same `playedAt`.
   */
  createdAt: Date;
  /**
   * Cooperative games carry their success/failure result at the play level
   * (there is no per-player score or winner in coop). Absent for competitive
   * plays; defaults to 'success' for coop when not specified.
   */
  coopResult?: CoopResult;
}

export interface Participation {
  id: string;
  playId: string;
  playerId: string;
  /** `null` means "not entered" (distinct from a score of 0). Integer, may be negative. */
  score: number | null;
  /**
   * Victory is a per-participation flag, declared manually and independent of
   * the score. A competitive play requires at least one winner; ex-aequo
   * (multiple winners) is supported.
   */
  isWinner: boolean;
}
