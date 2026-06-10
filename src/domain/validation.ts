/**
 * Pure validation rules for the domain invariants.
 *
 * Every function here is side-effect free: it takes the relevant raw data plus
 * a candidate and returns a {@link ValidationResult}. The persistence layer is
 * responsible for fetching the data, calling these, and turning a rejection
 * into a thrown {@link DomainError} via {@link assertValid}.
 */
import { normalizeName } from './normalize';
import type {
  CoopResult,
  Game,
  GameType,
  Participation,
  Player,
} from './types';

export type ValidationErrorCode =
  | 'DUPLICATE_GAME_NAME'
  | 'DUPLICATE_PLAYER_NAME'
  | 'GAME_TYPE_LOCKED'
  | 'EMPTY_GAME_NAME'
  | 'MISSING_GAME_TYPE'
  | 'INVALID_PLAYER_COUNT'
  | 'MIN_GREATER_THAN_MAX'
  | 'INVALID_DURATION'
  | 'NO_PARTICIPANTS'
  | 'NO_WINNER'
  | 'INVALID_SCORE'
  | 'COOP_RESULT_ON_COMPETITIVE'
  | 'WINNER_ON_COOPERATIVE'
  | 'SCORE_ON_COOPERATIVE';

export type ValidationResult =
  | { ok: true }
  | { ok: false; code: ValidationErrorCode; message: string };

const ok: ValidationResult = { ok: true };
const fail = (
  code: ValidationErrorCode,
  message: string,
): ValidationResult => ({ ok: false, code, message });

/** A name is unique within a set when no *other* entry normalizes to the same value. */
function hasNameClash(
  name: string,
  entries: { id: string; name: string }[],
  excludeId?: string,
): boolean {
  const target = normalizeName(name);
  return entries.some(
    (entry) => entry.id !== excludeId && normalizeName(entry.name) === target,
  );
}

/** Game names are unique across the whole collection (case/accent-insensitive). */
export function checkGameNameAvailable(
  name: string,
  games: Pick<Game, 'id' | 'name'>[],
  options: { excludeId?: string } = {},
): ValidationResult {
  return hasNameClash(name, games, options.excludeId)
    ? fail('DUPLICATE_GAME_NAME', `A game named "${name}" already exists.`)
    : ok;
}

/**
 * Player names are unique among *active* players only — a name identical to an
 * archived player is allowed.
 */
export function checkPlayerNameAvailable(
  name: string,
  players: Pick<Player, 'id' | 'name' | 'status'>[],
  options: { excludeId?: string } = {},
): ValidationResult {
  const active = players.filter((p) => p.status === 'active');
  return hasNameClash(name, active, options.excludeId)
    ? fail(
        'DUPLICATE_PLAYER_NAME',
        `An active player named "${name}" already exists.`,
      )
    : ok;
}

/** A game's type is immutable once at least one play has been recorded. */
export function checkGameTypeChange(
  currentType: GameType,
  newType: GameType,
  hasExistingPlays: boolean,
): ValidationResult {
  if (newType === currentType || !hasExistingPlays) return ok;
  return fail(
    'GAME_TYPE_LOCKED',
    'The game type cannot change once a play has been recorded.',
  );
}

/**
 * The structural shape of a game form before persistence. `type` is optional
 * because creation starts with no type chosen (it is required to validate).
 */
export interface GameDraft {
  name: string;
  type?: GameType;
  minPlayers?: number;
  maxPlayers?: number;
  durationMin?: number;
}

/**
 * Validates a game form draft (shared by creation and edition), per the
 * formulaire-jeu spec §8: a non-empty name, a chosen type, min ≤ max when both
 * bounds are set, and a strictly-positive integer duration when present. Name
 * uniqueness is a separate, data-dependent check ({@link checkGameNameAvailable}).
 */
export function validateGameDraft(draft: GameDraft): ValidationResult {
  if (draft.name.trim().length === 0) {
    return fail('EMPTY_GAME_NAME', 'A game needs a name.');
  }
  if (draft.type === undefined) {
    return fail('MISSING_GAME_TYPE', 'A game type must be chosen.');
  }
  const isPositiveInt = (n: number) => Number.isInteger(n) && n > 0;
  for (const bound of [draft.minPlayers, draft.maxPlayers]) {
    if (bound !== undefined && !isPositiveInt(bound)) {
      return fail(
        'INVALID_PLAYER_COUNT',
        'Player counts must be positive whole numbers.',
      );
    }
  }
  if (
    draft.minPlayers !== undefined &&
    draft.maxPlayers !== undefined &&
    draft.minPlayers > draft.maxPlayers
  ) {
    return fail(
      'MIN_GREATER_THAN_MAX',
      'The minimum cannot exceed the maximum.',
    );
  }
  if (draft.durationMin !== undefined && !isPositiveInt(draft.durationMin)) {
    return fail(
      'INVALID_DURATION',
      'Duration must be a positive whole number.',
    );
  }
  return ok;
}

export interface PlayDraft {
  gameType: GameType;
  coopResult?: CoopResult;
  participations: Pick<Participation, 'score' | 'isWinner'>[];
}

/** Validates a play against its game's type (competitive vs cooperative rules). */
export function validatePlay(draft: PlayDraft): ValidationResult {
  if (draft.participations.length === 0) {
    return fail('NO_PARTICIPANTS', 'A play needs at least one participant.');
  }
  return draft.gameType === 'competitive'
    ? validateCompetitive(draft)
    : validateCooperative(draft);
}

function validateCompetitive(draft: PlayDraft): ValidationResult {
  if (draft.coopResult !== undefined) {
    return fail(
      'COOP_RESULT_ON_COMPETITIVE',
      'A competitive play has no collective result.',
    );
  }
  if (!draft.participations.some((p) => p.isWinner)) {
    return fail('NO_WINNER', 'A competitive play needs at least one winner.');
  }
  const invalidScore = draft.participations.some(
    (p) => p.score !== null && !Number.isInteger(p.score),
  );
  if (invalidScore) {
    return fail('INVALID_SCORE', 'Scores must be whole numbers or left empty.');
  }
  return ok;
}

function validateCooperative(draft: PlayDraft): ValidationResult {
  if (draft.participations.some((p) => p.isWinner)) {
    return fail(
      'WINNER_ON_COOPERATIVE',
      'A cooperative play has no individual winners.',
    );
  }
  if (draft.participations.some((p) => p.score !== null)) {
    return fail(
      'SCORE_ON_COOPERATIVE',
      'A cooperative play has no individual scores.',
    );
  }
  return ok;
}

/** Thrown by the persistence layer when a validation rule rejects an operation. */
export class DomainError extends Error {
  constructor(
    public readonly code: ValidationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

/** Bridges pure validation into the throwing world of repositories. */
export function assertValid(result: ValidationResult): void {
  if (!result.ok) throw new DomainError(result.code, result.message);
}
