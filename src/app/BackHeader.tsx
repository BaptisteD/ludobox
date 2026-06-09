/**
 * The explicit back affordance shown in a detail's header — the only way up
 * one cran when the bottom bar is hidden. ≥44px hit area.
 */
import { ArrowLeft } from '@/ui/icons';
import styles from './BackHeader.module.css';

export interface BackHeaderProps {
  title: string;
  onBack: () => void;
}

export function BackHeader({ title, onBack }: BackHeaderProps) {
  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.back}
        onClick={onBack}
        aria-label="Retour"
      >
        <ArrowLeft size={24} />
      </button>
      <h1 className={styles.title}>{title}</h1>
    </header>
  );
}
