/**
 * The navigation shell. Both first-level screens stay mounted at all times
 * (toggled with the `hidden` attribute) so their scroll position survives tab
 * switches and detail dives. The top-of-stack detail renders as an overlay
 * above them. The bottom bar is rendered solely from `bottomBarVisible` — the
 * one centralized "first level only" rule, never decided per screen.
 */
import { BottomBar } from './BottomBar';
import { bottomBarVisible, isFirstLevel } from './navigation/navReducer';
import { useNavigation } from './navigation/useNavigation';
import type { Screen } from './navigation/types';
import { CollectionScreen, GameForm } from '@/features/collection';
import { GameDetail } from '@/features/game';
import { PlayerDetail, PlayersScreen } from '@/features/players';
import { PlaceholderDetail } from './screens/PlaceholderDetail';
import styles from './AppShell.module.css';

/** Maps the top-of-stack detail to its screen component. */
function renderDetail(screen: Screen) {
  switch (screen.kind) {
    case 'game-detail':
      return <GameDetail gameId={screen.id} />;
    case 'game-form':
      return <GameForm mode={screen.mode} gameId={screen.gameId} />;
    case 'player-detail':
      return <PlayerDetail playerId={screen.id} />;
    case 'placeholder-detail':
      return <PlaceholderDetail screen={screen} />;
  }
}

export function AppShell() {
  const { state, selectTab } = useNavigation();
  const atFirstLevel = isFirstLevel(state);
  const topDetail = state.stack.at(-1);

  return (
    <div className={styles.shell} data-testid="app-shell">
      <div className={styles.viewport}>
        {/* First-level screens — always mounted, hidden under a detail. */}
        <div
          className={styles.layer}
          hidden={!atFirstLevel || state.tab !== 'collection'}
        >
          <CollectionScreen
            focusNonce={state.focusNonce.collection}
            scrollResetNonce={state.scrollResetNonce.collection}
          />
        </div>
        <div
          className={styles.layer}
          hidden={!atFirstLevel || state.tab !== 'joueurs'}
        >
          <PlayersScreen
            focusNonce={state.focusNonce.joueurs}
            scrollResetNonce={state.scrollResetNonce.joueurs}
          />
        </div>

        {/* Detail overlay — only the top of the stack is mounted. */}
        {topDetail ? (
          <div
            key={state.stack.length}
            className={`${styles.layer} ${styles.overlay}`}
          >
            {renderDetail(topDetail)}
          </div>
        ) : null}
      </div>

      {bottomBarVisible(state) ? (
        <BottomBar active={state.tab} onSelect={selectTab} />
      ) : null}
    </div>
  );
}
