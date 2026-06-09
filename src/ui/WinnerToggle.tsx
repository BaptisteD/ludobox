/**
 * Winner toggle — a 40px crown control (DESIGN.md §Fiche partie). On = gold
 * fill + ink crown + soft shadow; off = transparent + faint outlined crown.
 * State reads from fill/shadow/icon weight, never color alone. Ex-aequo = many
 * toggles on. Exposed as a switch for assistive tech.
 */
import { CrownFilled, CrownOutline } from './icons';
import styles from './WinnerToggle.module.css';

export interface WinnerToggleProps {
  on: boolean;
  onChange: (on: boolean) => void;
  /** Accessible name, e.g. "Camille a gagné". */
  label: string;
  disabled?: boolean;
  className?: string;
}

export function WinnerToggle({
  on,
  onChange,
  label,
  disabled = false,
  className,
}: WinnerToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={[styles.toggle, on ? styles.on : styles.off, className]
        .filter(Boolean)
        .join(' ')}
    >
      {on ? <CrownFilled size={22} /> : <CrownOutline size={22} />}
    </button>
  );
}
