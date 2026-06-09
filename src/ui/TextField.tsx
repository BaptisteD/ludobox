/**
 * Single-line text field — white, 2px ink outline, radius 14, no shadow.
 * Optional leading/trailing slots; `accent` switches the focus outline + caret
 * to coral (used by the add-player field). Presentational wrapper around a
 * native input so labels/state stay in the caller.
 */
import type { InputHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';
import styles from './field.module.css';

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className'
> {
  label: string;
  /** Visually hide the label (still read by assistive tech). */
  hideLabel?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Coral focus outline + caret. */
  accent?: boolean;
  className?: string;
}

export function TextField({
  label,
  hideLabel = true,
  leading,
  trailing,
  accent = false,
  id,
  className,
  ...rest
}: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={className}>
      <label htmlFor={inputId} style={hideLabel ? srOnlyStyle : undefined}>
        {label}
      </label>
      <div
        className={[styles.field, accent ? styles.accent : null]
          .filter(Boolean)
          .join(' ')}
      >
        {leading ? <span className={styles.leading}>{leading}</span> : null}
        <input id={inputId} className={styles.input} {...rest} />
        {trailing ? <span className={styles.trailing}>{trailing}</span> : null}
      </div>
    </div>
  );
}

const srOnlyStyle = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;
