/**
 * The tilted gold success-rate card (cooperative Fiche jeu): big percentage +
 * a win/loss bar + succès/échec counts, with the total restated as the
 * denominator ("sur N parties"). Shares the gold feature card signature with
 * RecordCard (DESIGN.md §Stat feature card).
 */
import styles from './FeatureCard.module.css';

export interface SuccessRateCardProps {
  wins: number;
  losses: number;
  className?: string;
}

export function SuccessRateCard({
  wins,
  losses,
  className,
}: SuccessRateCardProps) {
  const total = wins + losses;
  const rate = total === 0 ? 0 : Math.round((wins / total) * 100);
  const winPct = total === 0 ? 0 : (wins / total) * 100;

  return (
    <div className={[styles.card, className].filter(Boolean).join(' ')}>
      <div className={styles.rateBody}>
        <span className={styles.overline}>Taux de réussite</span>
        <span className={styles.hero}>
          {rate}
          <span className={styles.unit}>%</span>
        </span>
        <div
          className={styles.bar}
          role="img"
          aria-label={`${wins} succès, ${losses} échecs`}
        >
          <span className={styles.barWin} style={{ width: `${winPct}%` }} />
          <span
            className={styles.barLoss}
            style={{ width: `${100 - winPct}%` }}
          />
        </div>
        <div className={styles.counts}>
          <span>{wins} succès</span>
          <span>{losses} échecs</span>
          <span>sur {total} parties</span>
        </div>
      </div>
    </div>
  );
}
