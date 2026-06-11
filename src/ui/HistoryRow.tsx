/**
 * A history row: white date tile (number + month) + content + faint chevron.
 * Divided by space, never borders (DESIGN.md §History rows). The layout is
 * chosen explicitly by `variant` (never inferred from which props are set):
 *
 *  - **`player`** (Fiche joueur, maquette 2I6-0): the game name on top, then the
 *    player's result chip + their score stacked underneath ("Ndd pts"). No meta.
 *  - **`game`** (default — Fiche jeu, maquette 7X7-0 / SA-0): the winner/trophy +
 *    score (or the coop chip) on the headline, with the meta line under it. The
 *    score is points in gold/ink; 'unset' renders the explicit italic
 *    "Score non renseigné" state.
 */
import { Chevron, Trophy } from './icons';
import { ResultChip, type ResultKind } from './ResultChip';
import styles from './HistoryRow.module.css';

/**
 * The score slot, shared by both layouts: a gold number, or the explicit italic
 * "Score non renseigné" for 'unset', or nothing when no score is given. The
 * player layout adds the "pts" unit; the Fiche jeu headline shows the bare
 * number inline after the winner.
 */
function ScoreValue({
  score,
  withUnit = false,
}: {
  score?: number | 'unset';
  withUnit?: boolean;
}) {
  if (score === 'unset') {
    return <span className={styles.scoreUnset}>Score non renseigné</span>;
  }
  if (score === undefined) return null;
  if (!withUnit) return <span className={styles.score}>{score}</span>;
  return (
    <span className={styles.points}>
      <span className={styles.score}>{score}</span>
      <span className={styles.pts}>pts</span>
    </span>
  );
}

export interface HistoryRowProps {
  /** Which layout to render — see the file header. Defaults to 'game'. */
  variant?: 'game' | 'player';
  /** Day number on the date tile. */
  day: number;
  /** Short month on the date tile, e.g. "MAI". */
  month: string;
  /** Optional headline (game or player name), Baloo. */
  title?: string;
  /** Meta line under the headline. Game variant only. */
  meta?: string;
  result?: ResultKind;
  /** Trophy glyph before the winner. Game variant only. */
  trophy?: boolean;
  /** Points, or 'unset' for the explicit "Score non renseigné" state. */
  score?: number | 'unset';
  onClick?: () => void;
  className?: string;
}

export function HistoryRow({
  variant = 'game',
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
  const stacked = variant === 'player';

  return (
    <Root
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={[styles.row, className].filter(Boolean).join(' ')}
    >
      <span className={styles.tile}>
        <span className={styles.day}>{day}</span>
        <span className={styles.month}>{month}</span>
      </span>

      {stacked ? (
        <span className={styles.stack}>
          <span className={styles.title}>{title}</span>
          <span className={styles.resultLine}>
            {result ? <ResultChip result={result} /> : null}
            <ScoreValue score={score} withUnit />
          </span>
        </span>
      ) : (
        <span className={styles.main}>
          {/* Headline: trophy + winner(s) + winning score inline (or the coop
              result chip), with the other players on the meta line below it
              (maquette 7X7-0 / SA-0). */}
          <span className={styles.headline}>
            {trophy ? (
              <span className={styles.trophy}>
                <Trophy size={18} />
              </span>
            ) : null}
            {result ? <ResultChip result={result} /> : null}
            {title ? <span className={styles.title}>{title}</span> : null}
            <ScoreValue score={score} />
          </span>
          {meta ? <span className={styles.meta}>{meta}</span> : null}
        </span>
      )}

      <span className={styles.chevron}>
        <Chevron size={20} />
      </span>
    </Root>
  );
}
