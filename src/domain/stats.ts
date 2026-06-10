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
import type {
  CoopResult,
  Game,
  GameType,
  Participation,
  Play,
  Player,
} from './types';

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

/**
 * One line of a player's cross-game history. UI-free: the rendering layer maps
 * `gameType` + `isWinner`/`coopResult` to the right chip (Victoire/Défaite vs
 * Succès/Échec) and decides how to show the score. `score` is the player's own
 * participation score (competitive only); `null` means not entered, and it is
 * always `null` for cooperative plays (no individual score exists in coop).
 */
export interface PlayerHistoryEntry {
  playId: string;
  playedAt: Date;
  gameName: string;
  gameType: GameType;
  isWinner: boolean;
  coopResult: CoopResult;
  score: number | null;
}

/** One participant of a play, as the Fiche jeu history renders it. */
export interface GameHistoryParticipant {
  playerId: string;
  name: string;
  /** Participation score; `null` means not entered. Always null in coop. */
  score: number | null;
  isWinner: boolean;
  /** From the player's status — drives the inline "archivé" marker. */
  isArchived: boolean;
}

/**
 * One line of a game's chronological history (fiche jeu §8.5): one entry per
 * play, newest first. Participants are surfaced winners-first then by name so
 * the UI can put the winner(s) on the title line and the rest in the meta.
 * Pure — computed at read time; archived players stay present by name.
 */
export interface GameHistoryEntry {
  playId: string;
  playedAt: Date;
  participants: GameHistoryParticipant[];
  coopResult: CoopResult;
  hasNote: boolean;
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

/**
 * A player's cross-game history (fiche joueur §8.3/§8.4): one entry per play the
 * player took part in, newest first. Each entry joins the player's own
 * participation with its play and game, resolving coop result to its default
 * ('success' when absent, per the Play type). Pure — computed at read time.
 */
export function playerHistory(
  player: Player,
  plays: Play[],
  participations: Participation[],
  games: Game[],
): PlayerHistoryEntry[] {
  const gameById = new Map(games.map((game) => [game.id, game]));
  const partByPlay = new Map(
    participations
      .filter((part) => part.playerId === player.id)
      .map((part) => [part.playId, part]),
  );

  return sortPlaysForHistory(
    plays.filter((play) => partByPlay.has(play.id)),
  ).flatMap((play) => {
    const game = gameById.get(play.gameId);
    const part = partByPlay.get(play.id);
    if (!game || !part) return [];
    return [
      {
        playId: play.id,
        playedAt: play.playedAt,
        gameName: game.name,
        gameType: game.type,
        isWinner: part.isWinner,
        coopResult: play.coopResult ?? 'success',
        score: part.score,
      },
    ];
  });
}

/** The celebrated record when a save beats it (competitive only). */
export interface RecordCelebration {
  holderName: string;
  score: number;
}

/**
 * Judges whether a just-saved competitive play breaks the game's record.
 * `priorRecordScore` is the highest score across every *other* play (and, on an
 * edit, the play's own previous scores) — so a beaten record is always held by
 * someone inside `savedParticipants`. Returns the new holder + score, or null
 * when no entered score strictly exceeds the prior record. Pure.
 */
export function recordCelebration(
  savedParticipants: { name: string; score: number | null }[],
  priorRecordScore: number | null,
): RecordCelebration | null {
  const scored = savedParticipants.filter(
    (p): p is { name: string; score: number } => p.score !== null,
  );
  if (scored.length === 0) return null;
  const thisMax = Math.max(...scored.map((p) => p.score));
  if (priorRecordScore !== null && thisMax <= priorRecordScore) return null;
  const holder = scored
    .filter((p) => p.score === thisMax)
    .sort((a, b) =>
      a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }),
    )[0];
  return { holderName: holder.name, score: thisMax };
}

/**
 * A game's chronological history (fiche jeu §8.5): one entry per play of the
 * game, newest first. Each entry joins the play's participations with player
 * names/status, ordered winners-first then by name (case/accent-insensitive)
 * for a deterministic read. Pure — computed at read time.
 */
export function gameHistory(
  game: Game,
  plays: Play[],
  participations: Participation[],
  players: Player[],
): GameHistoryEntry[] {
  const playerById = new Map(players.map((p) => [p.id, p]));
  const partsByPlay = new Map<string, Participation[]>();
  for (const part of participations) {
    const list = partsByPlay.get(part.playId);
    if (list) list.push(part);
    else partsByPlay.set(part.playId, [part]);
  }

  return sortPlaysForHistory(playsOfGame(game, plays)).map((play) => {
    const parts = partsByPlay.get(play.id) ?? [];
    const participants: GameHistoryParticipant[] = parts
      .map((part) => {
        const player = playerById.get(part.playerId);
        return {
          playerId: part.playerId,
          name: player?.name ?? '',
          score: part.score,
          isWinner: part.isWinner,
          isArchived: player?.status === 'archived',
        };
      })
      .sort(
        (a, b) =>
          Number(b.isWinner) - Number(a.isWinner) ||
          a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }),
      );

    return {
      playId: play.id,
      playedAt: play.playedAt,
      participants,
      coopResult: play.coopResult ?? 'success',
      hasNote: (play.note ?? '').trim().length > 0,
    };
  });
}
