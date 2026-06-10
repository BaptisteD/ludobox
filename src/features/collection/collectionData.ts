/**
 * Read model for the Collection list. Counts are computed at read time (the
 * project invariant: never stored). The sort is a pure function so it can be
 * unit-tested without a database; the loader joins games with their play counts.
 */
import { gameRepository } from '@/db/gameRepository';
import { playRepository } from '@/db/playRepository';
import type { Game } from '@/domain/types';

export interface GameEntry {
  game: Game;
  playCount: number;
}

/**
 * Alphabetical order, case/accent-insensitive in the French locale (PRD Listes
 * §8.3). Game names are unique, so ties are unreachable; we still break them by
 * id for a deterministic order. Returns a new array — never mutates the input.
 */
export function sortGamesByName(games: Game[]): Game[] {
  return [...games].sort(
    (a, b) =>
      a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }) ||
      a.id.localeCompare(b.id),
  );
}

export interface CollectionDeps {
  games: Pick<typeof gameRepository, 'getAll'>;
  plays: Pick<typeof playRepository, 'countByGame'>;
}

const defaultDeps: CollectionDeps = {
  games: gameRepository,
  plays: playRepository,
};

/** Loads every game, sorted, each paired with its read-time play count. */
export async function loadCollection(
  deps: CollectionDeps = defaultDeps,
): Promise<GameEntry[]> {
  const [games, counts] = await Promise.all([
    deps.games.getAll(),
    deps.plays.countByGame(),
  ]);
  return sortGamesByName(games).map((game) => ({
    game,
    playCount: counts.get(game.id) ?? 0,
  }));
}
