/**
 * Game-type chooser for the form. Two options (Compétitif / Coopératif) over a
 * radiogroup, mapping the French labels to the domain's English {@link GameType}.
 * Once a play exists the type is immutable: it renders as a locked `Tag` with an
 * explicit textual cue (never color alone), per formulaire-jeu §9 / US3.
 */
import { Tag, type GameType as TagType } from '@/ui';
import { Trophy, Users } from '@/ui/icons';
import type { GameType } from '@/domain/types';
import styles from './GameTypeField.module.css';

export interface GameTypeFieldProps {
  value?: GameType;
  onChange: (type: GameType) => void;
  /** True when the game already has plays: type is shown but not editable. */
  locked?: boolean;
  className?: string;
}

const OPTIONS: {
  value: GameType;
  label: string;
  tag: TagType;
  Icon: typeof Trophy;
}[] = [
  { value: 'competitive', label: 'Compétitif', tag: 'competitif', Icon: Trophy },
  { value: 'cooperative', label: 'Coopératif', tag: 'cooperatif', Icon: Users },
];

export function GameTypeField({
  value,
  onChange,
  locked = false,
  className,
}: GameTypeFieldProps) {
  const wrap = [styles.field, className].filter(Boolean).join(' ');

  if (locked && value) {
    const tag = OPTIONS.find((o) => o.value === value)!.tag;
    return (
      <div className={wrap}>
        <span className={styles.legend}>Type</span>
        <div className={styles.locked}>
          <Tag type={tag} />
          <span className={styles.lockNote}>
            Verrouillé — une partie existe
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={wrap} role="radiogroup" aria-label="Type de jeu">
      <span className={styles.legend} aria-hidden="true">
        Type
      </span>
      <div className={styles.options}>
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={[styles.option, selected ? styles.selected : null]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onChange(option.value)}
            >
              <span className={styles.optionIcon}>
                <option.Icon size={18} />
              </span>
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
