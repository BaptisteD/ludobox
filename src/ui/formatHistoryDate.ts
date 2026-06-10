/**
 * Date adapter for `HistoryRow`'s date tile: splits a play date into its day
 * number and short uppercase French month. Lives in the kit alongside
 * `HistoryRow` since both the Fiche jeu and Fiche joueur histories feed it
 * (parallels `avatarColorForName`).
 */
const MONTHS_FR = [
  'JANV',
  'FÉVR',
  'MARS',
  'AVR',
  'MAI',
  'JUIN',
  'JUIL',
  'AOÛT',
  'SEPT',
  'OCT',
  'NOV',
  'DÉC',
];

export function formatHistoryDate(date: Date): { day: number; month: string } {
  return { day: date.getDate(), month: MONTHS_FR[date.getMonth()] };
}
