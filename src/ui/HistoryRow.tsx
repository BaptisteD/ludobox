/**
 * A history row: white date tile (number + month) + main column (optional
 * title + meta) + result + faint chevron. Divided by space, never borders
 * (DESIGN.md §History rows). Serves both Fiche jeu and Fiche joueur histories.
 *
 * Result area, any of:
 *  - `result` → a Victoire/Défaite/Succès/Échec chip
 *  - `score` → points in gold/ink; the string 'unset' renders the explicit
 *    italic "Score non renseigné" state (never a blank or an error)
 *  - `trophy` → a trophy glyph before the score (competitive win)
 */
import { Chevron, Trophy } from './icons';
import { ResultChip, type ResultKind } from './ResultChip';
import styles from './HistoryRow.module.css';

export interface HistoryRowProps {
  /** Day number on the date tile. */
  day: number;
  /** Short month on the date tile, e.g. "MAI". */
  month: string;
  /** Optional headline (game or player name), Baloo. */
  title?: string;
  /** Optional meta line under the title. */
  meta?: string;
  result?: ResultKind;
  trophy?: boolean;
  /** Points, or 'unset' for the explicit "Score non renseigné" state. */
  score?: number | 'unset';
  onClick?: () => void;
  className?: string;
}

export function HistoryRow({
  day,
  month,
  title,
  meta,
  result,
  trophy = false,
  score,
  onClick,
  className,
}: HistoryRowProps) {
  const Root = onClick ? 'button' : 'div';
  return (
    <Root
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={[styles.row, className].filter(Boolean).join(' ')}
    >
      <span className={styles.tile}>
        <span className={styles.day}>{day}</span>
        <span className={styles.month}>{month}</span>
      </span>

      <span className={styles.main}>
        {title ? <span className={styles.title}>{title}</span> : null}
        {meta ? <span className={styles.meta}>{meta}</span> : null}
      </span>

      <span className={styles.result}>
        {result ? <ResultChip result={result} /> : null}
        {trophy ? (
          <span className={styles.trophy}>
            <Trophy size={18} />
          </span>
        ) : null}
        {score === 'unset' ? (
          <span className={styles.scoreUnset}>Score non renseigné</span>
        ) : score !== undefined ? (
          <span className={styles.score}>{score}</span>
        ) : null}
      </span>

      <span className={styles.chevron}>
        <Chevron size={20} />
      </span>
    </Root>
  );
}
