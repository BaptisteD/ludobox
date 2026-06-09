/**
 * Navigation model (Brique 3). Pure data — no React, no rendering.
 *
 * Two first-level destinations (the bottom-bar tabs) each sit under a single
 * stack of detail screens. Tab switching is only reachable at first level
 * (empty stack), so one stack covering the active tab is enough.
 */

/** A first-level destination — one of the two bottom-bar entries. */
export type Tab = 'collection' | 'joueurs';

/**
 * A detail screen stacked over the current tab's first level. Brique 3 only
 * needs a placeholder kind to exercise the mechanics; briques 4–7 add real
 * kinds (game-detail, player-detail, play-detail, forms…).
 */
export interface Screen {
  kind: 'placeholder-detail';
  /** Identity of the underlying object (a game/player id later). */
  id: string;
  /** Depth in the stack, 1-based — purely for placeholder display. */
  depth: number;
}

export interface NavState {
  /** The active first-level destination. */
  tab: Tab;
  /** Details stacked over the current tab's first level (empty = first level). */
  stack: Screen[];
  /**
   * Bumped whenever a tab's first-level screen returns to the foreground
   * (detail popped away, or tab switched to). First-level screens read it to
   * recompute their content on read (the project invariant: never store stats).
   */
  focusNonce: Record<Tab, number>;
  /**
   * Bumped when the already-active tab is re-tapped at first level. The
   * matching first-level screen scrolls its list back to the top.
   */
  scrollResetNonce: Record<Tab, number>;
}

export type NavAction =
  | { type: 'PUSH'; screen: Screen }
  | { type: 'POP' }
  | { type: 'SELECT_TAB'; tab: Tab }
  | { type: 'RESET_TO_ROOT' };
