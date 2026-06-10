import { describe, expect, it } from 'vitest';
import {
  emptyDraft,
  fromDateInputValue,
  isDirty,
  playDraftReducer,
  selectValidity,
  toDateInputValue,
  type DraftParticipant,
  type PlayDraftState,
} from './playDraft';

const participant = (
  over: Partial<DraftParticipant> = {},
): DraftParticipant => ({
  key: 'k1',
  playerId: 'p1',
  name: 'Léa',
  color: 'teal',
  score: null,
  isWinner: false,
  ...over,
});

describe('playDraftReducer', () => {
  it('adds and removes participants by key', () => {
    let s = emptyDraft('competitive', new Date(2026, 5, 10));
    s = playDraftReducer(s, {
      type: 'ADD_PARTICIPANT',
      participant: participant(),
    });
    expect(s.participants).toHaveLength(1);
    s = playDraftReducer(s, { type: 'REMOVE_PARTICIPANT', key: 'k1' });
    expect(s.participants).toHaveLength(0);
  });

  it('sets score and toggles winner on the targeted participant only', () => {
    let s = emptyDraft('competitive', new Date(2026, 5, 10));
    s = playDraftReducer(s, {
      type: 'ADD_PARTICIPANT',
      participant: participant(),
    });
    s = playDraftReducer(s, {
      type: 'ADD_PARTICIPANT',
      participant: participant({ key: 'k2', playerId: 'p2', name: 'Tom' }),
    });
    s = playDraftReducer(s, { type: 'SET_SCORE', key: 'k2', score: 7 });
    s = playDraftReducer(s, { type: 'TOGGLE_WINNER', key: 'k2', on: true });
    expect(s.participants.find((p) => p.key === 'k1')).toMatchObject({
      score: null,
      isWinner: false,
    });
    expect(s.participants.find((p) => p.key === 'k2')).toMatchObject({
      score: 7,
      isWinner: true,
    });
  });

  it('sets the coop result and the note', () => {
    let s = emptyDraft('cooperative', new Date(2026, 5, 10));
    s = playDraftReducer(s, { type: 'SET_COOP_RESULT', result: 'failure' });
    s = playDraftReducer(s, { type: 'SET_NOTE', note: 'serré' });
    expect(s.coopResult).toBe('failure');
    expect(s.note).toBe('serré');
  });

  it('replaces the whole state (used to seed an edit draft)', () => {
    const seeded: PlayDraftState = {
      gameType: 'cooperative',
      playedAt: new Date(2026, 0, 2),
      note: 'x',
      coopResult: 'failure',
      participants: [participant()],
    };
    const out = playDraftReducer(
      emptyDraft('competitive', new Date(2026, 5, 10)),
      {
        type: 'REPLACE',
        state: seeded,
      },
    );
    expect(out).toEqual(seeded);
  });
});

describe('selectValidity', () => {
  it('competitive: invalid with no participant, then no winner, then valid', () => {
    let s = emptyDraft('competitive', new Date(2026, 5, 10));
    expect(selectValidity(s).ok).toBe(false); // NO_PARTICIPANTS
    s = playDraftReducer(s, {
      type: 'ADD_PARTICIPANT',
      participant: participant(),
    });
    expect(selectValidity(s)).toMatchObject({ ok: false, code: 'NO_WINNER' });
    s = playDraftReducer(s, { type: 'TOGGLE_WINNER', key: 'k1', on: true });
    expect(selectValidity(s).ok).toBe(true);
  });

  it('cooperative: valid as soon as there is one participant', () => {
    let s = emptyDraft('cooperative', new Date(2026, 5, 10));
    expect(selectValidity(s).ok).toBe(false);
    s = playDraftReducer(s, {
      type: 'ADD_PARTICIPANT',
      participant: participant(),
    });
    expect(selectValidity(s).ok).toBe(true);
  });
});

describe('isDirty', () => {
  it('is false against an identical snapshot and true after any change', () => {
    const initial = emptyDraft('competitive', new Date(2026, 5, 10));
    expect(isDirty(initial, initial)).toBe(false);
    const changed = playDraftReducer(initial, {
      type: 'ADD_PARTICIPANT',
      participant: participant(),
    });
    expect(isDirty(initial, changed)).toBe(true);
  });

  it('marks a cooperative draft dirty when the collective result changes', () => {
    const initial = emptyDraft('cooperative', new Date(2026, 5, 10));
    const changed = playDraftReducer(initial, {
      type: 'SET_COOP_RESULT',
      result: 'failure',
    });
    expect(isDirty(initial, changed)).toBe(true);
  });

  it('ignores participant order and same-day date edits', () => {
    const base = emptyDraft('competitive', new Date(2026, 5, 10, 8));
    const a = playDraftReducer(
      playDraftReducer(base, {
        type: 'ADD_PARTICIPANT',
        participant: participant({ key: 'k1', playerId: 'p1', name: 'A' }),
      }),
      {
        type: 'ADD_PARTICIPANT',
        participant: participant({ key: 'k2', playerId: 'p2', name: 'B' }),
      },
    );
    const b = playDraftReducer(
      playDraftReducer(
        playDraftReducer(base, {
          type: 'ADD_PARTICIPANT',
          participant: participant({ key: 'k2', playerId: 'p2', name: 'B' }),
        }),
        {
          type: 'ADD_PARTICIPANT',
          participant: participant({ key: 'k1', playerId: 'p1', name: 'A' }),
        },
      ),
      { type: 'SET_DATE', date: new Date(2026, 5, 10, 22) },
    );
    expect(isDirty(a, b)).toBe(false);
  });
});

describe('date input helpers', () => {
  it('round-trips a local date through the yyyy-mm-dd input format', () => {
    const d = new Date(2026, 5, 7); // 7 June 2026, local
    expect(toDateInputValue(d)).toBe('2026-06-07');
    expect(toDateInputValue(fromDateInputValue('2026-06-07'))).toBe(
      '2026-06-07',
    );
  });
});
