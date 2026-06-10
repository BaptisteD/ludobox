import { expect, test } from '@playwright/test';

/**
 * Brique 4 — Collection CRUD E2E. Each test starts from a fresh, isolated
 * browser context (empty IndexedDB), so the app opens on the empty state.
 */

test('creates, edits and deletes a game end to end', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/aucun jeu/i)).toBeVisible();

  // Create.
  await page.getByRole('button', { name: 'Ajouter un jeu' }).click();
  await page.getByLabel('Nom du jeu').fill('Catan');
  await page.getByRole('radio', { name: 'Compétitif' }).click();
  await page.getByRole('button', { name: 'Créer le jeu' }).click();

  const row = page.getByRole('button', { name: 'Catan, 0 partie' });
  await expect(row).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Navigation principale' }),
  ).toBeVisible();

  // Open its detail, then edit.
  await row.click();
  await expect(page.getByRole('heading', { name: 'Catan' })).toBeVisible();
  await page.getByRole('button', { name: 'Options du jeu' }).click();
  await page.getByRole('menuitem', { name: 'Modifier le jeu' }).click();

  const name = page.getByLabel('Nom du jeu');
  await expect(name).toHaveValue('Catan');
  await name.fill('Catane');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByRole('heading', { name: 'Catane' })).toBeVisible();

  // Delete with explicit confirmation.
  await page.getByRole('button', { name: 'Options du jeu' }).click();
  await page.getByRole('menuitem', { name: 'Supprimer le jeu' }).click();
  await expect(page.getByRole('dialog')).toContainText('Catane');
  await page.getByRole('button', { name: 'Supprimer le jeu' }).click();

  // Back on the (now empty) list.
  await expect(page.getByText(/aucun jeu/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Catane/ })).toHaveCount(0);
});

test('refuses a duplicate name (case/accent-insensitive)', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Ajouter un jeu' }).click();
  await page.getByLabel('Nom du jeu').fill('Café');
  await page.getByRole('radio', { name: 'Compétitif' }).click();
  await page.getByRole('button', { name: 'Créer le jeu' }).click();
  await expect(
    page.getByRole('button', { name: 'Café, 0 partie' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Ajouter un jeu' }).click();
  await page.getByLabel('Nom du jeu').fill('cafe');
  await page.getByRole('radio', { name: 'Compétitif' }).click();
  await page.getByRole('button', { name: 'Créer le jeu' }).click();

  await expect(page.getByText('Ce nom est déjà utilisé.')).toBeVisible();
  // Still on the form (no second game was created).
  await expect(page.getByLabel('Nom du jeu')).toHaveValue('cafe');
});
