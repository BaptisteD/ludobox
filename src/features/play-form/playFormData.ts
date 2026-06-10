/**
 * Read/write model for the Fiche partie. `loadPlayForm` joins the repos into an
 * initial draft; `savePlay` reads the prior record (delegating to the domain
 * stat) before writing, then asks the domain whether the save broke it. Deps are
 * injectable (mirrors gameData/playersData) so the logic is testable on
 * fake-indexeddb without the UI.
 */
import { gameRepository } from '@/db/gameRepository';
import { participationRepository } from '@/db/participationRepository';
import { playerRepository } from '@/db/playerRepository';
import { playRepository, type DraftParticipation } from '@/db/playRepository';
import {
  competitiveGameStats,
  recordCelebration,
  type RecordCelebration,
} from '@/domain/stats';
import type { Game, Player } from '@/domain/types';
import { avatarColorForName } from '@/ui';
import {
  emptyDraft,
  type DraftParticipant,
  type PlayDraftState,
} from './playDraft';

export type PlayFormScreen =
  | { mode: 'create'; gameId: string }
  | { mode: 'edit'; playId: string };

export interface LoadedPlayForm {
  game: Game;
  activePlayers: Player[];
  initial: PlayDraftState;
}

export interface PlayFormDeps {
  games: Pick<typeof gameRepository, 'get'>;
  players: Pick<typeof playerRepository, 'getAll' | 'getActive'>;
  plays: Pick<
    typeof playRepository,
    'get' | 'listByGame' | 'create' | 'update'
  >;
  participations: Pick<typeof participationRepository, 'listByPlay'>;
}

const defaultDeps: PlayFormDeps = {
  games: gameRepository,
  players: playerRepository,
  plays: playRepository,
  participations: participationRepository,
};

export async function loadPlayForm(
  screen: PlayFormScreen,
  deps: PlayFormDeps = defaultDeps,
): Promise<LoadedPlayForm | null> {
  if (screen.mode === 'create') {
    const game = await deps.games.get(screen.gameId);
    if (!game) return null;
    const activePlayers = await deps.players.getActive();
    return { game, activePlayers, initial: emptyDraft(game.type, new Date()) };
  }

  const play = await deps.plays.get(screen.playId);
  if (!play) return null;
  const game = await deps.games.get(play.gameId);
  if (!game) return null;
  const [parts, allPlayers, activePlayers] = await Promise.all([
    deps.participations.listByPlay(play.id),
    deps.players.getAll(),
    deps.players.getActive(),
  ]);
  const nameById = new Map(allPlayers.map((p) => [p.id, p.name]));

  const initial: PlayDraftState = {
    gameType: game.type,
    playedAt: play.playedAt,
    note: play.note ?? '',
    coopResult: play.coopResult ?? 'success',
    participants: parts.map((part): DraftParticipant => {
      const name = nameById.get(part.playerId) ?? '';
      return {
        key: crypto.randomUUID(),
        playerId: part.playerId,
        name,
        color: avatarColorForName(name),
        score: part.score,
        isWinner: part.isWinner,
      };
    }),
  };
  return { game, activePlayers, initial };
}

export type SavePlayContext =
  | { mode: 'create'; gameId: string }
  | { mode: 'edit'; gameId: string; playId: string };

/** Persists the draft. Returns the record celebration when one was broken. */
export async function savePlay(
  state: PlayDraftState,
  ctx: SavePlayContext,
  deps: PlayFormDeps = defaultDeps,
): Promise<RecordCelebration | null> {
  const participations: DraftParticipation[] = state.participants.map((p) =>
    p.playerId === null
      ? { name: p.name.trim(), score: p.score, isWinner: p.isWinner }
      : { playerId: p.playerId, score: p.score, isWinner: p.isWinner },
  );

  const isCompetitive = state.gameType === 'competitive';

  // Read the prior record BEFORE writing (on edit this includes the play's old
  // scores), so a beaten record is detected correctly.
  let priorRecordScore: number | null = null;
  if (isCompetitive) {
    const game = await deps.games.get(ctx.gameId);
    const gamePlays = await deps.plays.listByGame(ctx.gameId);
    const allParts = (
      await Promise.all(
        gamePlays.map((pl) => deps.participations.listByPlay(pl.id)),
      )
    ).flat();
    // players=[] is intentional: we only read record.score here; the celebrated
    // holder name is resolved from the draft via recordCelebration below.
    priorRecordScore = game
      ? (competitiveGameStats(game, gamePlays, allParts, []).record?.score ??
        null)
      : null;
  }

  if (ctx.mode === 'create') {
    await deps.plays.create({
      gameId: ctx.gameId,
      playedAt: state.playedAt,
      note: state.note,
      ...(isCompetitive ? {} : { coopResult: state.coopResult }),
      participations,
    });
  } else {
    await deps.plays.update(ctx.playId, {
      playedAt: state.playedAt,
      note: state.note,
      ...(isCompetitive ? {} : { coopResult: state.coopResult }),
      participations,
    });
  }

  if (!isCompetitive) return null;
  return recordCelebration(
    state.participants.map((p) => ({ name: p.name, score: p.score })),
    priorRecordScore,
  );
}
