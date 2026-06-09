/**
 * A first-level placeholder screen (Brique 3). Real Collection/Joueurs content
 * arrives in briques 4–5; here it only exercises the navigation mechanics:
 *
 * - Its scroll container stays mounted while a detail is open, so scroll
 *   position is preserved.
 * - It re-reads on `focusNonce` change (recompute-on-read when returning to
 *   first level) — surfaced as a visible read count for tests.
 * - It scrolls back to top on `scrollResetNonce` change (active-tab re-tap).
 * - It can push a detail so back behavior is exercisable now.
 */
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/ui';
import { useNavigation } from '../navigation/useNavigation';
import type { Tab } from '../navigation/types';
import styles from './FirstLevelScreen.module.css';

export interface FirstLevelScreenProps {
  tab: Tab;
  title: string;
  focusNonce: number;
  scrollResetNonce: number;
}

export function FirstLevelScreen({
  tab,
  title,
  focusNonce,
  scrollResetNonce,
}: FirstLevelScreenProps) {
  const { push } = useNavigation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Recompute-on-read: re-runs whenever this screen returns to the foreground.
  const [reads, setReads] = useState(0);
  useEffect(() => {
    setReads((n) => n + 1);
  }, [focusNonce]);

  // Active-tab re-tap: scroll the list back to top (non-destructive).
  useEffect(() => {
    if (scrollResetNonce > 0) {
      scrollRef.current?.scrollTo({ top: 0 });
    }
  }, [scrollResetNonce]);

  return (
    <div
      ref={scrollRef}
      className={styles.screen}
      data-testid={`screen-${tab}`}
    >
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.hint} data-testid={`reads-${tab}`}>
        Lectures : {reads}
      </p>
      {/* Filler so the list is scrollable, to exercise scroll-to-top. */}
      <ul className={styles.filler} aria-hidden="true">
        {Array.from({ length: 30 }, (_, i) => (
          <li key={i}>Élément {i + 1}</li>
        ))}
      </ul>
      <div className={styles.cta}>
        <Button
          label="Ouvrir un détail"
          onClick={() =>
            push({ kind: 'placeholder-detail', id: `${tab}-1`, depth: 1 })
          }
        />
      </div>
    </div>
  );
}
