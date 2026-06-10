import { expect, test } from '@playwright/test';

/**
 * Brique 5 — Joueurs E2E. The recette flow: create a player, rename it (the new
 * name shows everywhere), archive it (it leaves the active list). Plus the
 * uniqueness rules: an active duplicate is refused, an archived homonym allowed.
 */

const bottomBar = (page: import('@playwright/test').Page) =>
  page.getByRole('navigation', { name: 'Navigation principale' });

async function gotoJoueurs(page: import('@playwright/test').Page) {
  await page.goto('/');
  await bottomBar(page)
    .getByRole('button', { name: /Joueurs/ })
    .click();
}

async function addPlayer(page: import('@playwright/test').Page, name: string) {
  await page.getByRole('button', { name: 'Ajouter un joueur' }).click();
  await page.getByLabel('Nom du joueur').fill(name);
  await page
    .getByRole('dialog', { name: 'Ajouter un joueur' })
    .getByRole('button', { name: 'Ajouter' })
    .click();
}

test('creates, renames and archives a player end to end', async ({ page }) => {
  await gotoJoueurs(page);
  await expect(page.getByText(/aucun joueur/i)).toBeVisible();

  // Create
  await addPlayer(page, 'Mona');
  const row = page.getByRole('button', { name: 'Mona, 0 partie' });
  await expect(row).toBeVisible();

  // Open the fiche
  await row.click();
  await expect(page.getByRole('heading', { name: 'Mona' })).toBeVisible();

  // Rename — the new name shows on the fiche header
  await page.getByRole('button', { name: 'Options du joueur' }).click();
  await page.getByRole('menuitem', { name: 'Renommer' }).click();
  const field = page.getByLabel('Nouveau nom');
  await field.fill('Mona Lisa');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByRole('heading', { name: 'Mona Lisa' })).toBeVisible();

  // Back on the list, the renamed player is there
  await page.getByRole('button', { name: 'Retour' }).click();
  await expect(
    page.getByRole('button', { name: 'Mona Lisa, 0 partie' }),
  ).toBeVisible();

  // Archive from the fiche
  await page.getByRole('button', { name: 'Mona Lisa, 0 partie' }).click();
  await page.getByRole('button', { name: 'Options du joueur' }).click();
  await page.getByRole('menuitem', { name: 'Supprimer le joueur' }).click();
  await expect(page.getByRole('dialog')).toContainText('Mona Lisa');
  await page.getByRole('button', { name: 'Supprimer le joueur' }).click();

  // Back on an empty active list
  await expect(bottomBar(page)).toBeVisible();
  await expect(page.getByText(/aucun joueur/i)).toBeVisible();
});

test('refuses a duplicate active name but accepts an archived homonym', async ({
  page,
}) => {
  await gotoJoueurs(page);

  await addPlayer(page, 'Alice');
  await expect(
    page.getByRole('button', { name: 'Alice, 0 partie' }),
  ).toBeVisible();

  // Duplicate active name is refused, with an inline message
  await addPlayer(page, 'alice');
  await expect(page.getByRole('alert')).toHaveText('Ce nom est déjà utilisé.');

  // Archive the active Alice, then the homonym is accepted
  await page.getByRole('button', { name: 'Annuler' }).click();
  await page.getByRole('button', { name: 'Alice, 0 partie' }).click();
  await page.getByRole('button', { name: 'Options du joueur' }).click();
  await page.getByRole('menuitem', { name: 'Supprimer le joueur' }).click();
  await page.getByRole('button', { name: 'Supprimer le joueur' }).click();

  await expect(page.getByText(/aucun joueur/i)).toBeVisible();
  await addPlayer(page, 'Alice');
  await expect(
    page.getByRole('button', { name: 'Alice, 0 partie' }),
  ).toBeVisible();
});
