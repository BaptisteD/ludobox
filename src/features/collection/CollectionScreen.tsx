/**
 * Collection — the first-level list of games (Brique 4), replacing the Brique 3
 * placeholder. Each row is a game vignette (placeholder avatar + name + a
 * read-time play count in a fixed right-aligned slot); tapping it opens the
 * interim game detail. The create CTA opens the shared form. With no game, an
 * inviting empty state takes over. Counts are recomputed on every focus (the
 * project invariant: never stored).
 */
import { useEffect, useRef, useState } from 'react';
import {
  Avatar,
  avatarColorForName,
  Button,
  DiceMotif,
  plural,
  Plus,
  ScreenHeader,
} from '@/ui';
import { useNavigation } from '@/app/navigation/useNavigation';
import { loadCollection, type GameEntry } from './collectionData';
import styles from './CollectionScreen.module.css';

export interface CollectionScreenProps {
  focusNonce: number;
  scrollResetNonce: number;
}

export function CollectionScreen({
  focusNonce,
  scrollResetNonce,
}: CollectionScreenProps) {
  const { push } = useNavigation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<GameEntry[] | null>(null);

  // Recompute-on-read: reload whenever the screen returns to the foreground.
  useEffect(() => {
    let active = true;
    void loadCollection().then((next) => {
      if (active) setEntries(next);
    });
    return () => {
      active = false;
    };
  }, [focusNonce]);

  // Active-tab re-tap: scroll the list back to top.
  useEffect(() => {
    if (scrollResetNonce > 0) scrollRef.current?.scrollTo({ top: 0 });
  }, [scrollResetNonce]);

  const openCreate = () =>
    push({ kind: 'game-form', mode: 'create', id: 'new', depth: 1 });

  const isEmpty = entries !== null && entries.length === 0;

  // Read-time count subtitle (the invariant: never stored) — total plays summed
  // from the per-game counts already loaded. Built only when there are games to
  // count; omitted in the loading/empty states.
  let subtitle: string | undefined;
  if (entries && entries.length > 0) {
    const playTotal = entries.reduce((sum, e) => sum + e.playCount, 0);
    subtitle = `${entries.length} ${plural(entries.length, 'jeu', 'jeux')} · ${playTotal} ${plural(
      playTotal,
      'partie consignée',
      'parties consignées',
    )}`;
  }

  return (
    <div
      ref={scrollRef}
      className={styles.screen}
      data-testid="screen-collection"
    >
      <ScreenHeader title="Collection" subtitle={subtitle} />

      {isEmpty ? (
        <div className={styles.empty}>
          <DiceMotif />
          <h2 className={styles.emptyHeadline}>Aucun jeu pour l’instant</h2>
          <p className={styles.emptyCopy}>
            Ajoute ton premier jeu pour commencer à noter tes parties.
          </p>
          <Button label="Ajouter un jeu" icon={<Plus />} onClick={openCreate} />
        </div>
      ) : (
        <>
          <div className={styles.cta}>
            <Button
              label="Ajouter un jeu"
              icon={<Plus />}
              onClick={openCreate}
            />
          </div>

          <ul className={styles.list}>
            {(entries ?? []).map(({ game, playCount }) => {
              const unit = plural(playCount, 'partie', 'parties');
              return (
                <li key={game.id}>
                  <button
                    type="button"
                    className={styles.row}
                    aria-label={`${game.name}, ${playCount} ${unit}`}
                    onClick={() =>
                      push({ kind: 'game-detail', id: game.id, depth: 1 })
                    }
                  >
                    <Avatar
                      name={game.name}
                      color={avatarColorForName(game.name)}
                      size={48}
                    />
                    <span className={styles.name}>{game.name}</span>
                    <span className={styles.count} aria-hidden="true">
                      <span className={styles.countNum}>{playCount}</span>
                      <span className={styles.countUnit}>{unit}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
