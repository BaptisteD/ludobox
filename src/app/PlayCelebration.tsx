/**
 * A transient hand-off for the record-celebration toast. The play-form publishes
 * a celebration on save (only when origin === 'game' and a record broke); the
 * Fiche jeu consumes-and-clears it on its next mount. Kept in a ref so publishing
 * never re-renders — the toast appears on the natural remount after the form pops.
 * The default context value is a no-op so screens render fine without the provider
 * (e.g. in isolated unit tests).
 */
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from 'react';

export interface PlayCelebration {
  gameId: string;
  holderName: string;
  score: number;
}

interface PlayCelebrationApi {
  publish: (celebration: PlayCelebration) => void;
  /** Returns and clears the pending celebration when it matches `gameId`. */
  consume: (gameId: string) => PlayCelebration | null;
}

const noop: PlayCelebrationApi = { publish: () => {}, consume: () => null };
const PlayCelebrationContext = createContext<PlayCelebrationApi>(noop);

export function PlayCelebrationProvider({ children }: { children: ReactNode }) {
  const pending = useRef<PlayCelebration | null>(null);
  const publish = useCallback((celebration: PlayCelebration) => {
    pending.current = celebration;
  }, []);
  const consume = useCallback((gameId: string) => {
    if (pending.current && pending.current.gameId === gameId) {
      const c = pending.current;
      pending.current = null;
      return c;
    }
    return null;
  }, []);
  return (
    <PlayCelebrationContext.Provider value={{ publish, consume }}>
      {children}
    </PlayCelebrationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlayCelebration(): PlayCelebrationApi {
  return useContext(PlayCelebrationContext);
}
