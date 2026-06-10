import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { playerRepository } from '@/db/playerRepository';
import { NavigationProvider } from '@/app/navigation/NavigationProvider';
import { PlayersScreen } from './PlayersScreen';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});
afterEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

function renderScreen(focusNonce = 0, scrollResetNonce = 0) {
  return render(
    <NavigationProvider>
      <PlayersScreen
        focusNonce={focusNonce}
        scrollResetNonce={scrollResetNonce}
      />
    </NavigationProvider>,
  );
}

describe('PlayersScreen', () => {
  it('shows an inviting empty state with the create CTA when there is no player', async () => {
    renderScreen();
    expect(await screen.findByText(/aucun joueur/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ajouter un joueur' }),
    ).toBeInTheDocument();
  });

  it('lists active players sorted, with a read-time play count, omitting archived', async () => {
    await playerRepository.create({ name: 'Bob' });
    await playerRepository.create({ name: 'Alice' });
    const ghost = await playerRepository.create({ name: 'Ghost' });
    await playerRepository.archive(ghost.id);

    renderScreen();

    const rows = await screen.findAllByRole('button', { name: /partie/ });
    expect(rows.map((r) => r.getAttribute('aria-label'))).toEqual([
      'Alice, 0 partie',
      'Bob, 0 partie',
    ]);
    expect(screen.queryByText('Ghost')).not.toBeInTheDocument();
  });

  it('creates a player through the sheet; it appears in the list', async () => {
    const user = userEvent.setup();
    renderScreen();
    await screen.findByText(/aucun joueur/i);

    await user.click(screen.getByRole('button', { name: 'Ajouter un joueur' }));
    await user.type(await screen.findByLabelText('Nom du joueur'), 'Mona');
    await user.click(screen.getByRole('button', { name: 'Ajouter' }));

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Mona, 0 partie' }),
      ).toBeInTheDocument(),
    );
  });
});
