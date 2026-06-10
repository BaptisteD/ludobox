/**
 * The navigation context value and React context object, kept in their own
 * module so `NavigationProvider` (component) and `useNavigation` (hook) can
 * share them without a circular import, and so fast-refresh stays happy
 * (provider file exports only the component).
 */
import { createContext } from 'react';
import type { NavState, Screen, Tab } from './types';

/** A guard the play-form registers to intercept back navigation while dirty. */
export interface BackGuard {
  /** True ⇒ block the back and call onBlocked instead of popping. */
  shouldBlock: () => boolean;
  onBlocked: () => void;
}

export interface NavigationApi {
  state: NavState;
  /** Open a detail over the current tab's first level. */
  push: (screen: Screen) => void;
  /** Pop one cran (back to the calling screen). */
  pop: () => void;
  /** Switch space at first level, or re-tap the active tab to scroll to top. */
  selectTab: (tab: Tab) => void;
  /** Drop the whole stack — return from a deleted/archived object. */
  resetToRoot: () => void;
  /** Register a back guard. Returns an unregister fn. Only one guard at a time. */
  registerBackGuard: (guard: BackGuard) => () => void;
}

export const NavigationContext = createContext<NavigationApi | null>(null);
