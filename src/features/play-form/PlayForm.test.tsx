import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { gameRepository } from '@/db/gameRepository';
import { playerRepository } from '@/db/playerRepository';
import { playRepository } from '@/db/playRepository';
import { participationRepository } from '@/db/participationRepository';
import { NavigationProvider } from '@/app/navigation/NavigationProvider';
import { PlayCelebrationProvider } from '@/app/PlayCelebration';
import type { Screen } from '@/app/navigation/types';
import { PlayForm } from './PlayForm';

beforeEach(async () => {
  window.history.replaceState(null, '', '/');
  await Promise.all(db.tables.map((t) => t.clear()));
});
afterEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

function renderForm(screenProp: Extract<Screen, { kind: 'play-form' }>) {
  return render(
    <NavigationProvider>
      <PlayCelebrationProvider>
        <PlayForm screen={screenProp} />
      </PlayCelebrationProvider>
    </NavigationProvider>,
  );
}

const createScreen = (
  gameId: string,
): Extract<Screen, { kind: 'play-form' }> => ({
  kind: 'play-form',
  mode: 'create',
  gameId,
  origin: 'game',
  id: gameId,
  depth: 2,
});

describe('PlayForm — competitive create', () => {
  it('keeps Save dormant with the hint until a winner is designated', async () => {
    const g = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
    });
    await playerRepository.create({ name: 'Léa' });
    const user = userEvent.setup();
    renderForm(createScreen(g.id));

    await screen.findByText('Nouvelle partie');
    await user.type(screen.getByLabelText('Ajouter un joueur'), 'Lé');
    await user.click(await screen.findByRole('option', { name: /Léa/ }));

    const save = screen.getByRole('button', { name: 'Enregistrer la partie' });
    expect(save).toBeDisabled();
    expect(
      screen.getByText('Désigne le gagnant pour enregistrer la partie.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: /Léa a gagné/ }));
    expect(save).toBeEnabled();
  });

  it('persists the play with a score and winner', async () => {
    const g = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
    });
    await playerRepository.create({ name: 'Léa' });
    const user = userEvent.setup();
    renderForm(createScreen(g.id));

    await screen.findByText('Nouvelle partie');
    await user.type(screen.getByLabelText('Ajouter un joueur'), 'Lé');
    await user.click(await screen.findByRole('option', { name: /Léa/ }));
    await user.type(screen.getByLabelText(/Score de Léa/), '142');
    await user.click(screen.getByRole('switch', { name: /Léa a gagné/ }));
    await user.click(
      screen.getByRole('button', { name: 'Enregistrer la partie' }),
    );

    await waitFor(async () => {
      const all = await playRepository.listByGame(g.id);
      expect(all).toHaveLength(1);
    });
    const [play] = await playRepository.listByGame(g.id);
    const parts = await participationRepository.listByPlay(play.id);
    expect(parts[0]).toMatchObject({ score: 142, isWinner: true });
  });

  it('accepts ex-aequo (multiple winners) and persists both', async () => {
    const g = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
    });
    await playerRepository.create({ name: 'Léa' });
    await playerRepository.create({ name: 'Tom' });
    const user = userEvent.setup();
    renderForm(createScreen(g.id));

    await screen.findByText('Nouvelle partie');
    await user.type(screen.getByLabelText('Ajouter un joueur'), 'Lé');
    await user.click(await screen.findByRole('option', { name: /Léa/ }));
    await user.type(screen.getByLabelText('Ajouter un joueur'), 'Tom');
    await user.click(await screen.findByRole('option', { name: /Tom/ }));

    await user.click(screen.getByRole('switch', { name: /Léa a gagné/ }));
    await user.click(screen.getByRole('switch', { name: /Tom a gagné/ }));

    const save = screen.getByRole('button', { name: 'Enregistrer la partie' });
    expect(save).toBeEnabled();
    await user.click(save);

    await waitFor(async () => {
      const [play] = await playRepository.listByGame(g.id);
      expect(play).toBeTruthy();
    });
    const [play] = await playRepository.listByGame(g.id);
    const parts = await participationRepository.listByPlay(play.id);
    expect(parts.filter((p) => p.isWinner)).toHaveLength(2);
  });

  it('creates a player on the fly from the autocomplete', async () => {
    const g = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
    });
    const user = userEvent.setup();
    renderForm(createScreen(g.id));

    await screen.findByText('Nouvelle partie');
    await user.type(screen.getByLabelText('Ajouter un joueur'), 'Nina');
    // The Autocomplete create row renders as a button (not role="option")
    await user.click(
      await screen.findByRole('button', { name: /Créer .*Nina/ }),
    );
    await user.click(screen.getByRole('switch', { name: /Nina a gagné/ }));
    await user.click(
      screen.getByRole('button', { name: 'Enregistrer la partie' }),
    );

    await waitFor(async () =>
      expect((await playerRepository.getActive()).map((p) => p.name)).toContain(
        'Nina',
      ),
    );
  });
});

describe('PlayForm — cooperative create', () => {
  it('has no score/winner and Save is active with one participant', async () => {
    const g = await gameRepository.create({
      name: 'Pandémie',
      type: 'cooperative',
    });
    await playerRepository.create({ name: 'Léa' });
    const user = userEvent.setup();
    renderForm(createScreen(g.id));

    await screen.findByText('Nouvelle partie');
    await user.type(screen.getByLabelText('Ajouter un joueur'), 'Lé');
    await user.click(await screen.findByRole('option', { name: /Léa/ }));

    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(
      screen.getByRole('radiogroup', { name: 'Résultat collectif' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Enregistrer la partie' }),
    ).toBeEnabled();
  });

  it('saves a cooperative play with its chosen collective result', async () => {
    const g = await gameRepository.create({
      name: 'Pandémie',
      type: 'cooperative',
    });
    await playerRepository.create({ name: 'Léa' });
    const user = userEvent.setup();
    renderForm(createScreen(g.id));

    await screen.findByText('Nouvelle partie');
    await user.type(screen.getByLabelText('Ajouter un joueur'), 'Lé');
    await user.click(await screen.findByRole('option', { name: /Léa/ }));
    await user.click(screen.getByRole('radio', { name: /Échec/ }));
    await user.click(
      screen.getByRole('button', { name: 'Enregistrer la partie' }),
    );

    await waitFor(async () => {
      const [play] = await playRepository.listByGame(g.id);
      expect(play?.coopResult).toBe('failure');
    });
  });
});

describe('PlayForm — edit', () => {
  it('pre-fills participants and persists a corrected score', async () => {
    const g = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
    });
    const lea = await playerRepository.create({ name: 'Léa' });
    const play = await playRepository.create({
      gameId: g.id,
      participations: [{ playerId: lea.id, isWinner: true, score: 10 }],
    });
    const user = userEvent.setup();
    renderForm({
      kind: 'play-form',
      mode: 'edit',
      playId: play.id,
      origin: 'game',
      id: play.id,
      depth: 2,
    });

    await screen.findByText('Modifier la partie');
    const score = await screen.findByLabelText(/Score de Léa/);
    await waitFor(() => expect(score).toHaveValue('10'));
    await user.clear(score);
    await user.type(score, '55');
    await user.click(
      screen.getByRole('button', { name: 'Enregistrer les modifications' }),
    );

    await waitFor(async () => {
      const parts = await participationRepository.listByPlay(play.id);
      expect(parts[0].score).toBe(55);
    });
  });

  it('deletes the play from the edit overflow menu', async () => {
    const g = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
    });
    const lea = await playerRepository.create({ name: 'Léa' });
    const play = await playRepository.create({
      gameId: g.id,
      participations: [{ playerId: lea.id, isWinner: true, score: 10 }],
    });
    const user = userEvent.setup();
    renderForm({
      kind: 'play-form',
      mode: 'edit',
      playId: play.id,
      origin: 'game',
      id: play.id,
      depth: 2,
    });

    await screen.findByText('Modifier la partie');
    await user.click(
      screen.getByRole('button', { name: 'Options de la partie' }),
    );
    await user.click(
      screen.getByRole('menuitem', { name: 'Supprimer la partie' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Supprimer la partie' }),
    );

    await waitFor(async () => {
      expect(await playRepository.get(play.id)).toBeUndefined();
    });
  });
});

describe('PlayForm — abandon guard', () => {
  it('prompts on Back when there are unsaved changes', async () => {
    const g = await gameRepository.create({
      name: 'Catan',
      type: 'competitive',
    });
    await playerRepository.create({ name: 'Léa' });
    const user = userEvent.setup();
    renderForm(createScreen(g.id));

    await screen.findByText('Nouvelle partie');
    await user.type(screen.getByLabelText('Ajouter un joueur'), 'Lé');
    await user.click(await screen.findByRole('option', { name: /Léa/ }));

    await user.click(screen.getByRole('button', { name: 'Retour' }));
    expect(
      await screen.findByRole('button', { name: 'Abandonner' }),
    ).toBeInTheDocument();
  });
});
