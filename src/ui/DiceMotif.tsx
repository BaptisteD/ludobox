/**
 * Empty-state dice pair — a coral die tilted -8° and a gold die tilted +7°,
 * thick 3px ink outline. Warm and inviting, never blank (DESIGN.md §Empty
 * state). Decorative: hidden from assistive tech.
 */
import { DieGlyph } from './icons';
import styles from './DiceMotif.module.css';

export interface DiceMotifProps {
  className?: string;
}

export function DiceMotif({ className }: DiceMotifProps) {
  return (
    <div
      className={[styles.motif, className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      <span className={[styles.die, styles.coral].join(' ')}>
        <DieGlyph pips={5} strokeWidth={6} size={72} />
      </span>
      <span className={[styles.die, styles.gold].join(' ')}>
        <DieGlyph pips={3} strokeWidth={6} size={72} />
      </span>
    </div>
  );
}
