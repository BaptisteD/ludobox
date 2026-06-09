/**
 * Round game-piece avatar — derived from a player's initial, never an uploaded
 * image (no avatar upload in V1, DESIGN.md §Stat feature card). The single,
 * parameterized avatar component: size and color are props, nothing is copied.
 */
import styles from './Avatar.module.css';

/** Avatar fills: gold is held back for win/record meaning, so it's excluded. */
export type AvatarColor = 'coral' | 'teal' | 'ink';

export interface AvatarProps {
  /** Player name; the first letter is shown, uppercased. */
  name: string;
  color?: AvatarColor;
  /** Diameter in px (default 72, the Fiche joueur masthead size). */
  size?: number;
  className?: string;
}

export function Avatar({
  name,
  color = 'coral',
  size = 72,
  className,
}: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      className={[styles.avatar, styles[color], className]
        .filter(Boolean)
        .join(' ')}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
