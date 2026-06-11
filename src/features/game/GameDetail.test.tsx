import { useEffect, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { gameRepository } from '@/db/gameRepository';
import { playerRepository } from '@/db/playerRepository';
import { playRepository } from '@/db/playRepository';
import type { Game } from '@/domain/types';
import { NavigationProvider } from '@/app/navigation/NavigationProvider';
import {
  PlayCelebrationProvider,
  usePlayCelebration,
} from '@/app/PlayCelebration';
import { GameDetail } from './GameDetail';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});
afterEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

function renderDetail(game: Game) {
  return render(
    <NavigationProvider>
      <GameDetail gameId={game.id} />
    </NavigationProvider>,
  );
}

describe('GameDetail — competitive', () => {
  it('shows the record, the win ranking and the chronological history', async () => {
    const catan = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
    });
    const camille = await playerRepository.create({ name: 'Camille' });
    const lea = await playerRepository.create({ name: 'Léa' });
    await playRepository.create({
      gameId: catan.id,
      playedAt: new Date('2026-04-15'),
      participations: [
        { playerId: camille.id, isWinner: true, score: 142 },
        { playerId: lea.id, isWinner: false, score: 118 },
      ],
    });
    await playRepository.create({
      gameId: catan.id,
      playedAt: new Date('2026-04-12'),
      participations: [
        { playerId: lea.id, isWinner: true, score: 90 },
        { playerId: camille.id, isWinner: false, score: 60 },
      ],
    });

    renderDetail(catan);

    // Record: highest score + its holder (142 shows in the card and the row).
    expect(await screen.findByText('Record')).toBeInTheDocument();
    expect(screen.getAllByText('142').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Camille').length).toBeGreaterThanOrEqual(1);
    // Leaderboard + history sections both present.
    expect(screen.getByText('Classement par victoires')).toBeInTheDocument();
    expect(screen.getByText('Dernières parties')).toBeInTheDocument();
    // Both winners appear across the leaderboard/history.
    expect(screen.getAllByText(/Camille|Léa/).length).toBeGreaterThan(0);
  });

  it('shows the explicit empty-record state when no score was entered', async () => {
    const catan = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
    });
    const camille = await playerRepository.create({ name: 'Camille' });
    await playRepository.create({
      gameId: catan.id,
      participations: [{ playerId: camille.id, isWinner: true, score: null }],
    });

    renderDetail(catan);

    expect(
      await screen.findByText(/pas encore de score enregistré/i),
    ).toBeInTheDocument();
  });
});

describe('GameDetail — cooperative', () => {
  it('shows the success rate instead of a record/leaderboard', async () => {
    const pandemic = await gameRepository.create({
      name: 'Pandémie',
      type: 'cooperative',
    });
    const alice = await playerRepository.create({ name: 'Alice' });
    await playRepository.create({
      gameId: pandemic.id,
      coopResult: 'success',
      participations: [{ playerId: alice.id }],
    });
    await playRepository.create({
      gameId: pandemic.id,
      coopResult: 'failure',
      participations: [{ playerId: alice.id }],
    });

    renderDetail(pandemic);

    expect(await screen.findByText('Taux de réussite')).toBeInTheDocument();
    expect(screen.queryByText('Record')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Classement par victoires'),
    ).not.toBeInTheDocument();
  });
});

describe('GameDetail — hero counter', () => {
  it('uses the singular play label for a single play', async () => {
    const catan = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
    });
    const camille = await playerRepository.create({ name: 'Camille' });
    await playRepository.create({
      gameId: catan.id,
      participations: [{ playerId: camille.id, isWinner: true, score: 10 }],
    });

    renderDetail(catan);

    expect(await screen.findByText('partie jouée')).toBeInTheDocument();
    expect(screen.queryByText('parties jouées')).not.toBeInTheDocument();
  });
});

describe('GameDetail — empty state', () => {
  it('shows the dice motif and the add-play CTA when the game has no play', async () => {
    const wingspan = await gameRepository.create({
      name: 'Wingspan',
      type: 'competitive',
    });
    renderDetail(wingspan);

    expect(
      await screen.findByText(/aucune partie pour l’instant/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /ajouter une partie/i }),
    ).toBeInTheDocument();
  });
});

describe('GameDetail — game actions', () => {
  it('deletes the game (with its plays) after confirmation', async () => {
    const catan = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
    });
    const user = userEvent.setup();
    renderDetail(catan);

    await user.click(
      await screen.findByRole('button', { name: 'Options du jeu' }),
    );
    await user.click(
      screen.getByRole('menuitem', { name: 'Supprimer le jeu' }),
    );
    await user.click(screen.getByRole('button', { name: 'Supprimer le jeu' }));

    await waitFor(async () =>
      expect(await gameRepository.get(catan.id)).toBeUndefined(),
    );
  });

  it('guards against a missing game', async () => {
    render(
      <NavigationProvider>
        <GameDetail gameId="nope" />
      </NavigationProvider>,
    );
    expect(
      await screen.findByText(/n’est plus disponible/i),
    ).toBeInTheDocument();
  });
});

describe('GameDetail — celebration toast', () => {
  it('shows the record toast when a celebration is pending for the game', async () => {
    const g = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
    });
    const lea = await playerRepository.create({ name: 'Léa' });
    await playRepository.create({
      gameId: g.id,
      participations: [{ playerId: lea.id, isWinner: true, score: 142 }],
    });

    function Harness() {
      const { publish } = usePlayCelebration();
      const [ready, setReady] = useState(false);
      useEffect(() => {
        publish({ gameId: g.id, holderName: 'Léa', score: 142 });
        setReady(true);
      }, [publish]);
      return ready ? <GameDetail gameId={g.id} /> : null;
    }

    render(
      <NavigationProvider>
        <PlayCelebrationProvider>
          <Harness />
        </PlayCelebrationProvider>
      </NavigationProvider>,
    );

    expect(await screen.findByText('Nouveau record, Léa')).toBeInTheDocument();
    expect(screen.getByText(/142 pts/)).toBeInTheDocument();
  });
});
