/**
 * The tilted gold RECORD card (competitive Fiche jeu) — the celebrated "human
 * moment": overline + big hero number + holder avatar. Shares the gold feature
 * card signature with SuccessRateCard (DESIGN.md §Stat feature card).
 */
import { Avatar, type AvatarColor } from './Avatar';
import styles from './FeatureCard.module.css';

export interface RecordCardProps {
  /** The record score. */
  score: number;
  /** Record holder's name. */
  holder: string;
  holderColor?: AvatarColor;
  /** Unit shown after the number (default "pts"). */
  unit?: string;
  className?: string;
}

export function RecordCard({
  score,
  holder,
  holderColor = 'coral',
  unit = 'pts',
  className,
}: RecordCardProps) {
  return (
    <div className={[styles.card, className].filter(Boolean).join(' ')}>
      <div className={styles.body}>
        <span className={styles.overline}>Record</span>
        <span className={styles.hero}>
          {score}
          <span className={styles.unit}>{unit}</span>
        </span>
        <span className={styles.holder}>{holder}</span>
      </div>
      <Avatar name={holder} color={holderColor} size={64} />
    </div>
  );
}
