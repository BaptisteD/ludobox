/**
 * The game form — one screen shared by creation and edition (formulaire-jeu:
 * "écran unique toujours éditable"). Validation is delegated to the domain
 * (`validateGameDraft` + `checkGameNameAvailable`, and the repository as the
 * final authority); this component only collects input and maps domain error
 * codes to French copy. No image field in V1.
 */
import { useEffect, useState } from 'react';
import { Button } from '@/ui';
import { Check, DieGlyph } from '@/ui/icons';
import { gameRepository, type NewGame } from '@/db/gameRepository';
import { playRepository } from '@/db/playRepository';
import type { Game, GameType } from '@/domain/types';
import {
  checkGameNameAvailable,
  DomainError,
  validateGameDraft,
  type GameDraft,
} from '@/domain/validation';
import { BackHeader } from '@/app/BackHeader';
import { TextField } from '@/ui';
import { useNavigation } from '@/app/navigation/useNavigation';
import { GameTypeField } from './GameTypeField';
import { gameErrorMessage } from './gameMessages';
import styles from './GameForm.module.css';

export interface GameFormProps {
  mode: 'create' | 'edit';
  gameId?: string;
}

/** Empty/blank → undefined; otherwise the parsed number (NaN also → undefined). */
function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  const n = Number(trimmed);
  return Number.isNaN(n) ? undefined : n;
}

const toField = (value: number | undefined): string =>
  value === undefined ? '' : String(value);

export function GameForm({ mode, gameId }: GameFormProps) {
  const { pop } = useNavigation();

  const [allGames, setAllGames] = useState<Game[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState<GameType | undefined>(undefined);
  const [minPlayers, setMinPlayers] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [typeLocked, setTypeLocked] = useState(false);
  const [title, setTitle] = useState(
    mode === 'create' ? 'Nouveau jeu' : 'Modifier le jeu',
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const games = await gameRepository.getAll();
      if (!active) return;
      setAllGames(games);

      if (mode === 'edit' && gameId) {
        const game = games.find((g) => g.id === gameId);
        const counts = await playRepository.countByGame();
        if (!active || !game) return;
        setName(game.name);
        setType(game.type);
        setMinPlayers(toField(game.minPlayers));
        setMaxPlayers(toField(game.maxPlayers));
        setDurationMin(toField(game.durationMin));
        setTypeLocked((counts.get(game.id) ?? 0) > 0);
        setTitle(game.name);
      }
    })();
    return () => {
      active = false;
    };
  }, [mode, gameId]);

  async function handleSave() {
    const draft: GameDraft = {
      name,
      type,
      minPlayers: parseOptionalNumber(minPlayers),
      maxPlayers: parseOptionalNumber(maxPlayers),
      durationMin: parseOptionalNumber(durationMin),
    };

    const structural = validateGameDraft(draft);
    if (!structural.ok) return setError(gameErrorMessage(structural.code));

    const unique = checkGameNameAvailable(draft.name, allGames, {
      excludeId: gameId,
    });
    if (!unique.ok) return setError(gameErrorMessage(unique.code));

    const payload: NewGame = {
      name: draft.name.trim(),
      type: draft.type!,
      ...(draft.minPlayers !== undefined
        ? { minPlayers: draft.minPlayers }
        : {}),
      ...(draft.maxPlayers !== undefined
        ? { maxPlayers: draft.maxPlayers }
        : {}),
      ...(draft.durationMin !== undefined
        ? { durationMin: draft.durationMin }
        : {}),
    };

    try {
      if (mode === 'create') await gameRepository.create(payload);
      else await gameRepository.update(gameId!, payload);
      pop();
    } catch (e) {
      if (e instanceof DomainError) setError(gameErrorMessage(e.code));
      else throw e;
    }
  }

  return (
    <div className={styles.form} data-testid="game-form">
      <BackHeader title={title} onBack={pop} />
      <div className={styles.body}>
        <section className={styles.section}>
          <span className={styles.label} aria-hidden="true">
            Nom du jeu
          </span>
          <TextField
            label="Nom du jeu"
            hideLabel
            leading={<DieGlyph size={22} />}
            placeholder="Le nom du jeu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus={mode === 'create'}
          />
        </section>

        <GameTypeField value={type} onChange={setType} locked={typeLocked} />

        <section className={styles.section}>
          <span className={styles.label} aria-hidden="true">
            Joueurs <span className={styles.optional}>facultatif</span>
          </span>
          <div className={styles.inlineRow}>
            <TextField
              className={styles.numField}
              label="Joueurs min"
              hideLabel
              inputMode="numeric"
              style={{ textAlign: 'center' }}
              value={minPlayers}
              onChange={(e) => setMinPlayers(e.target.value)}
            />
            <span className={styles.connector}>à</span>
            <TextField
              className={styles.numField}
              label="Joueurs max"
              hideLabel
              inputMode="numeric"
              style={{ textAlign: 'center' }}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
            />
            <span className={styles.connector}>joueurs</span>
          </div>
        </section>

        <section className={styles.section}>
          <span className={styles.label} aria-hidden="true">
            Durée <span className={styles.optional}>facultatif</span>
          </span>
          <div className={styles.inlineRow}>
            <TextField
              className={styles.durationField}
              label="Durée (min)"
              hideLabel
              inputMode="numeric"
              style={{ textAlign: 'center' }}
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
            />
            <span className={styles.connector}>minutes</span>
          </div>
        </section>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <div className={styles.saveBar}>
          <Button
            label={mode === 'create' ? 'Créer le jeu' : 'Enregistrer'}
            icon={<Check size={22} />}
            onClick={handleSave}
          />
          <button type="button" className={styles.cancel} onClick={pop}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
