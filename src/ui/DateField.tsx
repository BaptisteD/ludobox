/**
 * Date field — calendar icon + full readable date (Baloo SemiBold) + faint
 * chevron. Same calm input signature (white, 2px outline, no shadow). Rendered
 * as a button: it opens a picker in a later brique; here it's presentational
 * and the readable date string is supplied by the caller.
 */
import { Calendar, Chevron } from './icons';
import styles from './field.module.css';
import dateStyles from './DateField.module.css';

export interface DateFieldProps {
  label: string;
  /** Human-readable date, e.g. "samedi 7 juin 2025". */
  value: string;
  onClick?: () => void;
  className?: string;
}

export function DateField({
  label,
  value,
  onClick,
  className,
}: DateFieldProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={[styles.field, dateStyles.button, className]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.leading}>
        <Calendar size={20} />
      </span>
      <span className={dateStyles.value}>{value}</span>
      <span className={[styles.trailing, dateStyles.chevron].join(' ')}>
        <Chevron size={20} />
      </span>
    </button>
  );
}
