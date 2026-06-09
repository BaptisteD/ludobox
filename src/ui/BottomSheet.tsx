/**
 * Destructive/confirm bottom sheet (DESIGN.md §Destructive sheet, §Confirm
 * sheets). Dimmed warm scrim + grabber + 64px coral icon disc + Baloo title +
 * Hanken copy + coral action button + plain "Annuler" text button.
 *
 * Presentational: visibility and the action/cancel handlers are owned by the
 * caller. Renders nothing when closed.
 */
import type { ReactNode } from 'react';
import { Button } from './Button';
import { IconDisc } from './IconDisc';
import styles from './BottomSheet.module.css';

export interface BottomSheetProps {
  open: boolean;
  /** Glyph shown in the 64px coral disc (e.g. <Trash/>, <Undo/>). */
  icon: ReactNode;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
  onCancel: () => void;
  cancelLabel?: string;
}

export function BottomSheet({
  open,
  icon,
  title,
  body,
  actionLabel,
  onAction,
  onCancel,
  cancelLabel = 'Annuler',
}: BottomSheetProps) {
  if (!open) return null;
  return (
    <div className={styles.scrim} onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={styles.sheet}
        onClick={(e) => e.stopPropagation()}
      >
        <span className={styles.grabber} aria-hidden="true" />
        <IconDisc size={64} className={styles.disc}>
          {icon}
        </IconDisc>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>{body}</p>
        <Button label={actionLabel} onClick={onAction} />
        <button type="button" className={styles.cancel} onClick={onCancel}>
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
