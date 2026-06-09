/**
 * Game-type tag — fully round pill, colored by type, always paired with its
 * text label (color never carries meaning alone, DESIGN.md §Accessibility).
 */
import styles from './Tag.module.css';

export type GameType = 'competitif' | 'cooperatif';

const LABELS: Record<GameType, string> = {
  competitif: 'Compétitif',
  cooperatif: 'Coopératif',
};

export interface TagProps {
  type: GameType;
  className?: string;
}

export function Tag({ type, className }: TagProps) {
  return (
    <span
      className={[styles.tag, styles[type], className]
        .filter(Boolean)
        .join(' ')}
    >
      {LABELS[type]}
    </span>
  );
}
