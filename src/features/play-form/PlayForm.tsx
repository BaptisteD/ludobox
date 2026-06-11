/**
 * Fiche partie (Brique 7) — the one screen for logging and correcting a play,
 * competitive or cooperative. Always editable; consultation and edition are the
 * same screen. Composes the Brique 2 input kit; all state lives in the pure
 * `playDraft` reducer, all persistence in `playFormData`, and "record broken?" in
 * the domain. The back guard (in-app + hardware) is registered while the draft is
 * dirty so leaving with unsaved changes asks first (US9).
 */
import { useEffect, useReducer, useRef, useState } from 'react';
import {
  AddPlayerField,
  Autocomplete,
  Avatar,
  avatarColorForName,
  BottomSheet,
  Button,
  CancelLink,
  Check,
  Cross,
  InlineValidityHint,
  NoteField,
  OverflowMenu,
  SegmentedResult,
  Tag,
  Trash,
  Undo,
  WinnerToggle,
  type AutocompletePlayer,
  type CoopResult as SegmentedValue,
} from '@/ui';
import { Calendar } from '@/ui/icons';
import { DomainError } from '@/domain/validation';
import { normalizeName } from '@/domain/normalize';
import { playRepository } from '@/db/playRepository';
import { BackHeader } from '@/app/BackHeader';
import { useNavigation } from '@/app/navigation/useNavigation';
import { usePlayCelebration } from '@/app/PlayCelebration';
import type { Screen } from '@/app/navigation/types';
import {
  emptyDraft,
  formatLongDate,
  fromDateInputValue,
  isDirty,
  playDraftReducer,
  selectValidity,
  toDateInputValue,
  type PlayDraftState,
} from './playDraft';
import {
  loadPlayForm,
  savePlay,
  type LoadedPlayForm,
  type PlayFormScreen,
  type SavePlayContext,
} from './playFormData';
import { playFormErrorMessage } from './playFormMessages';
import styles from './PlayForm.module.css';

export interface PlayFormProps {
  screen: Extract<Screen, { kind: 'play-form' }>;
}

const toSegment = (r: 'success' | 'failure'): SegmentedValue =>
  r === 'success' ? 'succes' : 'echec';
const fromSegment = (v: SegmentedValue): 'success' | 'failure' =>
  v === 'succes' ? 'success' : 'failure';

/** '' or junk → null; otherwise the integer (sign allowed, decimals dropped). */
function parseScore(value: string): number | null {
  const t = value.trim();
  if (t === '' || t === '-') return null;
  const n = Number.parseInt(t, 10);
  return Number.isNaN(n) ? null : n;
}

export function PlayForm({ screen }: PlayFormProps) {
  const { pop, registerBackGuard } = useNavigation();
  const { publish } = usePlayCelebration();

  const [loaded, setLoaded] = useState<LoadedPlayForm | null | undefined>(
    undefined,
  );
  const [draft, dispatch] = useReducer(
    playDraftReducer,
    emptyDraft('competitive', new Date()),
  );
  const [initial, setInitial] = useState<PlayDraftState | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [abandonOpen, setAbandonOpen] = useState(false);

  const isEdit = screen.mode === 'edit';
  const loadScreen: PlayFormScreen =
    screen.mode === 'create'
      ? { mode: 'create', gameId: screen.gameId }
      : { mode: 'edit', playId: screen.playId };

  // Live refs read by the back guard (registered once).
  const dirtyRef = useRef(false);
  const leavingRef = useRef(false);
  dirtyRef.current = Boolean(initial && isDirty(initial, draft));

  useEffect(() => {
    let active = true;
    void loadPlayForm(loadScreen).then((next) => {
      if (!active) return;
      setLoaded(next);
      if (next) {
        setInitial(next.initial);
        dispatch({ type: 'REPLACE', state: next.initial });
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen.mode, screen.mode === 'edit' ? screen.playId : screen.gameId]);

  useEffect(
    () =>
      registerBackGuard({
        shouldBlock: () => dirtyRef.current && !leavingRef.current,
        onBlocked: () => setAbandonOpen(true),
      }),
    [registerBackGuard],
  );

  function leave() {
    leavingRef.current = true;
    pop();
  }

  function requestBack() {
    if (dirtyRef.current) setAbandonOpen(true);
    else pop();
  }

  if (loaded === null) {
    return (
      <div className={styles.form} data-testid="play-form">
        <BackHeader title="" onBack={pop} />
        <p className={styles.unavailable}>
          Cette partie n'est plus disponible.
        </p>
      </div>
    );
  }
  if (!loaded) {
    return (
      <div className={styles.form} data-testid="play-form">
        <BackHeader title="" onBack={pop} />
      </div>
    );
  }

  const competitive = draft.gameType === 'competitive';
  const validity = selectValidity(draft);
  const showWinnerHint =
    competitive && validity.ok === false && validity.code === 'NO_WINNER';

  const addedIds = new Set(
    draft.participants
      .map((p) => p.playerId)
      .filter((id): id is string => id !== null),
  );
  const addedNames = new Set(
    draft.participants.map((p) => normalizeName(p.name)),
  );
  const candidates: AutocompletePlayer[] = loaded.activePlayers
    .filter((p) => !addedIds.has(p.id))
    .map((p) => ({
      id: p.id,
      name: p.name,
      color: avatarColorForName(p.name),
    }));
  const trimmedQuery = query.trim();
  const activeMatch = loaded.activePlayers.some(
    (p) => normalizeName(p.name) === normalizeName(trimmedQuery),
  );
  const canCreate =
    trimmedQuery.length > 0 &&
    !activeMatch &&
    !addedNames.has(normalizeName(trimmedQuery));

  function addExisting(player: AutocompletePlayer) {
    dispatch({
      type: 'ADD_PARTICIPANT',
      participant: {
        key: crypto.randomUUID(),
        playerId: player.id,
        name: player.name,
        color: player.color ?? avatarColorForName(player.name),
        score: null,
        isWinner: false,
      },
    });
    setQuery('');
  }

  function addNew(name: string) {
    const clean = name.trim();
    dispatch({
      type: 'ADD_PARTICIPANT',
      participant: {
        key: crypto.randomUUID(),
        playerId: null,
        name: clean,
        color: avatarColorForName(clean),
        score: null,
        isWinner: false,
      },
    });
    setQuery('');
  }

  const form = loaded; // narrowed: non-null past the guard above

  async function handleSave() {
    setError(null);
    const ctx: SavePlayContext =
      screen.mode === 'edit'
        ? { mode: 'edit', gameId: form.game.id, playId: screen.playId }
        : { mode: 'create', gameId: form.game.id };
    try {
      const celebration = await savePlay(draft, ctx);
      if (celebration && screen.origin === 'game') {
        publish({
          gameId: form.game.id,
          holderName: celebration.holderName,
          score: celebration.score,
        });
      }
      leave();
    } catch (e) {
      if (e instanceof DomainError) setError(playFormErrorMessage(e.code));
      else throw e;
    }
  }

  async function handleDelete() {
    if (screen.mode !== 'edit') return;
    await playRepository.remove(screen.playId);
    leave();
  }

  const overline = isEdit ? 'Modifier la partie' : 'Nouvelle partie';
  const saveLabel = isEdit
    ? 'Enregistrer les modifications'
    : 'Enregistrer la partie';

  return (
    <div className={styles.form} data-testid="play-form">
      <div className={styles.header}>
        <BackHeader title="" onBack={requestBack} />
        {isEdit ? (
          <>
            <button
              type="button"
              className={styles.options}
              aria-label="Options de la partie"
              aria-haspopup="menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span aria-hidden="true">⋮</span>
            </button>
            {menuOpen ? (
              <OverflowMenu
                className={styles.menu}
                items={[
                  {
                    label: 'Supprimer la partie',
                    icon: <Trash />,
                    tone: 'destructive',
                    onSelect: () => {
                      setMenuOpen(false);
                      setDeleteOpen(true);
                    },
                  },
                ]}
              />
            ) : null}
          </>
        ) : null}
      </div>

      <div className={styles.body}>
        <div className={styles.context}>
          <span className={styles.overline}>{overline}</span>
          <h1 className={styles.gameTitle}>{loaded.game.name}</h1>
          <Tag type={competitive ? 'competitif' : 'cooperatif'} />
        </div>

        <section className={styles.section}>
          <span className={styles.label}>Date</span>
          <div className={styles.dateField}>
            <Calendar size={20} aria-hidden="true" />
            {/* Long readable date shown over a transparent native input that
                still captures the tap and opens the picker (maquette). Decorative:
                the input below already carries the accessible "Date" label and
                value, so hide this from assistive tech to avoid a double read. */}
            <span className={styles.dateValue} aria-hidden="true">
              {formatLongDate(draft.playedAt)}
            </span>
            <input
              type="date"
              aria-label="Date"
              className={styles.dateInput}
              value={toDateInputValue(draft.playedAt)}
              onChange={(e) =>
                e.target.value &&
                dispatch({
                  type: 'SET_DATE',
                  date: fromDateInputValue(e.target.value),
                })
              }
            />
          </div>
        </section>

        <section className={styles.section}>
          <span className={styles.label}>Joueurs</span>
          {competitive ? (
            <p className={styles.helper}>
              Touche le trophée pour désigner le gagnant. Le score est
              facultatif.
            </p>
          ) : null}

          <ul className={styles.participants}>
            {draft.participants.map((p) => (
              <li key={p.key} className={styles.participant}>
                <Avatar name={p.name} color={p.color} size={38} />
                <span className={styles.participantName}>{p.name}</span>
                {competitive ? (
                  <>
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label={`Score de ${p.name}`}
                      className={styles.score}
                      value={p.score === null ? '' : String(p.score)}
                      onChange={(e) =>
                        dispatch({
                          type: 'SET_SCORE',
                          key: p.key,
                          score: parseScore(e.target.value),
                        })
                      }
                    />
                    <WinnerToggle
                      on={p.isWinner}
                      onChange={(on) =>
                        dispatch({ type: 'TOGGLE_WINNER', key: p.key, on })
                      }
                      label={`${p.name} a gagné`}
                    />
                  </>
                ) : null}
                <button
                  type="button"
                  className={styles.remove}
                  aria-label={`Retirer ${p.name}`}
                  onClick={() =>
                    dispatch({ type: 'REMOVE_PARTICIPANT', key: p.key })
                  }
                >
                  <Cross size={18} />
                </button>
              </li>
            ))}
          </ul>

          <div className={styles.addPlayer}>
            <AddPlayerField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {trimmedQuery.length > 0 ? (
              <Autocomplete
                query={query}
                players={candidates}
                onSelect={addExisting}
                onCreate={canCreate ? addNew : undefined}
              />
            ) : null}
          </div>
        </section>

        {competitive ? null : (
          <section className={styles.section}>
            <span className={styles.label}>Résultat collectif</span>
            <SegmentedResult
              value={toSegment(draft.coopResult)}
              onChange={(v) =>
                dispatch({ type: 'SET_COOP_RESULT', result: fromSegment(v) })
              }
            />
          </section>
        )}

        <section className={styles.section}>
          <span className={styles.label}>
            Note <span className={styles.optional}>facultatif</span>
          </span>
          <NoteField
            label="Note"
            placeholder="Une note sur la partie…"
            value={draft.note}
            onChange={(e) =>
              dispatch({ type: 'SET_NOTE', note: e.target.value })
            }
          />
        </section>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {showWinnerHint ? <InlineValidityHint /> : null}

        <div className={styles.cta}>
          <Button
            label={saveLabel}
            icon={<Check />}
            disabled={!validity.ok}
            onClick={handleSave}
          />
          {/* Quiet secondary escape — routes through the same back chokepoint as
              the arrow, so the unsaved-changes guard still fires (US9). */}
          <CancelLink onClick={requestBack} />
        </div>
      </div>

      <BottomSheet
        open={deleteOpen}
        icon={<Trash />}
        title="Supprimer cette partie ?"
        body="La partie et ses participations seront définitivement supprimées."
        actionLabel="Supprimer la partie"
        onAction={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
      <BottomSheet
        open={abandonOpen}
        icon={<Undo />}
        title="Abandonner les modifications ?"
        body="Les changements non enregistrés seront perdus."
        actionLabel="Abandonner"
        cancelLabel="Continuer la saisie"
        onAction={() => {
          setAbandonOpen(false);
          leave();
        }}
        onCancel={() => setAbandonOpen(false)}
      />
    </div>
  );
}
