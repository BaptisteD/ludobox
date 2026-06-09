/**
 * Application root. Brique 3 mounts the navigation shell — two first-level
 * spaces (Collection, Joueurs) and the detail stack — wrapped in the
 * `NavigationProvider` (stack logic + history/back-gesture sync).
 *
 * The dev-only UI-kit gallery stays reachable at `#/ui-gallery`, deliberately
 * outside the nav system as a living reference under `npm run dev`.
 */
import { AppShell } from './AppShell';
import { NavigationProvider } from './navigation/NavigationProvider';
import { Gallery } from '@/ui/gallery/Gallery';

export default function App() {
  if (window.location.hash === '#/ui-gallery') {
    return <Gallery />;
  }
  return (
    <NavigationProvider>
      <AppShell />
    </NavigationProvider>
  );
}
