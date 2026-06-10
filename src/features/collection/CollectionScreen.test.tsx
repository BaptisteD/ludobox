import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { gameRepository } from '@/db/gameRepository';
import { playRepository } from '@/db/playRepository';
import { NavigationProvider } from '@/app/navigation/NavigationProvider';
import { CollectionScreen } from './CollectionScreen';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});
afterEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

function renderScreen(focusNonce = 0, scrollResetNonce = 0) {
  return render(
    <NavigationProvider>
      <CollectionScreen
        focusNonce={focusNonce}
        scrollResetNonce={scrollResetNonce}
      />
    </NavigationProvider>,
  );
}

describe('CollectionScreen', () => {
  it('shows an inviting empty state with the create CTA when there is no game', async () => {
    renderScreen();
    expect(await screen.findByText(/aucun jeu/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ajouter un jeu' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /partie/ })).toBeNull();
  });

  it('lists games alphabetically with a read-time play count and unit', async () => {
    const catan = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
    });
    await gameRepository.create({ name: 'Azul', type: 'competitive' });
    await playRepository.create({
      gameId: catan.id,
      participations: [{ playerId: 'a', isWinner: true }],
    });
    await playRepository.create({
      gameId: catan.id,
      participations: [{ playerId: 'b', isWinner: true }],
    });

    renderScreen();

    const rows = await screen.findAllByRole('button', { name: /partie/ });
    expect(rows.map((r) => r.getAttribute('aria-label'))).toEqual([
      'Azul, 0 partie',
      'Catan, 2 parties',
    ]);
  });

  it('recomputes the list when the focus nonce bumps (return from a mutation)', async () => {
    const { rerender } = renderScreen(0);
    expect(await screen.findByText(/aucun jeu/i)).toBeInTheDocument();

    await gameRepository.create({ name: 'Catan', type: 'competitive' });
    rerender(
      <NavigationProvider>
        <CollectionScreen focusNonce={1} scrollResetNonce={0} />
      </NavigationProvider>,
    );

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Catan, 0 partie' }),
      ).toBeInTheDocument(),
    );
  });
});
