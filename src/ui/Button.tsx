/**
 * The primary CTA — coral pill-rect, 56px tall, icon + Baloo label, the full
 * signature (2.5px outline + hard offset shadow). The single most important
 * affordance (DESIGN.md §Components).
 *
 * Disabled = the same shape gone dormant: flat putty fill, NO shadow (the hard
 * shadow is what reads as "alive/pressable"), faint outline, muted label.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  label: string;
  /** Leading icon (e.g. <Plus/> or <Check/>). */
  icon?: ReactNode;
}

export function Button({
  label,
  icon,
  disabled = false,
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[styles.cta, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      {label}
    </button>
  );
}
