import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { gameRepository } from '@/db/gameRepository';
import { AppShell } from './AppShell';
import { NavigationProvider } from './navigation/NavigationProvider';

function renderShell() {
  return render(
    <NavigationProvider>
      <AppShell />
    </NavigationProvider>,
  );
}

const bottomBar = () =>
  screen.queryByRole('navigation', { name: 'Navigation principale' });

beforeEach(async () => {
  // Reset session history between tests so back() behaves predictably.
  window.history.replaceState(null, '', '/');
  await Promise.all(db.tables.map((t) => t.clear()));
});

afterEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('AppShell — shell & tabs', () => {
  it('launches on Collection with the bottom bar showing both entries', () => {
    renderShell();
    const bar = bottomBar();
    expect(bar).toBeInTheDocument();
    expect(within(bar!).getByText('Collection')).toBeInTheDocument();
    expect(within(bar!).getByText('Joueurs')).toBeInTheDocument();
    expect(
      within(bar!).getByRole('button', { name: /Collection/ }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('switches space when the other entry is tapped', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole('button', { name: /Joueurs/ }));
    expect(screen.getByRole('button', { name: /Joueurs/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('opens a placeholder detail from Joueurs and pops back (generic stack)', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole('button', { name: /Joueurs/ }));

    await user.click(screen.getByRole('button', { name: 'Ouvrir un détail' }));
    expect(screen.getByTestId('detail')).toBeInTheDocument();
    expect(bottomBar()).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retour' }));
    await waitFor(() => expect(bottomBar()).toBeInTheDocument());
    expect(screen.queryByTestId('detail')).not.toBeInTheDocument();
  });
});

describe('AppShell — Collection journey', () => {
  it('creates a game through the form; it appears in the list on return', async () => {
    const user = userEvent.setup();
    renderShell();

    await screen.findByText(/aucun jeu/i);
    await user.click(screen.getByRole('button', { name: 'Ajouter un jeu' }));
    await user.type(await screen.findByLabelText('Nom du jeu'), 'Catan');
    await user.click(screen.getByRole('radio', { name: 'Compétitif' }));
    await user.click(screen.getByRole('button', { name: 'Créer le jeu' }));

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Catan, 0 partie' }),
      ).toBeInTheDocument(),
    );
    expect(bottomBar()).toBeInTheDocument();
  });

  it('opens a game detail (bottom bar hidden) and pops back', async () => {
    await gameRepository.create({ name: 'Azul', type: 'competitive' });
    const user = userEvent.setup();
    renderShell();

    await user.click(
      await screen.findByRole('button', { name: 'Azul, 0 partie' }),
    );
    expect(screen.getByTestId('game-detail')).toBeInTheDocument();
    expect(bottomBar()).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retour' }));
    await waitFor(() => expect(bottomBar()).toBeInTheDocument());
  });

  it('deletes a game from its detail and returns to the list without it', async () => {
    await gameRepository.create({ name: 'Azul', type: 'competitive' });
    const user = userEvent.setup();
    renderShell();

    await user.click(
      await screen.findByRole('button', { name: 'Azul, 0 partie' }),
    );
    await user.click(screen.getByRole('button', { name: 'Options du jeu' }));
    await user.click(
      screen.getByRole('menuitem', { name: 'Supprimer le jeu' }),
    );
    await user.click(screen.getByRole('button', { name: 'Supprimer le jeu' }));

    await waitFor(() => expect(bottomBar()).toBeInTheDocument());
    expect(await screen.findByText(/aucun jeu/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Azul/ }),
    ).not.toBeInTheDocument();
  });

  it('edits a game from its detail; the new name shows on the list', async () => {
    await gameRepository.create({ name: 'Azul', type: 'competitive' });
    const user = userEvent.setup();
    renderShell();

    await user.click(
      await screen.findByRole('button', { name: 'Azul, 0 partie' }),
    );
    await user.click(screen.getByRole('button', { name: 'Options du jeu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Modifier le jeu' }));

    const name = await screen.findByLabelText('Nom du jeu');
    await user.clear(name);
    await user.type(name, 'Azul Maître');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    // Saving an edit returns to the detail (recomputed), then back to the list.
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Azul Maître' }),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Retour' }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Azul Maître, 0 partie' }),
      ).toBeInTheDocument(),
    );
  });
});
