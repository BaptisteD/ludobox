/**
 * Collection — first-level placeholder. Brique 4 fills in the real list; for
 * now it delegates to the shared {@link FirstLevelScreen} mechanics.
 */
import { FirstLevelScreen } from './FirstLevelScreen';

export interface CollectionScreenProps {
  focusNonce: number;
  scrollResetNonce: number;
}

export function CollectionScreen(props: CollectionScreenProps) {
  return <FirstLevelScreen tab="collection" title="Collection" {...props} />;
}
