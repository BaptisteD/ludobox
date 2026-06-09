/**
 * Win/loss chip. `Victoire`/`Succès` read as wins (teal + check), `Défaite`/
 * `Échec` as losses (coral + cross). Always icon + text — never color alone
 * (DESIGN.md §Semantic).
 */
import { Check, Cross } from './icons';
import styles from './ResultChip.module.css';

export type ResultKind = 'victoire' | 'defaite' | 'succes' | 'echec';

const LABELS: Record<ResultKind, string> = {
  victoire: 'Victoire',
  defaite: 'Défaite',
  succes: 'Succès',
  echec: 'Échec',
};

const WINS = new Set<ResultKind>(['victoire', 'succes']);

export interface ResultChipProps {
  result: ResultKind;
  className?: string;
}

export function ResultChip({ result, className }: ResultChipProps) {
  const isWin = WINS.has(result);
  const tone = isWin ? styles.win : styles.loss;
  return (
    <span className={[styles.chip, tone, className].filter(Boolean).join(' ')}>
      {isWin ? <Check size={16} /> : <Cross size={16} />}
      {LABELS[result]}
    </span>
  );
}
