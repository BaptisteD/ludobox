/**
 * Pure draft model for the Fiche partie — state, reducer, validity, dirtiness,
 * and date-input helpers. No React, no persistence: trivially unit-testable.
 * Competitive participants carry score/winner; cooperative ones leave them at
 * null/false and the play carries a collective result instead.
 */
import type { AvatarColor } from '@/ui';
import { validatePlay, type ValidationResult } from '@/domain/validation';
import type { CoopResult, GameType } from '@/domain/types';

export interface DraftParticipant {
  /** Stable local key for React lists and targeted updates. */
  key: string;
  /** null ⇒ a new player created on save (on-the-fly). */
  playerId: string | null;
  name: string;
  color: AvatarColor;
  /** Integer or null (not entered). Competitive only; always null for coop. */
  score: number | null;
  isWinner: boolean;
}

export interface PlayDraftState {
  gameType: GameType;
  playedAt: Date;
  note: string;
  /** Collective result (cooperative only); defaults to 'success'. */
  coopResult: CoopResult;
  participants: DraftParticipant[];
}

export type PlayDraftAction =
  | { type: 'SET_DATE'; date: Date }
  | { type: 'SET_NOTE'; note: string }
  | { type: 'SET_COOP_RESULT'; result: CoopResult }
  | { type: 'ADD_PARTICIPANT'; participant: DraftParticipant }
  | { type: 'REMOVE_PARTICIPANT'; key: string }
  | { type: 'SET_SCORE'; key: string; score: number | null }
  | { type: 'TOGGLE_WINNER'; key: string; on: boolean }
  | { type: 'REPLACE'; state: PlayDraftState };

export function emptyDraft(gameType: GameType, playedAt: Date): PlayDraftState {
  return {
    gameType,
    playedAt,
    note: '',
    coopResult: 'success',
    participants: [],
  };
}

const mapParticipant = (
  state: PlayDraftState,
  key: string,
  fn: (p: DraftParticipant) => DraftParticipant,
): PlayDraftState => ({
  ...state,
  participants: state.participants.map((p) => (p.key === key ? fn(p) : p)),
});

export function playDraftReducer(
  state: PlayDraftState,
  action: PlayDraftAction,
): PlayDraftState {
  switch (action.type) {
    case 'REPLACE':
      return action.state;
    case 'SET_DATE':
      return { ...state, playedAt: action.date };
    case 'SET_NOTE':
      return { ...state, note: action.note };
    case 'SET_COOP_RESULT':
      return { ...state, coopResult: action.result };
    case 'ADD_PARTICIPANT':
      return {
        ...state,
        participants: [...state.participants, action.participant],
      };
    case 'REMOVE_PARTICIPANT':
      return {
        ...state,
        participants: state.participants.filter((p) => p.key !== action.key),
      };
    case 'SET_SCORE':
      return mapParticipant(state, action.key, (p) => ({
        ...p,
        score: action.score,
      }));
    case 'TOGGLE_WINNER':
      return mapParticipant(state, action.key, (p) => ({
        ...p,
        isWinner: action.on,
      }));
    default:
      return state;
  }
}

/** Validity delegated to the domain (§8.1–8.3). */
export function selectValidity(state: PlayDraftState): ValidationResult {
  return validatePlay({
    gameType: state.gameType,
    coopResult: state.gameType === 'cooperative' ? state.coopResult : undefined,
    participations: state.participants.map((p) => ({
      score: p.score,
      isWinner: p.isWinner,
    })),
  });
}

/** A stable, order-insensitive projection for change detection. */
function serialize(state: PlayDraftState): string {
  const participants = state.participants
    .map((p) => ({
      who: p.playerId ?? `new:${p.name.trim().toLowerCase()}`,
      ...(state.gameType === 'competitive'
        ? { score: p.score, isWinner: p.isWinner }
        : {}),
    }))
    .sort((a, b) => a.who.localeCompare(b.who));
  return JSON.stringify({
    playedAt: toDateInputValue(state.playedAt),
    note: state.note.trim(),
    coopResult: state.gameType === 'cooperative' ? state.coopResult : null,
    participants,
  });
}

/** True when `current` differs from the snapshot taken at open (US9). */
export function isDirty(
  initial: PlayDraftState,
  current: PlayDraftState,
): boolean {
  return serialize(initial) !== serialize(current);
}

const pad = (n: number): string => String(n).padStart(2, '0');

/** Local Date → 'yyyy-mm-dd' for a native date input. */
export function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * 'yyyy-mm-dd' → local Date at midnight (no UTC drift). The caller (the date
 * input) always passes a non-empty value — it guards the cleared-field case —
 * so no empty/malformed handling is needed here.
 */
export function fromDateInputValue(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}
