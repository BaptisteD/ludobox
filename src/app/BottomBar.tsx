/**
 * The two-entry bottom bar (Collection / Joueurs). Rendered by `AppShell` only
 * at first level — it never decides its own presence (the centralized rule
 * lives in `bottomBarVisible`). Active tab is distinguished by a filled ink
 * pill on the whole slot (shape) and an extrabold Baloo label (weight), never
 * by color alone; `aria-current="page"` carries it for assistive tech.
 * Targets are ≥44px. The bar reads as a 2px top separator, not a boxed shelf.
 */
import { Grid, Users } from '@/ui/icons';
import type { Tab } from './navigation/types';
import styles from './BottomBar.module.css';

const TABS: ReadonlyArray<{ tab: Tab; label: string; Icon: typeof Grid }> = [
  { tab: 'collection', label: 'Collection', Icon: Grid },
  { tab: 'joueurs', label: 'Joueurs', Icon: Users },
];

export interface BottomBarProps {
  active: Tab;
  onSelect: (tab: Tab) => void;
}

export function BottomBar({ active, onSelect }: BottomBarProps) {
  return (
    <nav className={styles.bar} aria-label="Navigation principale">
      {TABS.map(({ tab, label, Icon }) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            type="button"
            className={styles.tab}
            aria-current={isActive ? 'page' : undefined}
            data-active={isActive || undefined}
            onClick={() => onSelect(tab)}
          >
            <span className={styles.disc}>
              <Icon size={24} />
            </span>
            <span className={styles.label}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
