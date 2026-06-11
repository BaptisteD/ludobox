import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousA11yViolations } from './axe';

/**
 * Brique 8 — A11y gate. Assert zero serious/critical WCAG 2.1 A/AA violations
 * on the 4 key screens. Uses the dev-only `window.__ludobox` seam for seeding.
 */

async function ready(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => '__ludobox' in window);
}

async function seed(page: Page, fn: string): Promise<void> {
  await page.evaluate(async (src) => {
    const run = new Function(`return (${src})(window.__ludobox)`);
    return await run();
  }, fn);
  await page.reload();
}

test('Collection (empty) has no serious a11y violations', async ({ page }) => {
  await ready(page);
  await expectNoSeriousA11yViolations(page);
});

test('Fiche jeu compétitive has no serious a11y violations', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository, playerRepository, playRepository }) => {
      const g = await gameRepository.create({ name: 'Catan', type: 'competitive', minPlayers: 2, maxPlayers: 5, durationMin: 60 });
      const a = await playerRepository.create({ name: 'Camille' });
      const b = await playerRepository.create({ name: 'Léa' });
      await playRepository.create({ gameId: g.id, playedAt: new Date('2026-05-24'), participations: [
        { playerId: a.id, isWinner: true, score: 142 },
        { playerId: b.id, score: 118 },
      ]});
    }`,
  );
  await page.getByRole('button', { name: /^Catan/ }).click();
  await expect(page.getByTestId('game-detail')).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});

test('Fiche joueur has no serious a11y violations', async ({ page }) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository, playerRepository, playRepository }) => {
      const g = await gameRepository.create({ name: 'Catan', type: 'competitive', minPlayers: 2, maxPlayers: 5, durationMin: 60 });
      const a = await playerRepository.create({ name: 'Camille' });
      await playRepository.create({ gameId: g.id, playedAt: new Date('2026-05-24'), participations: [
        { playerId: a.id, isWinner: true, score: 142 },
      ]});
    }`,
  );
  // BottomBar uses role="button", not role="tab"
  await page.getByRole('button', { name: /Joueurs/ }).click();
  await page.getByRole('button', { name: /Camille/ }).click();
  await expect(page.getByTestId('player-detail')).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});

test('Fiche partie (add play form) has no serious a11y violations', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository, playerRepository }) => {
      await gameRepository.create({ name: 'Catan', type: 'competitive', minPlayers: 2, maxPlayers: 5, durationMin: 60 });
      await playerRepository.create({ name: 'Camille' });
    }`,
  );
  await page.getByRole('button', { name: /^Catan/ }).click();
  await page.getByRole('button', { name: /ajouter une partie/i }).click();
  await expect(page.getByTestId('play-form')).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});
