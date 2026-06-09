import { expect, test } from '@playwright/test';

/** Brique 0 smoke: the page loads and the app shell is on the cream ground. */
test('app loads on cream canvas', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Ludobox');
  const shell = page.getByTestId('app-shell');
  await expect(shell).toBeVisible();
  await expect(shell).toHaveCSS('background-color', 'rgb(253, 243, 227)');
});
