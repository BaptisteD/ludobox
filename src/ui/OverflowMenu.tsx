/**
 * Overflow "⋮" popover (DESIGN.md §Overflow menu). White rounded surface, 2.5px
 * outline + record shadow, rows split by a hairline divider. Destructive rows
 * carry the coral tone. Generic `items` — presentational, no positioning logic.
 */
import type { ReactNode } from 'react';
import styles from './OverflowMenu.module.css';

export interface OverflowMenuItem {
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  tone?: 'default' | 'destructive';
}

export interface OverflowMenuProps {
  items: ReadonlyArray<OverflowMenuItem>;
  className?: string;
}

export function OverflowMenu({ items, className }: OverflowMenuProps) {
  return (
    <div
      className={[styles.menu, className].filter(Boolean).join(' ')}
      role="menu"
    >
      {items.map(({ label, icon, onSelect, tone = 'default' }) => (
        <button
          key={label}
          type="button"
          role="menuitem"
          onClick={onSelect}
          className={[
            styles.item,
            tone === 'destructive' ? styles.destructive : null,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span className={styles.icon}>{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
}
