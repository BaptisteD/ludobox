/**
 * The navigation reducer — the single source of truth for the nav stack.
 * Pure and independently testable (no React, no history API): the provider in
 * `NavigationProvider.tsx` wires it to React and the browser history.
 */
import type { NavAction, NavState, Tab } from './types';

export const initialNavState: NavState = {
  tab: 'collection',
  stack: [],
  focusNonce: { collection: 0, joueurs: 0 },
  scrollResetNonce: { collection: 0, joueurs: 0 },
};

/** True when the active tab shows its first-level screen (no detail open). */
export function isFirstLevel(state: NavState): boolean {
  return state.stack.length === 0;
}

/**
 * The single centralized rule: the bottom bar is rendered only at first level.
 * `AppShell` consumes this selector; no screen re-implements the rule.
 */
export function bottomBarVisible(state: NavState): boolean {
  return isFirstLevel(state);
}

function bump(record: Record<Tab, number>, tab: Tab): Record<Tab, number> {
  return { ...record, [tab]: record[tab] + 1 };
}

export function navReducer(state: NavState, action: NavAction): NavState {
  switch (action.type) {
    case 'PUSH':
      return { ...state, stack: [...state.stack, action.screen] };

    case 'POP': {
      if (state.stack.length === 0) return state;
      const stack = state.stack.slice(0, -1);
      // Returning to first level recomputes the foreground screen on read.
      const focusNonce =
        stack.length === 0
          ? bump(state.focusNonce, state.tab)
          : state.focusNonce;
      return { ...state, stack, focusNonce };
    }

    case 'SELECT_TAB': {
      // Tab switching is only reachable at first level (empty stack).
      if (!isFirstLevel(state)) return state;
      if (action.tab === state.tab) {
        // Re-tap of the active tab → scroll its list to top (non-destructive).
        return {
          ...state,
          scrollResetNonce: bump(state.scrollResetNonce, state.tab),
        };
      }
      // Arriving at the other first-level screen recomputes it on read.
      return {
        ...state,
        tab: action.tab,
        focusNonce: bump(state.focusNonce, action.tab),
      };
    }

    case 'RESET_TO_ROOT':
      // Return from a deleted/archived object: drop the whole stack, recompute.
      if (state.stack.length === 0) return state;
      return {
        ...state,
        stack: [],
        focusNonce: bump(state.focusNonce, state.tab),
      };

    default:
      return state;
  }
}
