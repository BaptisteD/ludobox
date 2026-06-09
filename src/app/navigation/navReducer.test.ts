import { describe, expect, it } from 'vitest';
import {
  bottomBarVisible,
  initialNavState,
  isFirstLevel,
  navReducer,
} from './navReducer';
import type { NavState, Screen } from './types';

const detail = (depth: number): Screen => ({
  kind: 'placeholder-detail',
  id: `obj-${depth}`,
  depth,
});

/** Replay a list of actions from a starting state. */
function run(
  state: NavState,
  ...actions: Parameters<typeof navReducer>[1][]
): NavState {
  return actions.reduce(navReducer, state);
}

describe('navReducer', () => {
  it('launches on Collection at first level', () => {
    expect(initialNavState.tab).toBe('collection');
    expect(isFirstLevel(initialNavState)).toBe(true);
    expect(bottomBarVisible(initialNavState)).toBe(true);
  });

  it('PUSH then POP returns to the prior screen (pop one level)', () => {
    const pushed = navReducer(initialNavState, {
      type: 'PUSH',
      screen: detail(1),
    });
    expect(pushed.stack).toHaveLength(1);
    const popped = navReducer(pushed, { type: 'POP' });
    expect(popped.stack).toHaveLength(0);
    expect(isFirstLevel(popped)).toBe(true);
  });

  it('unwinds a multi-level stack one cran at a time', () => {
    const deep = run(
      initialNavState,
      { type: 'PUSH', screen: detail(1) },
      { type: 'PUSH', screen: detail(2) },
      { type: 'PUSH', screen: detail(3) },
    );
    expect(deep.stack.map((s) => s.depth)).toEqual([1, 2, 3]);

    const up1 = navReducer(deep, { type: 'POP' });
    expect(up1.stack.map((s) => s.depth)).toEqual([1, 2]);
    const up2 = navReducer(up1, { type: 'POP' });
    expect(up2.stack.map((s) => s.depth)).toEqual([1]);
  });

  it('shows the bottom bar only when the stack is empty', () => {
    expect(bottomBarVisible(initialNavState)).toBe(true);
    const pushed = navReducer(initialNavState, {
      type: 'PUSH',
      screen: detail(1),
    });
    expect(bottomBarVisible(pushed)).toBe(false);
    const popped = navReducer(pushed, { type: 'POP' });
    expect(bottomBarVisible(popped)).toBe(true);
  });

  it('bumps focusNonce only on the POP that returns to first level (recompute)', () => {
    const deep = run(
      initialNavState,
      { type: 'PUSH', screen: detail(1) },
      { type: 'PUSH', screen: detail(2) },
    );
    const up1 = navReducer(deep, { type: 'POP' }); // still in a detail
    expect(up1.focusNonce.collection).toBe(
      initialNavState.focusNonce.collection,
    );
    const up2 = navReducer(up1, { type: 'POP' }); // back to first level
    expect(up2.focusNonce.collection).toBe(
      initialNavState.focusNonce.collection + 1,
    );
  });

  it('POP on an empty stack is a no-op', () => {
    expect(navReducer(initialNavState, { type: 'POP' })).toBe(initialNavState);
  });

  describe('SELECT_TAB', () => {
    it('switches space at first level and recomputes the target tab', () => {
      const next = navReducer(initialNavState, {
        type: 'SELECT_TAB',
        tab: 'joueurs',
      });
      expect(next.tab).toBe('joueurs');
      expect(next.focusNonce.joueurs).toBe(
        initialNavState.focusNonce.joueurs + 1,
      );
      expect(next.scrollResetNonce.joueurs).toBe(
        initialNavState.scrollResetNonce.joueurs,
      );
    });

    it('is not reachable from a detail screen', () => {
      const inDetail = navReducer(initialNavState, {
        type: 'PUSH',
        screen: detail(1),
      });
      const attempt = navReducer(inDetail, {
        type: 'SELECT_TAB',
        tab: 'joueurs',
      });
      expect(attempt).toBe(inDetail);
      expect(attempt.tab).toBe('collection');
    });

    it('re-tap of the active tab bumps scrollResetNonce, not the tab', () => {
      const next = navReducer(initialNavState, {
        type: 'SELECT_TAB',
        tab: 'collection',
      });
      expect(next.tab).toBe('collection');
      expect(next.scrollResetNonce.collection).toBe(
        initialNavState.scrollResetNonce.collection + 1,
      );
      expect(next.focusNonce.collection).toBe(
        initialNavState.focusNonce.collection,
      );
    });
  });

  describe('RESET_TO_ROOT', () => {
    it('clears a deep stack and recomputes (deleted/archived-object return)', () => {
      const deep = run(
        initialNavState,
        { type: 'PUSH', screen: detail(1) },
        { type: 'PUSH', screen: detail(2) },
      );
      const reset = navReducer(deep, { type: 'RESET_TO_ROOT' });
      expect(reset.stack).toHaveLength(0);
      expect(isFirstLevel(reset)).toBe(true);
      expect(reset.focusNonce.collection).toBe(
        initialNavState.focusNonce.collection + 1,
      );
    });

    it('is a no-op already at first level', () => {
      expect(navReducer(initialNavState, { type: 'RESET_TO_ROOT' })).toBe(
        initialNavState,
      );
    });
  });
});
