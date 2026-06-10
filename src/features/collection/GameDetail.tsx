/**
 * Interim game detail (Brique 4). The Fiche jeu proper arrives in Brique 6; for
 * now this minimal host carries the name and the overflow actions the spec puts
 * on the game sheet: « Modifier le jeu » (opens the form) and « Supprimer le
 * jeu » (a confirm bottom sheet that cascades to the game's plays). Deleting
 * drops the whole stack back to the list via `resetToRoot`.
 */
import { useEffect, useState } from 'react';
import { BottomSheet, OverflowMenu, Pencil, Trash } from '@/ui';
import { gameRepository } from '@/db/gameRepository';
import type { Game } from '@/domain/types';
import { BackHeader } from '@/app/BackHeader';
import { useNavigation } from '@/app/navigation/useNavigation';
import styles from './GameDetail.module.css';

export interface GameDetailProps {
  gameId: string;
}

export function GameDetail({ gameId }: GameDetailProps) {
  const { push, pop, resetToRoot } = useNavigation();
  const [game, setGame] = useState<Game | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void gameRepository.get(gameId).then((g) => {
      if (active) setGame(g);
    });
    return () => {
      active = false;
    };
  }, [gameId]);

  const name = game?.name ?? '';

  async function confirmDelete() {
    await gameRepository.remove(gameId);
    resetToRoot();
  }

  return (
    <div className={styles.detail} data-testid="game-detail">
      <div className={styles.header}>
        <BackHeader title={name} onBack={pop} />
        <button
          type="button"
          className={styles.options}
          aria-label="Options du jeu"
          aria-haspopup="menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">⋮</span>
        </button>
        {menuOpen ? (
          <OverflowMenu
            className={styles.menu}
            items={[
              {
                label: 'Modifier le jeu',
                icon: <Pencil />,
                onSelect: () => {
                  setMenuOpen(false);
                  push({
                    kind: 'game-form',
                    mode: 'edit',
                    gameId,
                    id: gameId,
                    depth: 2,
                  });
                },
              },
              {
                label: 'Supprimer le jeu',
                icon: <Trash />,
                tone: 'destructive',
                onSelect: () => {
                  setMenuOpen(false);
                  setConfirmOpen(true);
                },
              },
            ]}
          />
        ) : null}
      </div>

      <BottomSheet
        open={confirmOpen}
        icon={<Trash />}
        title={`Supprimer « ${name} » ?`}
        body="Ses parties seront aussi supprimées définitivement."
        actionLabel="Supprimer le jeu"
        onAction={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
