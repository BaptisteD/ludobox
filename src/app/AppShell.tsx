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
import { CollectionScreen } from './screens/CollectionScreen';
import { JoueursScreen } from './screens/JoueursScreen';
import { PlaceholderDetail } from './screens/PlaceholderDetail';
import styles from './AppShell.module.css';

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
          <JoueursScreen
            focusNonce={state.focusNonce.joueurs}
            scrollResetNonce={state.scrollResetNonce.joueurs}
          />
        </div>

        {/* Detail overlay — only the top of the stack is mounted. */}
        {topDetail ? (
          <div className={`${styles.layer} ${styles.overlay}`}>
            <PlaceholderDetail key={state.stack.length} screen={topDetail} />
          </div>
        ) : null}
      </div>

      {bottomBarVisible(state) ? (
        <BottomBar active={state.tab} onSelect={selectTab} />
      ) : null}
    </div>
  );
}
