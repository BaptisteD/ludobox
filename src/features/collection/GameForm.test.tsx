import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { gameRepository } from '@/db/gameRepository';
import { playRepository } from '@/db/playRepository';
import { NavigationProvider } from '@/app/navigation/NavigationProvider';
import { GameForm } from './GameForm';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});
afterEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

function renderForm(props: { mode: 'create' | 'edit'; gameId?: string }) {
  return render(
    <NavigationProvider>
      <GameForm {...props} />
    </NavigationProvider>,
  );
}

describe('GameForm — create', () => {
  it('persists a new game from a name and a chosen type', async () => {
    const user = userEvent.setup();
    renderForm({ mode: 'create' });

    await user.type(screen.getByLabelText('Nom du jeu'), 'Catan');
    await user.click(screen.getByRole('radio', { name: 'Compétitif' }));
    await user.click(screen.getByRole('button', { name: 'Créer le jeu' }));

    await waitFor(async () => {
      const all = await gameRepository.getAll();
      expect(all).toHaveLength(1);
      expect(all[0]).toMatchObject({ name: 'Catan', type: 'competitive' });
    });
  });

  it('keeps the CTA dormant while the name is empty, writing nothing', async () => {
    const user = userEvent.setup();
    renderForm({ mode: 'create' });

    const cta = screen.getByRole('button', { name: 'Créer le jeu' });
    expect(cta).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: 'Compétitif' }));
    expect(cta).toBeDisabled(); // a type alone is not enough — name still empty
    expect(await gameRepository.getAll()).toHaveLength(0);
  });

  it('keeps the CTA dormant until a type is chosen, then wakes it', async () => {
    const user = userEvent.setup();
    renderForm({ mode: 'create' });

    await user.type(screen.getByLabelText('Nom du jeu'), 'Catan');
    const cta = screen.getByRole('button', { name: 'Créer le jeu' });
    expect(cta).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: 'Compétitif' }));
    expect(cta).toBeEnabled();
  });

  it('refuses a duplicate name ignoring case and accents', async () => {
    await gameRepository.create({ name: 'Café', type: 'competitive' });
    const user = userEvent.setup();
    renderForm({ mode: 'create' });

    await user.type(screen.getByLabelText('Nom du jeu'), 'cafe');
    await user.click(screen.getByRole('radio', { name: 'Compétitif' }));
    await user.click(screen.getByRole('button', { name: 'Créer le jeu' }));

    expect(
      await screen.findByText('Ce nom est déjà utilisé.'),
    ).toBeInTheDocument();
    expect(await gameRepository.getAll()).toHaveLength(1);
  });

  it('keeps the CTA dormant when min exceeds max', async () => {
    const user = userEvent.setup();
    renderForm({ mode: 'create' });

    await user.type(screen.getByLabelText('Nom du jeu'), 'Catan');
    await user.click(screen.getByRole('radio', { name: 'Compétitif' }));
    await user.type(screen.getByLabelText('Joueurs min'), '5');
    await user.type(screen.getByLabelText('Joueurs max'), '2');

    expect(screen.getByRole('button', { name: 'Créer le jeu' })).toBeDisabled();
  });
});

describe('GameForm — edit', () => {
  it('prefills the fields of the edited game', async () => {
    const g = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
      minPlayers: 3,
      durationMin: 90,
    });
    renderForm({ mode: 'edit', gameId: g.id });

    await waitFor(() =>
      expect(screen.getByLabelText('Nom du jeu')).toHaveValue('Catan'),
    );
    expect(screen.getByLabelText('Joueurs min')).toHaveValue('3');
    expect(screen.getByLabelText('Durée (min)')).toHaveValue('90');
    expect(screen.getByRole('radio', { name: 'Compétitif' })).toBeChecked();
  });

  it('saves an edited name', async () => {
    const g = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
    });
    const user = userEvent.setup();
    renderForm({ mode: 'edit', gameId: g.id });

    const name = await screen.findByLabelText('Nom du jeu');
    await waitFor(() => expect(name).toHaveValue('Catan'));
    await user.clear(name);
    await user.type(name, 'Catane');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(async () =>
      expect((await gameRepository.get(g.id))?.name).toBe('Catane'),
    );
  });

  it('locks the type once a play exists', async () => {
    const g = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
    });
    await playRepository.create({
      gameId: g.id,
      participations: [{ playerId: 'a', isWinner: true }],
    });
    renderForm({ mode: 'edit', gameId: g.id });

    await waitFor(() =>
      expect(screen.getByText(/verrouillé/i)).toBeInTheDocument(),
    );
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });
});
