/**
 * Wires the pure {@link navReducer} to React and the browser history so the
 * Android system back gesture (and the desktop back button) map onto the same
 * one-cran back as the in-app back affordance.
 *
 * History strategy: one history entry per detail depth. `push` adds an entry;
 * `pop` delegates to `history.back()`; a single `popstate` listener dispatches
 * POP, so system-back and button-back share one path. `resetToRoot` rewinds
 * the history entries it created and lets the trailing POP no-op on the (now
 * empty) stack.
 */
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import {
  NavigationContext,
  type NavigationApi,
  type BackGuard,
} from './NavigationContext';
import { initialNavState, navReducer } from './navReducer';
import type { Screen, Tab } from './types';

interface HistoryEntryState {
  navDepth: number;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(navReducer, initialNavState);

  // Latest stack depth, readable synchronously inside event handlers.
  const depthRef = useRef(state.stack.length);
  depthRef.current = state.stack.length;

  const guardRef = useRef<BackGuard | null>(null);

  useEffect(() => {
    // Anchor the root entry at depth 0 so the first back lands here.
    window.history.replaceState(
      { navDepth: 0 } satisfies HistoryEntryState,
      '',
    );
    const onPopState = () => {
      const guard = guardRef.current;
      if (guard && guard.shouldBlock()) {
        // Cancel the back: re-anchor a history entry at the current depth.
        window.history.pushState(
          { navDepth: depthRef.current } satisfies HistoryEntryState,
          '',
        );
        guard.onBlocked();
        return;
      }
      dispatch({ type: 'POP' });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const push = useCallback((screen: Screen) => {
    const navDepth = depthRef.current + 1;
    window.history.pushState({ navDepth } satisfies HistoryEntryState, '');
    dispatch({ type: 'PUSH', screen });
  }, []);

  // Back delegates to history; the popstate listener performs the POP.
  const pop = useCallback(() => {
    if (depthRef.current > 0) window.history.back();
  }, []);

  const selectTab = useCallback(
    (tab: Tab) => dispatch({ type: 'SELECT_TAB', tab }),
    [],
  );

  const resetToRoot = useCallback(() => {
    const depth = depthRef.current;
    dispatch({ type: 'RESET_TO_ROOT' });
    // Rewind the entries this stack created; the resulting popstate POPs a
    // stack that is already empty (a harmless no-op) but realigns history.
    if (depth > 0) window.history.go(-depth);
  }, []);

  const registerBackGuard = useCallback((guard: BackGuard) => {
    guardRef.current = guard;
    return () => {
      if (guardRef.current === guard) guardRef.current = null;
    };
  }, []);

  const api: NavigationApi = {
    state,
    push,
    pop,
    selectTab,
    resetToRoot,
    registerBackGuard,
  };
  return (
    <NavigationContext.Provider value={api}>
      {children}
    </NavigationContext.Provider>
  );
}
