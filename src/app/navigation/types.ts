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
 * A detail screen stacked over the current tab's first level. Brique 3 added the
 * placeholder kind to exercise the mechanics; briques 4–7 add the real kinds
 * (game detail/form here, player and play screens later). Every variant carries
 * `id` (the underlying object) and `depth` (1-based, cosmetic — the reducer only
 * stacks by array order, never by this field).
 */
export type Screen =
  | { kind: 'placeholder-detail'; id: string; depth: number }
  | { kind: 'game-detail'; id: string; depth: number }
  | {
      kind: 'game-form';
      mode: 'create' | 'edit';
      /** Present in edit mode — the game being edited. */
      gameId?: string;
      id: string;
      depth: number;
    }
  | { kind: 'player-detail'; id: string; depth: number };

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
