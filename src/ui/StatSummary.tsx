/**
 * Fiche joueur counters — a two-up read of *parties jouées* and *victoires*:
 * big Baloo number over a Hanken uppercase label, split by a 2px ink vertical
 * divider. Victoires carries a gold crown and uses gold/ink. The intimate,
 * card-less stat treatment — read-only, never boxed (DESIGN.md §Stat summary).
 */
import { CrownFilled } from './icons';
import styles from './StatSummary.module.css';

export interface StatSummaryProps {
  played: number;
  wins: number;
  className?: string;
}

export function StatSummary({ played, wins, className }: StatSummaryProps) {
  return (
    <div className={[styles.summary, className].filter(Boolean).join(' ')}>
      <div className={styles.stat}>
        <span className={styles.number}>{played}</span>
        <span className={styles.label}>Parties jouées</span>
      </div>
      <div className={styles.divider} aria-hidden="true" />
      <div className={styles.stat}>
        <span className={[styles.number, styles.winNumber].join(' ')}>
          <span className={styles.crown}>
            <CrownFilled size={22} />
          </span>
          {wins}
        </span>
        <span className={styles.label}>Victoires</span>
      </div>
    </div>
  );
}
