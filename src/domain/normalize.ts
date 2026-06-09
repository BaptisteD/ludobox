/**
 * Single source of truth for name comparison across the domain.
 *
 * Used by every uniqueness check (game names, active player names). Two names
 * are considered "the same" when their normalized forms are equal, i.e.
 * comparison is case- and accent-insensitive.
 *
 * Steps: NFD decomposition (splits accented letters into base + combining
 * mark), strip the combining marks, lowercase, trim.
 */
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
