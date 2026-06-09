/**
 * Numbered rank badge. Color cycles gold(1)/teal(2)/coral(3), but the rank
 * number is always shown so order never relies on color (DESIGN.md §Semantic).
 * Ranks beyond 3 fall back to the coral tone, still numbered.
 */
import styles from './RankBadge.module.css';

const TONES = [styles.gold, styles.teal, styles.coral];

export interface RankBadgeProps {
  /** 1-based rank. */
  rank: number;
  className?: string;
}

export function RankBadge({ rank, className }: RankBadgeProps) {
  const tone = TONES[Math.min(rank, 3) - 1] ?? styles.coral;
  return (
    <span className={[styles.badge, tone, className].filter(Boolean).join(' ')}>
      {rank}
    </span>
  );
}
