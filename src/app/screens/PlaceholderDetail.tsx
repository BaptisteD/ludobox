/**
 * A placeholder detail screen (Brique 3) — proves the stack mechanics: a back
 * header that pops one cran, a button to dive deeper (multi-level pop), and a
 * button that drops the whole stack (the deleted/archived-object return that
 * briques 4–7 will trigger when an object no longer exists). It deliberately
 * renders no bottom bar — that rule is enforced centrally by `AppShell`.
 */
import { Button } from '@/ui';
import { BackHeader } from '../BackHeader';
import { useNavigation } from '../navigation/useNavigation';
import type { Screen } from '../navigation/types';
import styles from './PlaceholderDetail.module.css';

export function PlaceholderDetail({ screen }: { screen: Screen }) {
  const { push, pop, resetToRoot } = useNavigation();
  return (
    <div className={styles.detail} data-testid="detail">
      <BackHeader title={`Détail niveau ${screen.depth}`} onBack={pop} />
      <div className={styles.body}>
        <p className={styles.hint}>Objet : {screen.id}</p>
        <Button
          label="Descendre d'un niveau"
          onClick={() =>
            push({
              kind: 'placeholder-detail',
              id: `${screen.id}-${screen.depth + 1}`,
              depth: screen.depth + 1,
            })
          }
        />
        <Button label="Simuler une suppression" onClick={resetToRoot} />
      </div>
    </div>
  );
}
