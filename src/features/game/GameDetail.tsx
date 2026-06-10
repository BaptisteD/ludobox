/**
 * Fiche jeu (Brique 6) — the heart of Ludobox, read-only here (logging a play
 * is Brique 7). Top to bottom: header (back + overflow), hero (title, type tag,
 * meta, play count), then either the empty state or the content (add-play CTA,
 * the one stat feature card, the win leaderboard for competitive, and the
 * chronological history). Every figure comes from the pure selectors via
 * `loadGameSheet`; the component does no stat math. The overflow carries the
 * two write actions the spec puts here: « Modifier le jeu » (opens the form)
 * and « Supprimer le jeu » (confirm sheet, cascades to the game's plays).
 */
import { useEffect, useState } from 'react';
import {
  avatarColorForName,
  BottomSheet,
  Button,
  DiceMotif,
  DieGlyph,
  formatHistoryDate,
  HistoryRow,
  LeaderboardRow,
  OverflowMenu,
  Pencil,
  Plus,
  RecordCard,
  SuccessRateCard,
  Tag,
  Toast,
  Trash,
} from '@/ui';
import { gameRepository } from '@/db/gameRepository';
import type { Game } from '@/domain/types';
import { BackHeader } from '@/app/BackHeader';
import { useNavigation } from '@/app/navigation/useNavigation';
import {
  usePlayCelebration,
  type PlayCelebration,
} from '@/app/PlayCelebration';
import { loadGameSheet, toHistoryRow, type GameSheet } from './gameData';
import styles from './GameDetail.module.css';

export interface GameDetailProps {
  gameId: string;
}

function metaLine(game: Game): string | null {
  const parts: string[] = [];
  if (game.minPlayers != null || game.maxPlayers != null) {
    const range =
      game.minPlayers != null && game.maxPlayers != null
        ? `${game.minPlayers}–${game.maxPlayers}`
        : `${game.minPlayers ?? game.maxPlayers}`;
    parts.push(`${range} joueurs`);
  }
  if (game.durationMin != null) parts.push(`${game.durationMin} min`);
  return parts.length ? parts.join(' · ') : null;
}

export function GameDetail({ gameId }: GameDetailProps) {
  const { push, pop, resetToRoot } = useNavigation();
  const { consume } = usePlayCelebration();
  const [sheet, setSheet] = useState<GameSheet | null | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [celebration, setCelebration] = useState<PlayCelebration | null>(null);

  useEffect(() => {
    let active = true;
    void loadGameSheet(gameId).then((next) => {
      if (active) setSheet(next);
    });
    return () => {
      active = false;
    };
  }, [gameId]);

  useEffect(() => {
    const c = consume(gameId);
    if (c) setCelebration(c);
  }, [consume, gameId]);

  // Reachability guard: the game may have been deleted from under us.
  if (sheet === null) {
    return (
      <div className={styles.detail} data-testid="game-detail">
        <BackHeader title="" onBack={pop} />
        <p className={styles.unavailable}>Ce jeu n’est plus disponible.</p>
      </div>
    );
  }

  const name = sheet?.game.name ?? '';

  async function confirmDelete() {
    await gameRepository.remove(gameId);
    resetToRoot();
  }

  function addPlay() {
    push({
      kind: 'play-form',
      mode: 'create',
      gameId,
      origin: 'game',
      id: gameId,
      depth: 2,
    });
  }

  const hasPlays = sheet ? sheet.stats.playCount > 0 : false;

  return (
    <div className={styles.detail} data-testid="game-detail">
      <div className={styles.header}>
        <BackHeader title="" onBack={pop} />
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

      {sheet ? (
        <>
          <header className={styles.hero}>
            <h1 className={styles.title}>{name}</h1>
            <div className={styles.heroMeta}>
              <div className={styles.heroLeft}>
                <Tag
                  type={
                    sheet.type === 'competitive' ? 'competitif' : 'cooperatif'
                  }
                />
                {metaLine(sheet.game) ? (
                  <span className={styles.meta}>{metaLine(sheet.game)}</span>
                ) : null}
              </div>
              {hasPlays ? (
                <div className={styles.count}>
                  <span className={styles.countTop}>
                    <DieGlyph size={22} aria-hidden="true" />
                    <span className={styles.countNumber}>
                      {sheet.stats.playCount}
                    </span>
                  </span>
                  <span className={styles.countLabel}>parties jouées</span>
                </div>
              ) : null}
            </div>
          </header>

          {!hasPlays ? (
            <div className={styles.empty}>
              <DiceMotif />
              <h2 className={styles.emptyTitle}>
                Aucune partie pour l’instant
              </h2>
              <p className={styles.emptyCopy}>
                Consignes ta première soirée. Le record et le classement des
                joueurs apparaîtront ici.
              </p>
              <Button
                label="Ajouter une partie"
                icon={<Plus />}
                className={styles.cta}
                onClick={addPlay}
              />
            </div>
          ) : (
            <>
              <div className={styles.ctaRow}>
                <Button
                  label="Ajouter une partie"
                  icon={<Plus />}
                  className={styles.cta}
                  onClick={addPlay}
                />
              </div>

              {sheet.type === 'competitive' ? (
                sheet.stats.record ? (
                  <RecordCard
                    score={sheet.stats.record.score}
                    holder={sheet.stats.record.holderName}
                    holderColor={avatarColorForName(
                      sheet.stats.record.holderName,
                    )}
                    className={styles.feature}
                  />
                ) : (
                  <p className={styles.recordEmpty}>
                    Pas encore de score enregistré
                  </p>
                )
              ) : (
                <SuccessRateCard
                  wins={sheet.stats.successCount}
                  losses={sheet.stats.failureCount}
                  className={styles.feature}
                />
              )}

              {sheet.type === 'competitive' ? (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>
                    Classement par victoires
                  </h2>
                  <ol className={styles.leaderboard} data-testid="leaderboard">
                    {sheet.stats.ranking.slice(0, 3).map((entry, i) => (
                      <li key={entry.playerId}>
                        <LeaderboardRow
                          rank={i + 1}
                          name={entry.playerName}
                          wins={entry.wins}
                          trophy={i === 0}
                          highlight={i === 0}
                        />
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Dernières parties</h2>
                <ul className={styles.history} data-testid="history">
                  {sheet.history.map((entry) => {
                    const { day, month } = formatHistoryDate(entry.playedAt);
                    const row = toHistoryRow(entry, sheet.type);
                    return (
                      <li key={entry.playId}>
                        <HistoryRow
                          day={day}
                          month={month}
                          {...row}
                          onClick={() =>
                            push({
                              kind: 'play-form',
                              mode: 'edit',
                              playId: entry.playId,
                              origin: 'game',
                              id: entry.playId,
                              depth: 2,
                            })
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              </section>
            </>
          )}
        </>
      ) : null}

      <BottomSheet
        open={confirmOpen}
        icon={<Trash />}
        title={`Supprimer « ${name} » ?`}
        body="Ses parties seront aussi supprimées définitivement."
        actionLabel="Supprimer le jeu"
        onAction={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      {celebration ? (
        <Toast
          name={celebration.holderName}
          avatarColor={avatarColorForName(celebration.holderName)}
          headline={`Nouveau record, ${celebration.holderName}`}
          subline={`Partie enregistrée · ${celebration.score} pts`}
          className={styles.toast}
        />
      ) : null}
    </div>
  );
}
