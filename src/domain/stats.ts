/**
 * Pure statistics selectors.
 *
 * Stats are always derived from raw data at read time, never stored. Every
 * function here takes plain arrays (games / players / plays / participations)
 * and returns a view — there is no store access, so they are trivially
 * testable with hard-coded fixtures.
 *
 * Archived players still count everywhere their real plays appear (record,
 * ranking, history); they only drop out of active lists, handled in the UI.
 */
import type { Game, Participation, Play, Player } from './types';

export interface GameRecord {
  score: number;
  holderName: string;
}

export interface RankingEntry {
  playerId: string;
  playerName: string;
  wins: number;
}

export interface CompetitiveGameStats {
  playCount: number;
  /** Highest entered score and who holds it; null when no score was ever entered. */
  record: GameRecord | null;
  /** Players who took part, ranked by wins descending (name asc on ties). */
  ranking: RankingEntry[];
}

export interface CooperativeGameStats {
  playCount: number;
  successCount: number;
  failureCount: number;
  /** successCount / playCount, or 0 when there are no plays. */
  successRate: number;
}

export interface PlayerStats {
  playCount: number;
  winCount: number;
}

const namesById = (players: Player[]): Map<string, string> =>
  new Map(players.map((p) => [p.id, p.name]));

const playsOfGame = (game: Game, plays: Play[]): Play[] =>
  plays.filter((play) => play.gameId === game.id);

const participationsOfPlays = (
  plays: Play[],
  participations: Participation[],
): Participation[] => {
  const playIds = new Set(plays.map((play) => play.id));
  return participations.filter((part) => playIds.has(part.playId));
};

export function competitiveGameStats(
  game: Game,
  plays: Play[],
  participations: Participation[],
  players: Player[],
): CompetitiveGameStats {
  const gamePlays = playsOfGame(game, plays);
  const gameParts = participationsOfPlays(gamePlays, participations);
  const names = namesById(players);

  return {
    playCount: gamePlays.length,
    record: computeRecord(gameParts, names),
    ranking: computeRanking(gameParts, names),
  };
}

function computeRecord(
  participations: Participation[],
  names: Map<string, string>,
): GameRecord | null {
  let best: { score: number; playerId: string } | null = null;
  for (const part of participations) {
    if (part.score === null) continue;
    if (best === null || part.score > best.score) {
      best = { score: part.score, playerId: part.playerId };
    }
  }
  if (best === null) return null;
  return { score: best.score, holderName: names.get(best.playerId) ?? '' };
}

function computeRanking(
  participations: Participation[],
  names: Map<string, string>,
): RankingEntry[] {
  const wins = new Map<string, number>();
  for (const part of participations) {
    const current = wins.get(part.playerId) ?? 0;
    wins.set(part.playerId, current + (part.isWinner ? 1 : 0));
  }
  return [...wins.entries()]
    .map(([playerId, count]) => ({
      playerId,
      playerName: names.get(playerId) ?? '',
      wins: count,
    }))
    .sort(
      (a, b) => b.wins - a.wins || a.playerName.localeCompare(b.playerName),
    );
}

export function cooperativeGameStats(
  game: Game,
  plays: Play[],
): CooperativeGameStats {
  const gamePlays = playsOfGame(game, plays);
  // A missing coopResult defaults to 'success' (see Play type).
  const successCount = gamePlays.filter(
    (play) => (play.coopResult ?? 'success') === 'success',
  ).length;
  const playCount = gamePlays.length;

  return {
    playCount,
    successCount,
    failureCount: playCount - successCount,
    successRate: playCount === 0 ? 0 : successCount / playCount,
  };
}

export function playerStats(
  player: Player,
  plays: Play[],
  participations: Participation[],
  games: Game[],
): PlayerStats {
  const playById = new Map(plays.map((play) => [play.id, play]));
  const gameById = new Map(games.map((game) => [game.id, game]));
  const own = participations.filter((part) => part.playerId === player.id);

  const winCount = own.filter((part) => {
    if (!part.isWinner) return false;
    const play = playById.get(part.playId);
    const game = play && gameById.get(play.gameId);
    return game?.type === 'competitive';
  }).length;

  return { playCount: own.length, winCount };
}

/**
 * History order: most recent `playedAt` first, breaking ties by `createdAt`
 * (also descending) for a deterministic, stable ordering. Does not mutate the
 * input.
 */
export function sortPlaysForHistory(plays: Play[]): Play[] {
  return [...plays].sort(
    (a, b) =>
      b.playedAt.getTime() - a.playedAt.getTime() ||
      b.createdAt.getTime() - a.createdAt.getTime(),
  );
}
