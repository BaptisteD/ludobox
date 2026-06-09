import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Autocomplete, type AutocompletePlayer } from './Autocomplete';

const PLAYERS: AutocompletePlayer[] = [
  { id: '1', name: 'Camille', color: 'coral' },
  { id: '2', name: 'Théo', color: 'teal' },
  { id: '3', name: 'Camille-Anne', color: 'ink' },
];

describe('Autocomplete', () => {
  it('filters matches case-insensitively by the query', () => {
    render(
      <Autocomplete
        query="cam"
        players={PLAYERS}
        onSelect={() => {}}
        onCreate={() => {}}
      />,
    );

    expect(
      screen.getByRole('option', { name: /^Camille$/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /Camille-Anne/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /Théo/ }),
    ).not.toBeInTheDocument();
  });

  it('selects the clicked player', async () => {
    const onSelect = vi.fn();
    render(<Autocomplete query="Théo" players={PLAYERS} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('option', { name: /Théo/ }));
    expect(onSelect).toHaveBeenCalledWith(PLAYERS[1]);
  });

  it('offers a create-on-the-fly row for a novel name', async () => {
    const onCreate = vi.fn();
    render(
      <Autocomplete
        query="Zoé"
        players={PLAYERS}
        onSelect={() => {}}
        onCreate={onCreate}
      />,
    );

    const createRow = screen.getByRole('button', { name: /Créer « Zoé »/ });
    await userEvent.click(createRow);
    expect(onCreate).toHaveBeenCalledWith('Zoé');
  });

  it('hides the create row when the name already exists exactly', () => {
    render(
      <Autocomplete
        query="Camille"
        players={PLAYERS}
        onSelect={() => {}}
        onCreate={() => {}}
      />,
    );

    expect(screen.queryByText(/Créer «/)).not.toBeInTheDocument();
  });

  it('omits the create row when no onCreate is given', () => {
    render(<Autocomplete query="Zoé" players={PLAYERS} onSelect={() => {}} />);
    expect(screen.queryByText(/Créer «/)).not.toBeInTheDocument();
  });
});
