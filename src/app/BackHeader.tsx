/**
 * The explicit back affordance shown in a detail/form header — the only way up
 * one cran when the bottom bar is hidden. A plain left chevron in a nav row,
 * with the masthead title stacked below it (maquette pattern: nav + masthead).
 * Hosts that own their own h1 pass an empty title; then only the nav shows.
 * The chevron's tap area is ≥44px even though the glyph itself reads light.
 */
import { Chevron } from '@/ui/icons';
import styles from './BackHeader.module.css';

export interface BackHeaderProps {
  title: string;
  onBack: () => void;
}

export function BackHeader({ title, onBack }: BackHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.nav}>
        <button
          type="button"
          className={styles.back}
          onClick={onBack}
          aria-label="Retour"
        >
          <Chevron size={26} className={styles.chevron} />
        </button>
      </div>
      {title ? <h1 className={styles.title}>{title}</h1> : null}
    </header>
  );
}
