import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db/db';
import { playerRepository } from '@/db/playerRepository';
import { AddPlayerSheet } from './AddPlayerSheet';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});
afterEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('AddPlayerSheet', () => {
  it('refuses a name already used by an active player', async () => {
    await playerRepository.create({ name: 'Alice' });
    const user = userEvent.setup();
    render(<AddPlayerSheet open onCreated={vi.fn()} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText('Nom du joueur'), 'alice');
    await user.click(screen.getByRole('button', { name: 'Ajouter' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ce nom est déjà utilisé.',
    );
    expect(await playerRepository.getActive()).toHaveLength(1);
  });

  it('refuses an empty name', async () => {
    const user = userEvent.setup();
    render(<AddPlayerSheet open onCreated={vi.fn()} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText('Nom du joueur'), '   ');
    await user.click(screen.getByRole('button', { name: 'Ajouter' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Un nom est requis.',
    );
  });

  it('accepts a name matching only an archived player (homonym allowed)', async () => {
    const ghost = await playerRepository.create({ name: 'Alice' });
    await playerRepository.archive(ghost.id);
    const onCreated = vi.fn();
    const user = userEvent.setup();
    render(<AddPlayerSheet open onCreated={onCreated} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText('Nom du joueur'), 'Alice');
    await user.click(screen.getByRole('button', { name: 'Ajouter' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(await playerRepository.getActive()).toHaveLength(1);
  });

  it('writes nothing on cancel', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<AddPlayerSheet open onCreated={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(onCancel).toHaveBeenCalled();
    expect(await playerRepository.getActive()).toHaveLength(0);
  });
});
