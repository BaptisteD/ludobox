import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
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

beforeEach(() => {
  // Reset session history between tests so back() behaves predictably.
  window.history.replaceState(null, '', '/');
});

describe('AppShell navigation', () => {
  it('launches on Collection with the bottom bar showing both entries', () => {
    renderShell();
    const bar = bottomBar();
    expect(bar).toBeInTheDocument();
    expect(within(bar!).getByText('Collection')).toBeInTheDocument();
    expect(within(bar!).getByText('Joueurs')).toBeInTheDocument();
    // Active tab carried for assistive tech, not by color alone.
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

  it('hides the bottom bar in a detail and shows it again on back', async () => {
    const user = userEvent.setup();
    renderShell();
    expect(bottomBar()).toBeInTheDocument();

    await user.click(
      screen.getAllByRole('button', { name: 'Ouvrir un détail' })[0],
    );
    expect(screen.getByTestId('detail')).toBeInTheDocument();
    expect(bottomBar()).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retour' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retour' }));
    await waitFor(() => expect(bottomBar()).toBeInTheDocument());
    expect(screen.queryByTestId('detail')).not.toBeInTheDocument();
  });

  it('recomputes the first-level screen on return (read count bumps)', async () => {
    const user = userEvent.setup();
    renderShell();
    expect(screen.getByTestId('reads-collection')).toHaveTextContent(
      'Lectures : 1',
    );

    await user.click(
      screen.getAllByRole('button', { name: 'Ouvrir un détail' })[0],
    );
    await user.click(screen.getByRole('button', { name: 'Retour' }));

    await waitFor(() =>
      expect(screen.getByTestId('reads-collection')).toHaveTextContent(
        'Lectures : 2',
      ),
    );
  });

  it('returns straight to first level when the object is removed (resetToRoot)', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(
      screen.getAllByRole('button', { name: 'Ouvrir un détail' })[0],
    );
    await user.click(
      screen.getByRole('button', { name: "Descendre d'un niveau" }),
    );
    expect(screen.getByText('Détail niveau 2')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Simuler une suppression' }),
    );
    await waitFor(() => expect(bottomBar()).toBeInTheDocument());
    expect(screen.queryByTestId('detail')).not.toBeInTheDocument();
  });
});
