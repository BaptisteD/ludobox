/**
 * Standalone player creation (formulaire-joueur PRD): a light bottom-sheet form
 * with a single name field + « Ajouter ». The kit `BottomSheet` is confirm-only,
 * so this is a sibling sheet that hosts an input. Validation stays in the domain
 * — the repo is the authority (throws `DomainError`); we map the code to French
 * copy. Cancel/scrim closes with no write. Renders nothing when closed.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { Button, TextField } from '@/ui';
import { playerRepository } from '@/db/playerRepository';
import { DomainError } from '@/domain/validation';
import { playerErrorMessage } from './playerMessages';
import styles from './AddPlayerSheet.module.css';

export interface AddPlayerSheetProps {
  open: boolean;
  /** Called after a player is created and persisted. */
  onCreated: () => void;
  onCancel: () => void;
}

export function AddPlayerSheet({
  open,
  onCreated,
  onCancel,
}: AddPlayerSheetProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fresh field each time the sheet opens.
  useEffect(() => {
    if (open) {
      setName('');
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await playerRepository.create({ name });
      onCreated();
    } catch (e) {
      if (e instanceof DomainError) setError(playerErrorMessage(e.code));
      else throw e;
    }
  }

  return (
    <div className={styles.scrim} onClick={onCancel}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Ajouter un joueur"
        className={styles.sheet}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <span className={styles.grabber} aria-hidden="true" />
        <h2 className={styles.title}>Ajouter un joueur</h2>

        <TextField
          label="Nom du joueur"
          hideLabel={false}
          accent
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.field}
        />
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" label="Ajouter" />
        <button type="button" className={styles.cancel} onClick={onCancel}>
          Annuler
        </button>
      </form>
    </div>
  );
}
