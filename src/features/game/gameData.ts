/**
 * Read models for the Fiche jeu. Everything is computed at read time (the
 * project invariant: never store stats). `loadGameSheet` joins the repos and
 * the domain selectors; `toHistoryRow` is the pure adapter from a domain
 * `GameHistoryEntry` to the kit's `HistoryRow` props, so the component stays
 * presentational and free of any stat or formatting logic.
 */
import { gameRepository } from '@/db/gameRepository';
import { participationRepository } from '@/db/participationRepository';
import { playerRepository } from '@/db/playerRepository';
import { playRepository } from '@/db/playRepository';
import {
  competitiveGameStats,
  cooperativeGameStats,
  gameHistory,
  type CompetitiveGameStats,
  type CooperativeGameStats,
  type GameHistoryEntry,
} from '@/domain/stats';
import type { Game, GameType } from '@/domain/types';
import type { ResultKind } from '@/ui';

export type GameSheet =
  | {
      game: Game;
      type: 'competitive';
      stats: CompetitiveGameStats;
      history: GameHistoryEntry[];
    }
  | {
      game: Game;
      type: 'cooperative';
      stats: CooperativeGameStats;
      history: GameHistoryEntry[];
    };

export interface GameSheetDeps {
  games: Pick<typeof gameRepository, 'get'>;
  players: Pick<typeof playerRepository, 'getAll'>;
  plays: Pick<typeof playRepository, 'listByGame'>;
  participations: Pick<typeof participationRepository, 'listByPlay'>;
}

const defaultDeps: GameSheetDeps = {
  games: gameRepository,
  players: playerRepository,
  plays: playRepository,
  participations: participationRepository,
};

/**
 * Loads a game's fiche: type-specific stats + chronological history, recomputed
 * at read time. Players are loaded in full (archived included) so the record,
 * ranking and history keep them by name. Returns `null` when the game is
 * missing — the UI uses this as the reachability guard.
 */
export async function loadGameSheet(
  gameId: string,
  deps: GameSheetDeps = defaultDeps,
): Promise<GameSheet | null> {
  const game = await deps.games.get(gameId);
  if (!game) return null;

  const [gamePlays, players] = await Promise.all([
    deps.plays.listByGame(gameId),
    deps.players.getAll(),
  ]);
  const parts = (
    await Promise.all(
      gamePlays.map((play) => deps.participations.listByPlay(play.id)),
    )
  ).flat();

  const history = gameHistory(game, gamePlays, parts, players);

  if (game.type === 'competitive') {
    return {
      game,
      type: 'competitive',
      stats: competitiveGameStats(game, gamePlays, parts, players),
      history,
    };
  }
  return {
    game,
    type: 'cooperative',
    stats: cooperativeGameStats(game, gamePlays),
    history,
  };
}

export interface GameHistoryRow {
  /** Winner name(s) — competitive only. */
  title?: string;
  /** Other participants (with scores) plus note/archived markers. */
  meta?: string;
  /** Collective result chip — cooperative only. */
  result?: ResultKind;
  /** Trophy glyph on the winning row — competitive only. */
  trophy?: boolean;
  /** Winning score, or 'unset' when no winner has a score. */
  score?: number | 'unset';
}

const withScore = (p: { name: string; score: number | null }): string =>
  p.score === null ? p.name : `${p.name} ${p.score}`;

/** Pure adapter from a domain history entry to `HistoryRow` props per type. */
export function toHistoryRow(
  entry: GameHistoryEntry,
  type: GameType,
): GameHistoryRow {
  const markers: string[] = [];
  if (entry.hasNote) markers.push('note');
  if (entry.participants.some((p) => p.isArchived)) markers.push('archivé');

  if (type === 'cooperative') {
    const meta = [
      ...entry.participants.map((p) => p.name),
      ...markers,
    ].join(' · ');
    return {
      result: entry.coopResult === 'success' ? 'succes' : 'echec',
      meta: meta || undefined,
    };
  }

  const winners = entry.participants.filter((p) => p.isWinner);
  const others = entry.participants.filter((p) => !p.isWinner);
  const winnerScores = winners
    .map((p) => p.score)
    .filter((s): s is number => s !== null);
  const meta = [...others.map(withScore), ...markers].join(' · ');

  return {
    title: winners.map((p) => p.name).join(' & ') || undefined,
    trophy: true,
    score: winnerScores.length ? Math.max(...winnerScores) : 'unset',
    meta: meta || undefined,
  };
}
