/**
 * Inline validity hint (competitive, no winner) — a quiet single line above the
 * Save CTA, not a clinical error box: a coral outlined crown (echoing the
 * off-state winner toggle, the empty crown waiting to be filled) + a plain
 * message. Names the one blocker so a dormant Save is always self-explaining
 * (DESIGN.md §Inline validity hint).
 */
import { CrownOutline } from './icons';
import styles from './InlineValidityHint.module.css';

export interface InlineValidityHintProps {
  /** Defaults to the no-winner blocker. */
  message?: string;
  className?: string;
}

export function InlineValidityHint({
  message = 'Désigne le gagnant pour enregistrer la partie.',
  className,
}: InlineValidityHintProps) {
  return (
    <p className={[styles.hint, className].filter(Boolean).join(' ')}>
      <span className={styles.crown}>
        <CrownOutline size={20} />
      </span>
      {message}
    </p>
  );
}
