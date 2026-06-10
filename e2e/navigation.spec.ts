import { expect, test } from '@playwright/test';

/**
 * Brique 3 — navigation mechanics E2E. Launch on Collection with the bottom
 * bar; toggle spaces; dive into a detail (bar hidden, back shown); pop one
 * cran; re-tap the active tab to scroll to top; system/browser back.
 */

const bottomBar = (page: import('@playwright/test').Page) =>
  page.getByRole('navigation', { name: 'Navigation principale' });

test('launches on Collection with the bottom bar', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Ludobox');
  await expect(page.getByTestId('screen-collection')).toBeVisible();
  const bar = bottomBar(page);
  await expect(bar).toBeVisible();
  await expect(bar.getByText('Collection')).toBeVisible();
  await expect(bar.getByText('Joueurs')).toBeVisible();
  await expect(bar.getByRole('button', { name: /Collection/ })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('toggles between Collection and Joueurs', async ({ page }) => {
  await page.goto('/');
  await bottomBar(page)
    .getByRole('button', { name: /Joueurs/ })
    .click();
  await expect(
    bottomBar(page).getByRole('button', { name: /Joueurs/ }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(page.getByTestId('screen-joueurs')).toBeVisible();
});

test('dives into a detail and pops one cran back', async ({ page }) => {
  await page.goto('/');
  // The generic placeholder stack lives on the Joueurs tab (Brique 5 fills it).
  await bottomBar(page)
    .getByRole('button', { name: /Joueurs/ })
    .click();
  await page.getByRole('button', { name: 'Ouvrir un détail' }).click();

  await expect(page.getByTestId('detail')).toBeVisible();
  await expect(bottomBar(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Retour' })).toBeVisible();

  await page.getByRole('button', { name: 'Retour' }).click();
  await expect(bottomBar(page)).toBeVisible();
  await expect(page.getByTestId('detail')).toHaveCount(0);
});

test('the browser back gesture pops one cran (Android system back proxy)', async ({
  page,
}) => {
  await page.goto('/');
  await bottomBar(page)
    .getByRole('button', { name: /Joueurs/ })
    .click();
  await page.getByRole('button', { name: 'Ouvrir un détail' }).click();
  await expect(page.getByTestId('detail')).toBeVisible();

  await page.goBack();
  await expect(bottomBar(page)).toBeVisible();
  await expect(page.getByTestId('detail')).toHaveCount(0);
});

test('re-tapping the active tab scrolls its list to top', async ({ page }) => {
  await page.goto('/');
  // Use Joueurs: its placeholder still renders a long, scrollable filler list.
  await bottomBar(page)
    .getByRole('button', { name: /Joueurs/ })
    .click();
  const list = page.getByTestId('screen-joueurs');
  await list.evaluate((el) => el.scrollTo({ top: 400 }));
  await expect
    .poll(() => list.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);

  await bottomBar(page)
    .getByRole('button', { name: /Joueurs/ })
    .click();
  await expect.poll(() => list.evaluate((el) => el.scrollTop)).toBe(0);
});
