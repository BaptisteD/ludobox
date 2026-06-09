/**
 * A round colored disc holding an icon. One parameterized component for every
 * disc in the kit: the small coral `+` echo (add-player field, autocomplete
 * create row) and the 64px coral icon disc in the destructive bottom sheets.
 */
import type { ReactNode } from 'react';
import styles from './IconDisc.module.css';

export type DiscColor = 'coral' | 'teal';

export interface IconDiscProps {
  children: ReactNode;
  color?: DiscColor;
  /** Diameter in px (default 24, the inline `+` echo). */
  size?: number;
  className?: string;
}

export function IconDisc({
  children,
  color = 'coral',
  size = 24,
  className,
}: IconDiscProps) {
  return (
    <span
      className={[styles.disc, styles[color], className]
        .filter(Boolean)
        .join(' ')}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
