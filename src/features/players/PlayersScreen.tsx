/**
 * Joueurs — the first-level list of active players (Brique 5), replacing the
 * Brique 3 placeholder. Each row is a player vignette (avatar + name + a
 * read-time play count in a fixed right-aligned slot); tapping it opens the
 * fiche joueur. There is no per-row archive action (archive lives on the fiche,
 * PRD fiche-joueur v2 §4.4). The create CTA opens a light bottom-sheet form.
 * With no player, an inviting empty state takes over. Counts are recomputed on
 * every focus (the project invariant: never stored).
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
import { AddPlayerSheet } from './AddPlayerSheet';
import { loadPlayers, type PlayerEntry } from './playersData';
import styles from './PlayersScreen.module.css';

export interface PlayersScreenProps {
  focusNonce: number;
  scrollResetNonce: number;
}

export function PlayersScreen({
  focusNonce,
  scrollResetNonce,
}: PlayersScreenProps) {
  const { push } = useNavigation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<PlayerEntry[] | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [creating, setCreating] = useState(false);

  // Recompute-on-read: reload on focus or after a local mutation (create).
  useEffect(() => {
    let active = true;
    void loadPlayers().then((next) => {
      if (active) setEntries(next);
    });
    return () => {
      active = false;
    };
  }, [focusNonce, reloadNonce]);

  // Active-tab re-tap: scroll the list back to top.
  useEffect(() => {
    if (scrollResetNonce > 0) scrollRef.current?.scrollTo({ top: 0 });
  }, [scrollResetNonce]);

  const isEmpty = entries !== null && entries.length === 0;

  // Count subtitle, shown only when there are active players to count.
  const subtitle =
    entries && entries.length > 0
      ? `${entries.length} ${plural(entries.length, 'joueur actif', 'joueurs actifs')}`
      : undefined;

  function handleCreated() {
    setCreating(false);
    setReloadNonce((n) => n + 1);
  }

  return (
    <div ref={scrollRef} className={styles.screen} data-testid="screen-joueurs">
      <ScreenHeader title="Joueurs" subtitle={subtitle} />

      {isEmpty ? (
        <div className={styles.empty}>
          <DiceMotif />
          <h2 className={styles.emptyHeadline}>Aucun joueur pour l’instant</h2>
          <p className={styles.emptyCopy}>
            Ajoute un joueur pour le retrouver dans tes parties.
          </p>
          <Button
            label="Ajouter un joueur"
            icon={<Plus />}
            onClick={() => setCreating(true)}
          />
        </div>
      ) : (
        <>
          <div className={styles.cta}>
            <Button
              label="Ajouter un joueur"
              icon={<Plus />}
              onClick={() => setCreating(true)}
            />
          </div>

          <ul className={styles.list}>
            {(entries ?? []).map(({ player, playCount }) => {
              const unit = plural(playCount, 'partie', 'parties');
              return (
                <li key={player.id}>
                  <button
                    type="button"
                    className={styles.row}
                    aria-label={`${player.name}, ${playCount} ${unit}`}
                    onClick={() =>
                      push({ kind: 'player-detail', id: player.id, depth: 1 })
                    }
                  >
                    <Avatar
                      name={player.name}
                      color={avatarColorForName(player.name)}
                      size={48}
                    />
                    <span className={styles.name}>{player.name}</span>
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

      <AddPlayerSheet
        open={creating}
        onCreated={handleCreated}
        onCancel={() => setCreating(false)}
      />
    </div>
  );
}
