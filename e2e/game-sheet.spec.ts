import { expect, test, type Page } from '@playwright/test';

/**
 * Brique 6 — Fiche jeu E2E. There is no add-play UI until Brique 7, so plays
 * are seeded through the dev-only `window.__ludobox` repo seam (see main.tsx)
 * and the screen is then read through the Collection. Each test starts from a
 * fresh, isolated context (empty IndexedDB).
 */

async function ready(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => '__ludobox' in window);
}

/** Runs a seeding function in the page against the repo seam, then reloads. */
async function seed<T>(page: Page, fn: string): Promise<T> {
  const result = (await page.evaluate(async (src) => {
    // eslint-disable-next-line no-new-func
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

test('competitive: record, ordered leaderboard, sorted history', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository, playerRepository, playRepository }) => {
      const catan = await gameRepository.create({ name: 'Catan', type: 'competitive', minPlayers: 2, maxPlayers: 5, durationMin: 60 });
      const camille = await playerRepository.create({ name: 'Camille' });
      const lea = await playerRepository.create({ name: 'Léa' });
      const tom = await playerRepository.create({ name: 'Tom' });
      await playRepository.create({ gameId: catan.id, playedAt: new Date('2026-04-12'), participations: [
        { playerId: lea.id, isWinner: true, score: 90 },
        { playerId: camille.id, score: 60 },
      ]});
      await playRepository.create({ gameId: catan.id, playedAt: new Date('2026-05-24'), note: 'belle partie', participations: [
        { playerId: camille.id, isWinner: true, score: 142 },
        { playerId: lea.id, score: 118 },
        { playerId: tom.id, score: 96 },
      ]});
    }`,
  );

  await openGame(page, /^Catan/);

  // Record card: highest score + its holder.
  await expect(page.getByText('Record')).toBeVisible();
  await expect(page.getByText('142').first()).toBeVisible();

  // Leaderboard ordered by wins (tie Camille/Léa broken alphabetically, Tom 0).
  const ranks = page.getByTestId('leaderboard').getByRole('listitem');
  await expect(ranks).toHaveText([/Camille/, /Léa/, /Tom/]);

  // History newest first → the 24 MAI Camille win on top.
  const rows = page.getByTestId('history').getByRole('listitem');
  await expect(rows.first()).toContainText('24');
  await expect(rows.first()).toContainText('Camille');
});

test('cooperative: success rate replaces record and leaderboard', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository, playerRepository, playRepository }) => {
      const pandemic = await gameRepository.create({ name: 'Pandémie', type: 'cooperative' });
      const alice = await playerRepository.create({ name: 'Alice' });
      await playRepository.create({ gameId: pandemic.id, coopResult: 'success', participations: [{ playerId: alice.id }] });
      await playRepository.create({ gameId: pandemic.id, coopResult: 'failure', participations: [{ playerId: alice.id }] });
    }`,
  );

  await openGame(page, /^Pandémie/);

  await expect(page.getByText('Taux de réussite')).toBeVisible();
  await expect(page.getByText('Record')).toHaveCount(0);
  await expect(page.getByText('Classement par victoires')).toHaveCount(0);
});

test('empty: dice motif and add-play CTA when the game has no play', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository }) => {
      await gameRepository.create({ name: 'Wingspan', type: 'competitive' });
    }`,
  );

  await openGame(page, /^Wingspan/);

  await expect(page.getByText(/aucune partie pour l’instant/i)).toBeVisible();
  await expect(
    page.getByRole('button', { name: /ajouter une partie/i }),
  ).toBeVisible();
});

test('stats recompute after a play is removed; archived holder stays by name', async ({
  page,
}) => {
  await ready(page);
  const playId = await seed<string>(
    page,
    `async ({ gameRepository, playerRepository, playRepository }) => {
      const catan = await gameRepository.create({ name: 'Catan', type: 'competitive' });
      const alice = await playerRepository.create({ name: 'Alice' });
      const ghost = await playerRepository.create({ name: 'Ghost' });
      const top = await playRepository.create({ gameId: catan.id, playedAt: new Date('2026-05-24'), participations: [{ playerId: ghost.id, isWinner: true, score: 99 }] });
      await playRepository.create({ gameId: catan.id, playedAt: new Date('2026-05-20'), participations: [{ playerId: alice.id, isWinner: true, score: 30 }] });
      await playerRepository.archive(ghost.id);
      return top.id;
    }`,
  );

  // The archived holder still owns the record, shown by name.
  await openGame(page, /^Catan/);
  await expect(page.getByText('99').first()).toBeVisible();
  await expect(page.getByText('Ghost').first()).toBeVisible();

  // Remove the record play, then reopen the fiche — stats recompute on read.
  await page.evaluate(async (id) => {
    await window.__ludobox.playRepository.remove(id);
  }, playId);
  await page.reload();
  await openGame(page, /^Catan/);

  await expect(page.getByText('30').first()).toBeVisible();
  await expect(page.getByText('99')).toHaveCount(0);
});
