import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { gameRepository } from '@/db/gameRepository';
import { playerRepository } from '@/db/playerRepository';
import { playRepository } from '@/db/playRepository';
import type { Player } from '@/domain/types';
import { NavigationProvider } from '@/app/navigation/NavigationProvider';
import { PlayerDetail } from './PlayerDetail';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});
afterEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

function renderDetail(player: Player) {
  return render(
    <NavigationProvider>
      <PlayerDetail playerId={player.id} />
    </NavigationProvider>,
  );
}

describe('PlayerDetail — counters', () => {
  it('counts all plays but only competitive wins (coop successes excluded)', async () => {
    const alice = await playerRepository.create({ name: 'Alice' });
    const bob = await playerRepository.create({ name: 'Bob' });
    const catan = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
    });
    const pandemic = await gameRepository.create({
      name: 'Pandemic',
      type: 'cooperative',
    });
    await playRepository.create({
      gameId: catan.id,
      playedAt: new Date('2026-03-15'),
      participations: [
        { playerId: alice.id, isWinner: true, score: 30 },
        { playerId: bob.id, isWinner: false, score: 10 },
      ],
    });
    await playRepository.create({
      gameId: pandemic.id,
      playedAt: new Date('2026-03-20'),
      coopResult: 'success',
      participations: [{ playerId: alice.id }],
    });

    renderDetail(alice);

    // played = 2, wins = 1 (the coop success does not count). Wait on the data,
    // not the static labels which render during the loading state too.
    expect(await screen.findByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Parties jouées')).toBeInTheDocument();
    expect(screen.getByText('Victoires')).toBeInTheDocument();
  });
});

describe('PlayerDetail — history', () => {
  it('renders score, the explicit unset state, and coop results', async () => {
    const alice = await playerRepository.create({ name: 'Alice' });
    const rival = await playerRepository.create({ name: 'Rival' });
    const catan = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
    });
    const pandemic = await gameRepository.create({
      name: 'Pandemic',
      type: 'cooperative',
    });
    await playRepository.create({
      gameId: catan.id,
      playedAt: new Date('2026-03-15'),
      participations: [
        { playerId: alice.id, isWinner: true, score: 42 },
        { playerId: rival.id, isWinner: false, score: 8 },
      ],
    });
    await playRepository.create({
      gameId: catan.id,
      playedAt: new Date('2026-03-10'),
      participations: [
        { playerId: alice.id, isWinner: false, score: null },
        { playerId: rival.id, isWinner: true, score: 50 },
      ],
    });
    await playRepository.create({
      gameId: pandemic.id,
      playedAt: new Date('2026-03-12'),
      coopResult: 'failure',
      participations: [{ playerId: alice.id }],
    });

    renderDetail(alice);

    expect(await screen.findByText('42')).toBeInTheDocument();
    expect(screen.getByText('Score non renseigné')).toBeInTheDocument();
    expect(screen.getByText('Victoire')).toBeInTheDocument();
    expect(screen.getByText('Défaite')).toBeInTheDocument();
    expect(screen.getByText('Échec')).toBeInTheDocument();
  });

  it('shows an empty state and zero counters for a player with no play', async () => {
    const alice = await playerRepository.create({ name: 'Alice' });
    renderDetail(alice);
    expect(
      await screen.findByText(/aucune partie enregistrée/i),
    ).toBeInTheDocument();
  });
});

describe('PlayerDetail — rename', () => {
  it('renames the player; the new name is persisted', async () => {
    const alice = await playerRepository.create({ name: 'Alice' });
    const user = userEvent.setup();
    renderDetail(alice);

    await user.click(
      await screen.findByRole('button', { name: 'Options du joueur' }),
    );
    await user.click(screen.getByRole('menuitem', { name: 'Renommer' }));
    const field = screen.getByLabelText('Nouveau nom');
    await user.clear(field);
    await user.type(field, 'Alicia');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(async () =>
      expect((await playerRepository.get(alice.id))?.name).toBe('Alicia'),
    );
  });

  it('refuses renaming to another active player name', async () => {
    const alice = await playerRepository.create({ name: 'Alice' });
    await playerRepository.create({ name: 'Bob' });
    const user = userEvent.setup();
    renderDetail(alice);

    await user.click(
      await screen.findByRole('button', { name: 'Options du joueur' }),
    );
    await user.click(screen.getByRole('menuitem', { name: 'Renommer' }));
    const field = screen.getByLabelText('Nouveau nom');
    await user.clear(field);
    await user.type(field, 'bob');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ce nom est déjà utilisé.',
    );
  });
});

describe('PlayerDetail — archive', () => {
  it('archives the player after confirmation (kept, dropped from active list)', async () => {
    const alice = await playerRepository.create({ name: 'Alice' });
    const user = userEvent.setup();
    renderDetail(alice);

    await user.click(
      await screen.findByRole('button', { name: 'Options du joueur' }),
    );
    await user.click(
      screen.getByRole('menuitem', { name: 'Supprimer le joueur' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Supprimer le joueur' }),
    );

    await waitFor(async () =>
      expect((await playerRepository.get(alice.id))?.status).toBe('archived'),
    );
    expect(await playerRepository.getActive()).toHaveLength(0);
  });

  it('does not render a valid fiche for an archived player (reachability guard)', async () => {
    const ghost = await playerRepository.create({ name: 'Ghost' });
    await playerRepository.archive(ghost.id);
    renderDetail(ghost);
    expect(
      await screen.findByText(/n’est plus disponible/i),
    ).toBeInTheDocument();
  });
});
