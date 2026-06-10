import { expect, test, type Page } from '@playwright/test';

/**
 * Brique 7 — Fiche partie E2E. The competitive recette journey end to end, plus
 * on-the-fly player creation, the cooperative flow, edit+delete, and the abandon
 * guard. Games/players are seeded through the dev-only `window.__ludobox` seam
 * (see main.tsx); the play itself is logged through the real form. Each test
 * starts from a fresh, isolated context (empty IndexedDB).
 */

async function ready(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => '__ludobox' in window);
}

async function seed(page: Page, fn: string): Promise<void> {
  await page.evaluate(async (src) => {
    const run = new Function(`return (${src})(window.__ludobox)`);
    await run();
  }, fn);
  await page.reload();
}

async function openGame(page: Page, name: RegExp) {
  await page.getByRole('button', { name }).click();
  await expect(page.getByTestId('game-detail')).toBeVisible();
}

test('competitive: log a play from the CTA → toast + updated stats/history', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository, playerRepository }) => {
      await gameRepository.create({ name: 'Catan', type: 'competitive' });
      await playerRepository.create({ name: 'Camille' });
      await playerRepository.create({ name: 'Léa' });
    }`,
  );

  await openGame(page, /^Catan/);
  await page.getByRole('button', { name: /ajouter une partie/i }).click();
  await expect(page.getByText('Nouvelle partie')).toBeVisible();

  await page.getByLabel('Ajouter un joueur').fill('Cam');
  await page.getByRole('option', { name: /Camille/ }).click();
  await page.getByLabel('Ajouter un joueur').fill('Lé');
  await page.getByRole('option', { name: /Léa/ }).click();

  await page.getByLabel('Score de Camille').fill('142');
  await page.getByLabel('Score de Léa').fill('118');
  await page.getByRole('switch', { name: /Camille a gagné/ }).click();

  await page.getByRole('button', { name: 'Enregistrer la partie' }).click();

  await expect(page.getByTestId('game-detail')).toBeVisible();
  await expect(page.getByText('Nouveau record, Camille')).toBeVisible();
  await expect(page.getByText('142').first()).toBeVisible();
  await expect(page.getByTestId('history')).toContainText('Camille');
});

test('on-the-fly: a player created from the autocomplete appears in Joueurs', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository }) => {
      await gameRepository.create({ name: 'Azul', type: 'competitive' });
    }`,
  );

  await openGame(page, /^Azul/);
  await page.getByRole('button', { name: /ajouter une partie/i }).click();
  await page.getByLabel('Ajouter un joueur').fill('Nina');
  await page.getByRole('button', { name: /Créer .*Nina/ }).click();
  await page.getByRole('switch', { name: /Nina a gagné/ }).click();
  await page.getByRole('button', { name: 'Enregistrer la partie' }).click();

  await expect(page.getByTestId('game-detail')).toBeVisible();

  await page.getByRole('button', { name: 'Retour' }).click();
  await page.getByRole('button', { name: /Joueurs/ }).click();
  await expect(page.getByRole('button', { name: /Nina/ })).toBeVisible();
});

test('cooperative: no score/winner, segmented result, Save active at one player', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository, playerRepository }) => {
      await gameRepository.create({ name: 'Pandémie', type: 'cooperative' });
      await playerRepository.create({ name: 'Alice' });
    }`,
  );

  await openGame(page, /^Pandémie/);
  await page.getByRole('button', { name: /ajouter une partie/i }).click();
  await page.getByLabel('Ajouter un joueur').fill('Ali');
  await page.getByRole('option', { name: /Alice/ }).click();

  await expect(page.getByRole('switch')).toHaveCount(0);
  await expect(
    page.getByRole('radiogroup', { name: 'Résultat collectif' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Enregistrer la partie' }),
  ).toBeEnabled();
});

test('edit + delete: open a play from history, change it, then delete it', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository, playerRepository, playRepository }) => {
      const g = await gameRepository.create({ name: 'Catan', type: 'competitive' });
      const lea = await playerRepository.create({ name: 'Léa' });
      await playRepository.create({ gameId: g.id, playedAt: new Date('2026-05-24'), participations: [{ playerId: lea.id, isWinner: true, score: 30 }] });
    }`,
  );

  await openGame(page, /^Catan/);
  await page.getByTestId('history').getByRole('button').first().click();
  await expect(page.getByText('Modifier la partie')).toBeVisible();

  await page.getByLabel('Score de Léa').fill('77');
  await page
    .getByRole('button', { name: 'Enregistrer les modifications' })
    .click();
  await expect(page.getByTestId('game-detail')).toBeVisible();
  await expect(page.getByText('77').first()).toBeVisible();

  await page.getByTestId('history').getByRole('button').first().click();
  await page.getByRole('button', { name: 'Options de la partie' }).click();
  await page.getByRole('menuitem', { name: 'Supprimer la partie' }).click();
  await page.getByRole('button', { name: 'Supprimer la partie' }).click();

  await expect(page.getByTestId('history')).toHaveCount(0);
});

test('abandon: leaving with unsaved changes asks before discarding', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository, playerRepository }) => {
      await gameRepository.create({ name: 'Catan', type: 'competitive' });
      await playerRepository.create({ name: 'Léa' });
    }`,
  );

  await openGame(page, /^Catan/);
  await page.getByRole('button', { name: /ajouter une partie/i }).click();
  await page.getByLabel('Ajouter un joueur').fill('Lé');
  await page.getByRole('option', { name: /Léa/ }).click();

  await page.getByRole('button', { name: 'Retour' }).click();
  await expect(page.getByRole('button', { name: 'Abandonner' })).toBeVisible();

  await page.getByRole('button', { name: 'Continuer la saisie' }).click();
  await expect(page.getByText('Nouvelle partie')).toBeVisible();
  await page.getByRole('button', { name: 'Retour' }).click();
  await page.getByRole('button', { name: 'Abandonner' }).click();
  await expect(page.getByTestId('game-detail')).toBeVisible();
});
