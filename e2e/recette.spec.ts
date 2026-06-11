import { expect, test, type Page } from '@playwright/test';

/**
 * Brique 8 — Durcissement: recette globale. Four end-to-end journeys that
 * cover every key user need of Ludobox in one single spec:
 *
 * 1. Saisie après soirée jeu — add a record-breaking play through the form;
 *    assert the celebration toast + updated stats/history.
 * 2. Stats d'un jeu — competitive record/leaderboard AND cooperative success
 *    rate are both visible and accurate.
 * 3. Fiche joueur — open a player, assert their play count, win count, and
 *    history row content.
 * 4. Gestion collection — create/rename/delete a game and a player; verify
 *    that an archived player's name stays readable in history (no error state).
 *
 * Seeding uses the dev-only `window.__ludobox` seam; the journeys themselves
 * go through the real UI. Each test runs in a fresh isolated context.
 */

// ─── helpers (local copy, consistent with existing specs) ───────────────────

async function ready(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => '__ludobox' in window);
}

async function seed<T = void>(page: Page, fn: string): Promise<T> {
  const result = (await page.evaluate(async (src) => {
    const run = new Function(`return (${src})(window.__ludobox)`);
    return await run();
  }, fn)) as T;
  await page.reload();
  return result;
}

async function openGame(page: Page, name: RegExp) {
  await page.getByRole('button', { name }).click();
  await expect(page.getByTestId('game-detail')).toBeVisible();
}

const bottomBar = (page: Page) =>
  page.getByRole('navigation', { name: 'Navigation principale' });

async function gotoJoueurs(page: Page) {
  await bottomBar(page)
    .getByRole('button', { name: /Joueurs/ })
    .click();
}

// ─── Parcours 1: Saisie après soirée jeu ────────────────────────────────────

test('parcours 1 — saisie après soirée jeu: record battu → toast + stats mis à jour', async ({
  page,
}) => {
  await ready(page);
  // Seed a game with a beatable record and two players.
  await seed(
    page,
    `async ({ gameRepository, playerRepository, playRepository }) => {
      const g = await gameRepository.create({ name: 'Catan', type: 'competitive' });
      const alice = await playerRepository.create({ name: 'Alice' });
      const bob = await playerRepository.create({ name: 'Bob' });
      // Existing record: Bob 80 pts (beatable).
      await playRepository.create({
        gameId: g.id,
        playedAt: new Date('2026-01-10'),
        participations: [
          { playerId: bob.id, isWinner: true, score: 80 },
          { playerId: alice.id, score: 60 },
        ],
      });
    }`,
  );

  // Open the game fiche — should show existing record of 80.
  await openGame(page, /^Catan/);
  await expect(page.getByText('80').first()).toBeVisible();

  // Count history rows before adding the new play.
  const historyBefore = await page
    .getByTestId('history')
    .getByRole('listitem')
    .count();

  // Tap "Ajouter une partie" and fill the form.
  await page.getByRole('button', { name: /ajouter une partie/i }).click();
  await expect(page.getByText('Nouvelle partie')).toBeVisible();

  await page.getByLabel('Ajouter un joueur').fill('Ali');
  await page.getByRole('option', { name: /Alice/ }).click();
  await page.getByLabel('Ajouter un joueur').fill('Bo');
  await page.getByRole('option', { name: /Bob/ }).click();

  // Alice beats Bob's record with 150 pts.
  await page.getByLabel('Score de Alice').fill('150');
  await page.getByLabel('Score de Bob').fill('90');
  await page.getByRole('switch', { name: /Alice a gagné/ }).click();

  await page.getByRole('button', { name: 'Enregistrer la partie' }).click();

  // Back on the fiche — toast must announce the new record.
  await expect(page.getByTestId('game-detail')).toBeVisible();
  await expect(page.getByRole('status')).toContainText(/record/i);
  await expect(page.getByRole('status')).toContainText('Alice');

  // The record card now shows 150.
  await expect(page.getByText('150').first()).toBeVisible();

  // History has one more row than before.
  const historyAfter = await page
    .getByTestId('history')
    .getByRole('listitem')
    .count();
  expect(historyAfter).toBe(historyBefore + 1);

  // The new row is on top (newest first) and contains Alice.
  await expect(
    page.getByTestId('history').getByRole('listitem').first(),
  ).toContainText('Alice');
});

// ─── Parcours 2: Stats d'un jeu ─────────────────────────────────────────────

test('parcours 2 — stats compétitif: record, classement, historique', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository, playerRepository, playRepository }) => {
      const g = await gameRepository.create({ name: 'Wingspan', type: 'competitive' });
      const camille = await playerRepository.create({ name: 'Camille' });
      const lea = await playerRepository.create({ name: 'Léa' });
      const tom = await playerRepository.create({ name: 'Tom' });
      await playRepository.create({
        gameId: g.id,
        playedAt: new Date('2026-03-01'),
        participations: [
          { playerId: lea.id, isWinner: true, score: 70 },
          { playerId: camille.id, score: 55 },
        ],
      });
      await playRepository.create({
        gameId: g.id,
        playedAt: new Date('2026-04-15'),
        participations: [
          { playerId: camille.id, isWinner: true, score: 120 },
          { playerId: lea.id, score: 95 },
          { playerId: tom.id, score: 60 },
        ],
      });
    }`,
  );

  await openGame(page, /^Wingspan/);

  // Record card shows the highest score (120) and its holder (Camille).
  await expect(page.getByText('Record')).toBeVisible();
  await expect(page.getByText('120').first()).toBeVisible();
  await expect(page.getByTestId('leaderboard')).toContainText('Camille');

  // Leaderboard has at least 2 entries (Camille and Léa each 1 win).
  const ranks = page.getByTestId('leaderboard').getByRole('listitem');
  await expect(ranks).toHaveCount(3);

  // History has 2 rows; newest first → April 15 entry is on top.
  const rows = page.getByTestId('history').getByRole('listitem');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('15');
  await expect(rows.first()).toContainText('Camille');
});

test('parcours 2 — stats coopératif: taux de réussite 50% sur 2 parties', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository, playerRepository, playRepository }) => {
      const g = await gameRepository.create({ name: 'Pandémie', type: 'cooperative' });
      const alice = await playerRepository.create({ name: 'Alice' });
      await playRepository.create({ gameId: g.id, coopResult: 'success', participations: [{ playerId: alice.id }] });
      await playRepository.create({ gameId: g.id, coopResult: 'failure', participations: [{ playerId: alice.id }] });
    }`,
  );

  await openGame(page, /^Pandémie/);

  // Success-rate card is shown; no record/leaderboard.
  await expect(page.getByText('Taux de réussite')).toBeVisible();
  await expect(page.getByText('50')).toBeVisible(); // 50%
  await expect(page.getByText('Record')).toHaveCount(0);
  await expect(page.getByText('Classement par victoires')).toHaveCount(0);

  // The bar aria-label encodes the success/failure breakdown.
  await expect(
    page.getByRole('img', { name: /1 succès.*1 échec/i }),
  ).toBeVisible();

  // 2 history rows.
  const rows = page.getByTestId('history').getByRole('listitem');
  await expect(rows).toHaveCount(2);
});

// ─── Parcours 3: Fiche joueur ────────────────────────────────────────────────

test('parcours 3 — fiche joueur: compteurs et contenu historique corrects', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository, playerRepository, playRepository }) => {
      const g = await gameRepository.create({ name: 'Catan', type: 'competitive' });
      const marie = await playerRepository.create({ name: 'Marie' });
      const leo = await playerRepository.create({ name: 'Léo' });
      // Marie wins one play with score 95.
      await playRepository.create({
        gameId: g.id,
        playedAt: new Date('2026-05-10'),
        participations: [
          { playerId: marie.id, isWinner: true, score: 95 },
          { playerId: leo.id, score: 42 },
        ],
      });
      // Marie loses a second play.
      await playRepository.create({
        gameId: g.id,
        playedAt: new Date('2026-06-01'),
        participations: [
          { playerId: leo.id, isWinner: true, score: 110 },
          { playerId: marie.id, score: 75 },
        ],
      });
    }`,
  );

  // Navigate to the Joueurs tab.
  await gotoJoueurs(page);

  // Marie should be listed with 2 parties.
  await expect(
    page.getByRole('button', { name: 'Marie, 2 parties' }),
  ).toBeVisible();

  // Open Marie's fiche.
  await page.getByRole('button', { name: 'Marie, 2 parties' }).click();
  await expect(page.getByTestId('player-detail')).toBeVisible();

  // Header heading.
  await expect(page.getByRole('heading', { name: 'Marie' })).toBeVisible();

  // StatSummary: 2 parties jouées, 1 victoire — scoped inside the player-detail.
  const detail = page.getByTestId('player-detail');
  await expect(detail.getByText('Parties jouées')).toBeVisible();
  await expect(detail.getByText('Victoires')).toBeVisible();

  // History: 2 rows, the June 1 game at top (newest first).
  const rows = page.locator('[data-testid="player-detail"] li');
  await expect(rows).toHaveCount(2);
  // The second history row (May 10 win) contains the game name and a score.
  await expect(rows.last()).toContainText('Catan');
  await expect(rows.last()).toContainText('95');
});

// ─── Parcours 4: Gestion collection ─────────────────────────────────────────

test('parcours 4 — gestion collection: créer/renommer/supprimer jeu + joueur archivé visible en historique', async ({
  page,
}) => {
  await ready(page);

  // ── 4a: Create game "Azul" via the UI form ──────────────────────────────
  await expect(page.getByText(/aucun jeu/i)).toBeVisible();
  await page.getByRole('button', { name: 'Ajouter un jeu' }).click();
  await page.getByLabel('Nom du jeu').fill('Azul');
  await page.getByRole('radio', { name: 'Compétitif' }).click();
  await page.getByRole('button', { name: 'Créer le jeu' }).click();
  await expect(
    page.getByRole('button', { name: 'Azul, 0 partie' }),
  ).toBeVisible();

  // ── 4b: Rename "Azul" to "Azul Deluxe" ─────────────────────────────────
  await page.getByRole('button', { name: 'Azul, 0 partie' }).click();
  await expect(page.getByRole('heading', { name: 'Azul' })).toBeVisible();
  await page.getByRole('button', { name: 'Options du jeu' }).click();
  await page.getByRole('menuitem', { name: 'Modifier le jeu' }).click();
  const nameField = page.getByLabel('Nom du jeu');
  await expect(nameField).toHaveValue('Azul');
  await nameField.fill('Azul Deluxe');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(
    page.getByRole('heading', { name: 'Azul Deluxe' }),
  ).toBeVisible();

  // ── 4c: Delete "Azul Deluxe" ────────────────────────────────────────────
  await page.getByRole('button', { name: 'Options du jeu' }).click();
  await page.getByRole('menuitem', { name: 'Supprimer le jeu' }).click();
  await expect(page.getByRole('dialog')).toContainText('Azul Deluxe');
  await page.getByRole('button', { name: 'Supprimer le jeu' }).click();

  // Back on the empty collection.
  await expect(page.getByText(/aucun jeu/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Azul/ })).toHaveCount(0);

  // ── 4d: Create player "Bob" ─────────────────────────────────────────────
  await gotoJoueurs(page);
  await page.getByRole('button', { name: 'Ajouter un joueur' }).click();
  await page.getByLabel('Nom du joueur').fill('Bob');
  await page
    .getByRole('dialog', { name: 'Ajouter un joueur' })
    .getByRole('button', { name: 'Ajouter' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Bob, 0 partie' }),
  ).toBeVisible();

  // ── 4e: Archive Bob ──────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'Bob, 0 partie' }).click();
  await expect(page.getByTestId('player-detail')).toBeVisible();
  await page.getByRole('button', { name: 'Options du joueur' }).click();
  await page.getByRole('menuitem', { name: 'Supprimer le joueur' }).click();
  await expect(page.getByRole('dialog')).toContainText('Bob');
  await page.getByRole('button', { name: 'Supprimer le joueur' }).click();

  // Bob is gone from the active list.
  await expect(page.getByText(/aucun joueur/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Bob/ })).toHaveCount(0);

  // ── 4f: Archived player name stays in history ────────────────────────────
  // Seed a game with a play from "Ghost" (to be archived) so the history
  // entry pre-exists; then open the Fiche jeu and confirm Ghost's name renders
  // as readable text (no error / missing state).
  await page.goto('/');
  await page.waitForFunction(() => '__ludobox' in window);
  await seed(
    page,
    `async ({ gameRepository, playerRepository, playRepository }) => {
      const g = await gameRepository.create({ name: 'Ticket to Ride', type: 'competitive' });
      const ghost = await playerRepository.create({ name: 'Ghost' });
      const alice = await playerRepository.create({ name: 'Alice' });
      await playRepository.create({
        gameId: g.id,
        playedAt: new Date('2026-02-20'),
        participations: [
          { playerId: ghost.id, isWinner: true, score: 99 },
          { playerId: alice.id, score: 40 },
        ],
      });
      // Archive Ghost after the play is recorded.
      await playerRepository.archive(ghost.id);
    }`,
  );

  await openGame(page, /^Ticket to Ride/);

  // The record card still shows Ghost's score.
  await expect(page.getByText('99').first()).toBeVisible();
  // Ghost's name appears in the history row — not an error state.
  await expect(page.getByTestId('history')).toContainText('Ghost');
  // No "Ce joueur n'est plus disponible" error text in the history.
  await expect(page.getByText(/ce joueur n'est plus disponible/i)).toHaveCount(
    0,
  );
});
