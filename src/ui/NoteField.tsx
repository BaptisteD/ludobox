/**
 * Multi-line note field — same calm input signature (white, 2px outline, no
 * shadow), top-aligned, grows with content. Note section pairs with a plain
 * `facultatif` label in the caller.
 */
import type { TextareaHTMLAttributes } from 'react';
import { useId } from 'react';
import styles from './field.module.css';
import noteStyles from './NoteField.module.css';

export interface NoteFieldProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'className'
> {
  label: string;
  className?: string;
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

export function NoteField({
  label,
  id,
  className,
  rows = 3,
  ...rest
}: NoteFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={className}>
      <label htmlFor={inputId} style={srOnlyStyle}>
        {label}
      </label>
      <div className={[styles.field, noteStyles.box].join(' ')}>
        <textarea
          id={inputId}
          rows={rows}
          className={[styles.input, noteStyles.textarea].join(' ')}
          {...rest}
        />
      </div>
    </div>
  );
}
