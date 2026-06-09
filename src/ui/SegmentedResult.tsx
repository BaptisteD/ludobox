/**
 * Résultat collectif (cooperative) — a white two-segment track. The selected
 * segment fills its semantic color with cream label + icon; the other stays
 * transparent with muted ink. Same win/loss semantics as the history chips
 * (DESIGN.md §Fiche partie components). Modeled as a radiogroup.
 */
import { Check, Cross } from './icons';
import styles from './SegmentedResult.module.css';

export type CoopResult = 'succes' | 'echec';

export interface SegmentedResultProps {
  value: CoopResult;
  onChange: (value: CoopResult) => void;
  className?: string;
}

const SEGMENTS: ReadonlyArray<{
  value: CoopResult;
  label: string;
  cls: string;
}> = [
  { value: 'succes', label: 'Succès', cls: 'succes' },
  { value: 'echec', label: 'Échec', cls: 'echec' },
];

export function SegmentedResult({
  value,
  onChange,
  className,
}: SegmentedResultProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Résultat collectif"
      className={[styles.track, className].filter(Boolean).join(' ')}
    >
      {SEGMENTS.map(({ value: v, label, cls }) => {
        const selected = v === value;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(v)}
            className={[styles.segment, selected ? styles[cls] : styles.idle]
              .filter(Boolean)
              .join(' ')}
          >
            {v === 'succes' ? <Check size={18} /> : <Cross size={18} />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
