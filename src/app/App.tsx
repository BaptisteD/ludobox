/**
 * Application shell. Brique 0 ships an empty cream canvas framed to the
 * 390px mobile baseline — no business UI yet. Screens arrive in later briques.
 *
 * Brique 2 adds a dev-only UI-kit gallery at `#/ui-gallery`. Real routing
 * arrives in Brique 3; until then a hash check is enough to make the kit a
 * live reference under `npm run dev`.
 */
import { Gallery } from '@/ui/gallery/Gallery';

export default function App() {
  if (window.location.hash === '#/ui-gallery') {
    return <Gallery />;
  }
  return <div className="app-shell" data-testid="app-shell" />;
}
