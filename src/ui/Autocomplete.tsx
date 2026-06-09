/**
 * Player autocomplete popover (DESIGN.md §Fiche partie components). White
 * surface, 2px outline + offset shadow, hairline dividers. Matching active
 * players (avatar + name) on top; a create-on-the-fly row on cream-raised with
 * a coral `+` disc when the typed name isn't already an exact match.
 *
 * Filtering is case-insensitive substring; an empty query lists all players
 * with no create row. Presentational + filtering only — selection/creation are
 * delegated to the caller.
 */
import { Plus } from './icons';
import { Avatar, type AvatarColor } from './Avatar';
import { IconDisc } from './IconDisc';
import styles from './Autocomplete.module.css';

export interface AutocompletePlayer {
  id: string;
  name: string;
  color?: AvatarColor;
}

export interface AutocompleteProps {
  query: string;
  players: ReadonlyArray<AutocompletePlayer>;
  onSelect: (player: AutocompletePlayer) => void;
  /** When provided, a create-on-the-fly row is offered for novel names. */
  onCreate?: (name: string) => void;
  className?: string;
}

export function Autocomplete({
  query,
  players,
  onSelect,
  onCreate,
  className,
}: AutocompleteProps) {
  const trimmed = query.trim();
  const needle = trimmed.toLowerCase();
  const matches = needle
    ? players.filter((p) => p.name.toLowerCase().includes(needle))
    : players;
  const hasExact = players.some((p) => p.name.toLowerCase() === needle);
  const showCreate = Boolean(onCreate) && trimmed !== '' && !hasExact;

  return (
    <div
      className={[styles.popover, className].filter(Boolean).join(' ')}
      role="listbox"
    >
      {matches.map((player) => (
        <button
          key={player.id}
          type="button"
          role="option"
          aria-selected={false}
          className={styles.row}
          onClick={() => onSelect(player)}
        >
          <Avatar
            name={player.name}
            color={player.color ?? 'coral'}
            size={36}
          />
          <span className={styles.name}>{player.name}</span>
        </button>
      ))}
      {showCreate ? (
        <button
          type="button"
          className={[styles.row, styles.create].join(' ')}
          onClick={() => onCreate!(trimmed)}
        >
          <IconDisc size={36}>
            <Plus size={20} />
          </IconDisc>
          <span className={styles.createText}>
            <span className={styles.name}>Créer « {trimmed} »</span>
            <span className={styles.subline}>Nouveau joueur</span>
          </span>
        </button>
      ) : null}
    </div>
  );
}
