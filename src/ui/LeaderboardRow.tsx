/**
 * A win-ranking row: rank badge + optional trophy + name (Baloo) + count +
 * "vict." (Hanken). Rank 1 sits on cream-raised via `highlight`; others on bare
 * cream, divided by space (DESIGN.md §Leaderboard rows).
 */
import { Trophy } from './icons';
import { RankBadge } from './RankBadge';
import styles from './LeaderboardRow.module.css';

export interface LeaderboardRowProps {
  rank: number;
  name: string;
  /** Number of wins. */
  wins: number;
  /** Show the trophy glyph (typically rank 1). */
  trophy?: boolean;
  /** Rank-1 surface treatment. */
  highlight?: boolean;
  className?: string;
}

export function LeaderboardRow({
  rank,
  name,
  wins,
  trophy = false,
  highlight = false,
  className,
}: LeaderboardRowProps) {
  return (
    <div
      className={[styles.row, highlight ? styles.highlight : null, className]
        .filter(Boolean)
        .join(' ')}
    >
      <RankBadge rank={rank} />
      {trophy ? (
        <span className={styles.trophy}>
          <Trophy size={20} />
        </span>
      ) : null}
      <span className={styles.name}>{name}</span>
      <span className={styles.count}>
        {wins} <span className={styles.unit}>vict.</span>
      </span>
    </div>
  );
}
