import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/app/App';
import '@/styles/fonts.css';
import '@/styles/tokens.css';
import '@/styles/global.css';

if (import.meta.env.DEV) {
  // Test seam for Playwright fixtures: the e2e specs seed games/players/plays
  // straight through the repos to set up read screens and edit/delete scenarios.
  // Dev-only, so the production bundle never carries it.
  void Promise.all([
    import('@/db/gameRepository'),
    import('@/db/playerRepository'),
    import('@/db/playRepository'),
  ]).then(([games, players, plays]) => {
    (window as unknown as { __ludobox: unknown }).__ludobox = {
      gameRepository: games.gameRepository,
      playerRepository: players.playerRepository,
      playRepository: plays.playRepository,
    };
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
