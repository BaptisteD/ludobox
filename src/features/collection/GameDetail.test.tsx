import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { gameRepository } from '@/db/gameRepository';
import { playRepository } from '@/db/playRepository';
import { NavigationProvider } from '@/app/navigation/NavigationProvider';
import { GameDetail } from './GameDetail';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});
afterEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

function renderDetail(gameId: string) {
  return render(
    <NavigationProvider>
      <GameDetail gameId={gameId} />
    </NavigationProvider>,
  );
}

describe('GameDetail', () => {
  it('shows the game name and an options menu with edit + delete', async () => {
    const g = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
    });
    const user = userEvent.setup();
    renderDetail(g.id);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Catan' }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: 'Options du jeu' }));
    expect(
      screen.getByRole('menuitem', { name: 'Modifier le jeu' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Supprimer le jeu' }),
    ).toBeInTheDocument();
  });

  it('confirms deletion in a sheet naming the game, then cascades', async () => {
    const g = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
    });
    const play = await playRepository.create({
      gameId: g.id,
      participations: [{ playerId: 'a', isWinner: true }],
    });
    const user = userEvent.setup();
    renderDetail(g.id);

    await user.click(
      await screen.findByRole('button', { name: 'Options du jeu' }),
    );
    await user.click(
      screen.getByRole('menuitem', { name: 'Supprimer le jeu' }),
    );

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Catan');

    await user.click(screen.getByRole('button', { name: 'Supprimer le jeu' }));

    await waitFor(async () =>
      expect(await gameRepository.get(g.id)).toBeUndefined(),
    );
    expect(await playRepository.get(play.id)).toBeUndefined();
  });

  it('can cancel the deletion sheet without removing the game', async () => {
    const g = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
    });
    const user = userEvent.setup();
    renderDetail(g.id);

    await user.click(
      await screen.findByRole('button', { name: 'Options du jeu' }),
    );
    await user.click(
      screen.getByRole('menuitem', { name: 'Supprimer le jeu' }),
    );
    await user.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await gameRepository.get(g.id)).toBeDefined();
  });
});
