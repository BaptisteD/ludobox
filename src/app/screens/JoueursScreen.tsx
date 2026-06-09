/**
 * Joueurs — first-level placeholder. Brique 5 fills in the real list; for now
 * it delegates to the shared {@link FirstLevelScreen} mechanics.
 */
import { FirstLevelScreen } from './FirstLevelScreen';

export interface JoueursScreenProps {
  focusNonce: number;
  scrollResetNonce: number;
}

export function JoueursScreen(props: JoueursScreenProps) {
  return <FirstLevelScreen tab="joueurs" title="Joueurs" {...props} />;
}
