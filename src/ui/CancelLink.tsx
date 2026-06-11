/**
 * A quiet secondary escape under a form's CTA — a text link, never a second
 * filled button (DESIGN.md §Button hierarchy). Shared by the game and play
 * forms; each wires its own back/abandon flow via `onClick`.
 */
import styles from './CancelLink.module.css';

export interface CancelLinkProps {
  onClick: () => void;
  /** Defaults to "Annuler". */
  label?: string;
}

export function CancelLink({ onClick, label = 'Annuler' }: CancelLinkProps) {
  return (
    <button type="button" className={styles.cancel} onClick={onClick}>
      {label}
    </button>
  );
}
