/**
 * Fiche joueur (Brique 5) — a read-only screen for an active player: identity
 * masthead, two-up counters (parties · victoires, the latter competitive-only),
 * and the cross-game history newest-first. The header overflow carries the two
 * write actions the spec puts here: « Renommer » (inline editor) and
 * « Supprimer le joueur » (archive, via a confirm sheet). Everything is
 * recomputed at read time. Tapping a history row to open the Fiche partie is a
 * Brique 7 dependency — rows are read-only for now.
 */
import { useEffect, useState, type FormEvent } from 'react';
import {
  Avatar,
  avatarColorForName,
  BottomSheet,
  Button,
  Check,
  DiceMotif,
  HistoryRow,
  OverflowMenu,
  Pencil,
  StatSummary,
  TextField,
  Trash,
  type ResultKind,
} from '@/ui';
import { playerRepository } from '@/db/playerRepository';
import { DomainError } from '@/domain/validation';
import { BackHeader } from '@/app/BackHeader';
import { useNavigation } from '@/app/navigation/useNavigation';
import {
  formatHistoryDate,
  loadPlayerSheet,
  type PlayerSheet,
} from './playersData';
import { playerErrorMessage } from './playerMessages';
import styles from './PlayerDetail.module.css';

export interface PlayerDetailProps {
  playerId: string;
}

function resultOf(entry: PlayerSheet['history'][number]): ResultKind {
  if (entry.gameType === 'competitive') {
    return entry.isWinner ? 'victoire' : 'defaite';
  }
  return entry.coopResult === 'success' ? 'succes' : 'echec';
}

export function PlayerDetail({ playerId }: PlayerDetailProps) {
  const { push, pop, resetToRoot } = useNavigation();
  const [sheet, setSheet] = useState<PlayerSheet | null | undefined>(undefined);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameName, setRenameName] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void loadPlayerSheet(playerId).then((next) => {
      if (active) setSheet(next);
    });
    return () => {
      active = false;
    };
  }, [playerId, reloadNonce]);

  // Reachability guard: the fiche only exists for active players (PRD §10).
  if (sheet === null) {
    return (
      <div className={styles.detail} data-testid="player-detail">
        <BackHeader title="" onBack={pop} />
        <p className={styles.unavailable}>Ce joueur n’est plus disponible.</p>
      </div>
    );
  }

  const name = sheet?.player.name ?? '';

  function startRename() {
    setMenuOpen(false);
    setRenameName(name);
    setRenameError(null);
    setRenaming(true);
  }

  async function submitRename(event: FormEvent) {
    event.preventDefault();
    try {
      await playerRepository.rename(playerId, renameName);
      setRenaming(false);
      setReloadNonce((n) => n + 1);
    } catch (e) {
      if (e instanceof DomainError) setRenameError(playerErrorMessage(e.code));
      else throw e;
    }
  }

  async function confirmArchive() {
    await playerRepository.archive(playerId);
    resetToRoot();
  }

  return (
    <div className={styles.detail} data-testid="player-detail">
      <div className={styles.header}>
        {/* The masthead carries the <h1> in the normal view; while renaming the
            masthead is replaced by the form, so the back-header takes the <h1>
            over — exactly one <h1> in either state. */}
        <BackHeader title={renaming ? name : ''} onBack={pop} />
        <button
          type="button"
          className={styles.options}
          aria-label="Options du joueur"
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
                label: 'Renommer',
                icon: <Pencil />,
                onSelect: startRename,
              },
              {
                label: 'Supprimer le joueur',
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

      {renaming ? (
        <form className={styles.rename} onSubmit={submitRename}>
          <Avatar
            name={renameName || name}
            color={avatarColorForName(name)}
            size={64}
          />
          <TextField
            label="Nouveau nom"
            hideLabel={false}
            accent
            autoFocus
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            className={styles.renameField}
          />
          {renameError ? (
            <p className={styles.error} role="alert">
              {renameError}
            </p>
          ) : null}
          <p className={styles.helper}>
            Le nouveau nom s’affiche partout. L’identité du joueur ne change
            pas.
          </p>
          <Button type="submit" label="Enregistrer" icon={<Check />} />
        </form>
      ) : (
        <>
          <header className={styles.identity}>
            <Avatar name={name} color={avatarColorForName(name)} size={64} />
            <h1 className={styles.identityName}>{name}</h1>
          </header>

          <StatSummary
            played={sheet?.stats.playCount ?? 0}
            wins={sheet?.stats.winCount ?? 0}
            className={styles.stats}
          />

          {sheet && sheet.history.length === 0 ? (
            <div className={styles.empty}>
              <DiceMotif />
              <p className={styles.emptyCopy}>
                Aucune partie enregistrée pour ce joueur.
              </p>
            </div>
          ) : (
            <ul className={styles.history}>
              {(sheet?.history ?? []).map((entry) => {
                const { day, month } = formatHistoryDate(entry.playedAt);
                const isComp = entry.gameType === 'competitive';
                return (
                  <li key={entry.playId}>
                    <HistoryRow
                      variant="player"
                      day={day}
                      month={month}
                      title={entry.gameName}
                      result={resultOf(entry)}
                      score={
                        isComp
                          ? entry.score === null
                            ? 'unset'
                            : entry.score
                          : undefined
                      }
                      onClick={() =>
                        push({
                          kind: 'play-form',
                          mode: 'edit',
                          playId: entry.playId,
                          origin: 'player',
                          id: entry.playId,
                          depth: 2,
                        })
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <BottomSheet
        open={confirmOpen}
        icon={<Trash />}
        title={`Supprimer « ${name} » ?`}
        body="Ses parties et statistiques sont conservées ; il quitte simplement ta liste de joueurs."
        actionLabel="Supprimer le joueur"
        onAction={confirmArchive}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
