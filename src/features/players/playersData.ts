/**
 * Read models for the Joueurs space. Everything here is computed at read time
 * (the project invariant: never store stats). The pure sort is unit-testable
 * without a database; the loaders join the repos and the domain selectors.
 */
import { gameRepository } from '@/db/gameRepository';
import { participationRepository } from '@/db/participationRepository';
import { playerRepository } from '@/db/playerRepository';
import { playRepository } from '@/db/playRepository';
import {
  playerHistory,
  playerStats,
  type PlayerHistoryEntry,
  type PlayerStats,
} from '@/domain/stats';
import type { Game, Play, Player } from '@/domain/types';

export interface PlayerEntry {
  player: Player;
  playCount: number;
}

export interface PlayerSheet {
  player: Player;
  stats: PlayerStats;
  history: PlayerHistoryEntry[];
}

/**
 * Alphabetical order, case/accent-insensitive in the French locale (PRD Listes
 * §8.3). Active names are unique so ties are unreachable; we still break them by
 * id for a deterministic order. Returns a new array — never mutates the input.
 */
export function sortPlayersByName(players: Player[]): Player[] {
  return [...players].sort(
    (a, b) =>
      a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }) ||
      a.id.localeCompare(b.id),
  );
}

export interface PlayersListDeps {
  players: Pick<typeof playerRepository, 'getActive'>;
  participations: Pick<typeof participationRepository, 'countByPlayer'>;
}

const defaultListDeps: PlayersListDeps = {
  players: playerRepository,
  participations: participationRepository,
};

/** Loads the active players, sorted, each paired with its read-time play count. */
export async function loadPlayers(
  deps: PlayersListDeps = defaultListDeps,
): Promise<PlayerEntry[]> {
  const [players, counts] = await Promise.all([
    deps.players.getActive(),
    deps.participations.countByPlayer(),
  ]);
  return sortPlayersByName(players).map((player) => ({
    player,
    playCount: counts.get(player.id) ?? 0,
  }));
}

export interface PlayerSheetDeps {
  players: Pick<typeof playerRepository, 'get'>;
  participations: Pick<typeof participationRepository, 'listByPlayer'>;
  plays: Pick<typeof playRepository, 'get'>;
  games: Pick<typeof gameRepository, 'get'>;
}

const defaultSheetDeps: PlayerSheetDeps = {
  players: playerRepository,
  participations: participationRepository,
  plays: playRepository,
  games: gameRepository,
};

/**
 * Loads an active player's fiche: their counters and cross-game history,
 * recomputed at read time. Returns `null` when the player is missing or
 * archived — the fiche only exists for active players (PRD §10), and the UI
 * uses this as the reachability guard.
 */
export async function loadPlayerSheet(
  playerId: string,
  deps: PlayerSheetDeps = defaultSheetDeps,
): Promise<PlayerSheet | null> {
  const player = await deps.players.get(playerId);
  if (!player || player.status !== 'active') return null;

  const parts = await deps.participations.listByPlayer(playerId);
  const playIds = [...new Set(parts.map((part) => part.playId))];
  const plays = (
    await Promise.all(playIds.map((id) => deps.plays.get(id)))
  ).filter((p): p is Play => p !== undefined);
  const gameIds = [...new Set(plays.map((play) => play.gameId))];
  const games = (
    await Promise.all(gameIds.map((id) => deps.games.get(id)))
  ).filter((g): g is Game => g !== undefined);

  return {
    player,
    stats: playerStats(player, plays, parts, games),
    history: playerHistory(player, plays, parts, games),
  };
}

const MONTHS_FR = [
  'JANV',
  'FÉVR',
  'MARS',
  'AVR',
  'MAI',
  'JUIN',
  'JUIL',
  'AOÛT',
  'SEPT',
  'OCT',
  'NOV',
  'DÉC',
];

/** Splits a play date into the day number and short French month for a date tile. */
export function formatHistoryDate(date: Date): { day: number; month: string } {
  return { day: date.getDate(), month: MONTHS_FR[date.getMonth()] };
}
