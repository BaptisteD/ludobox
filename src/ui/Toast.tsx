/**
 * Saved-confirmation / win-celebration toast (DESIGN.md §Saved confirmation).
 * The single earned acknowledgement a logged win gets, doubling as the save
 * confirmation. Gold, tilted -1.4°, the record family's signature. Left: the
 * winner's avatar with a small cream crown badge. Right: a Baloo headline over
 * a gold/on-gold subline with an ink check.
 *
 * Lifecycle: bounces up from below the screen, holds for `duration`, then slides
 * back down through the bottom and calls `onDismiss` so the host can unmount it.
 * Degrades to an instant appearance/disappearance under prefers-reduced-motion
 * (handled in the stylesheet — the component renders identically either way).
 * Announced politely to assistive tech.
 */
import { useEffect, useState } from 'react';
import { Check, CrownFilled } from './icons';
import { Avatar, type AvatarColor } from './Avatar';
import styles from './Toast.module.css';

export interface ToastProps {
  /** Winner name (drives the avatar initial). */
  name: string;
  avatarColor?: AvatarColor;
  /** Celebratory line, e.g. "Nouveau record, Camille" or "Camille l'emporte". */
  headline: string;
  /** The "saved" half, e.g. "Partie enregistrée · 142 pts". */
  subline: string;
  /** Visible time before the toast slides back out, in ms. */
  duration?: number;
  /** Called once the leave animation has finished — host should unmount. */
  onDismiss?: () => void;
  className?: string;
}

export function Toast({
  name,
  avatarColor = 'coral',
  headline,
  subline,
  duration = 4200,
  onDismiss,
  className,
}: ToastProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLeaving(true), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      data-phase={leaving ? 'leave' : 'enter'}
      onAnimationEnd={() => {
        if (leaving) onDismiss?.();
      }}
      className={[styles.toast, className].filter(Boolean).join(' ')}
    >
      <span className={styles.avatar}>
        <Avatar name={name} color={avatarColor} size={48} />
        <span className={styles.badge} aria-hidden="true">
          <CrownFilled size={16} />
        </span>
      </span>
      <span className={styles.text}>
        <span className={styles.headline}>{headline}</span>
        <span className={styles.subline}>
          <Check size={14} />
          {subline}
        </span>
      </span>
    </div>
  );
}
