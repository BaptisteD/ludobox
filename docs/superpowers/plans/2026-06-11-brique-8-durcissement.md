# Brique 8 — Durcissement (PWA offline, a11y AA, recette) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden Ludobox V1 — fix the genuine WCAG 2.1 AA contrast/heading failures, lock offline SPA navigation, add an automated a11y guard, prove the 4 key journeys end-to-end, and ship as v1.0.0.

**Architecture:** Surgical token darkening (coral/teal/chevron) verified by a contrast unit test; conditional `<h1>` in `BackHeader`; explicit `navigateFallback` in the PWA workbox config; `@axe-core/playwright` assertions + a `recette.spec.ts` covering the 4 journeys. No new product surface.

**Tech Stack:** React 19 + Vite 6 + TypeScript, CSS Modules + `tokens.css`, Vitest (unit), Playwright + @axe-core/playwright (E2E/a11y), vite-plugin-pwa (workbox).

---

### Task 1: Contrast tokens + regression test + DESIGN.md sync

**Files:**
- Create: `src/styles/contrast.test.ts`
- Modify: `src/styles/tokens.css:18` (coral), `:23` (teal), and `:15` (add chevron token)
- Modify: `src/ui/HistoryRow.module.css:95` (chevron color)
- Modify: `DESIGN.md` (coral/teal rows + ink/faint note)

- [ ] **Step 1: Write the failing contrast test**

Create `src/styles/contrast.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const tokens = readFileSync(
  fileURLToPath(new URL('./tokens.css', import.meta.url)),
  'utf8',
);

/** Read a `--name: #hex;` value out of tokens.css. */
function token(name: string): string {
  const m = tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --${name} not found`);
  return m[1];
}

function luminance(hex: string): number {
  const ch = hex
    .replace('#', '')
    .match(/../g)!
    .map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('token contrast (WCAG 2.1 AA)', () => {
  const creme = '#fff6e9';
  const cream = '#fdf3e3';

  it('crème on coral clears 4.5:1 (14px tag/chip text)', () => {
    expect(ratio(creme, token('coral'))).toBeGreaterThanOrEqual(4.5);
  });
  it('crème on teal clears 4.5:1 (14px tag/chip text)', () => {
    expect(ratio(creme, token('teal'))).toBeGreaterThanOrEqual(4.5);
  });
  it('disclosure chevron clears 3:1 on cream', () => {
    expect(ratio(token('chevron-disclosure'), cream)).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- contrast`
Expected: FAIL — coral 3.62 < 4.5, teal 3.02 < 4.5, and `--chevron-disclosure` not found.

- [ ] **Step 3: Update the tokens**

In `src/styles/tokens.css`, change the coral and teal values and add the chevron token after `--ink-faint`:

```css
  --ink-faint: #c7b493; /* lowest-emphasis decoration & disabled (WCAG-exempt) */
  --chevron-disclosure: #988568; /* tappable-row chevron — ≥3:1 on cream (AA non-text) */
```
```css
  --coral: #c43355; /* primary CTA, "Compétitif", failure, rank-3, destructive — AA on crème */
```
```css
  --teal: #147d71; /* "Coopératif", success, rank-2, win portion of bars — AA on crème */
```

In `src/ui/HistoryRow.module.css`, point the chevron at the new token:

```css
.chevron {
  display: inline-flex;
  flex-shrink: 0;
  color: var(--chevron-disclosure);
}
```

- [ ] **Step 4: Run the test, confirm green**

Run: `npm test -- contrast`
Expected: PASS (coral 4.96, teal 4.67, chevron 3.24).

- [ ] **Step 5: Sync DESIGN.md**

In `DESIGN.md`, update the three rows to the new hex (keep roles):
- `| `coral` | `#C43355` | Primary CTA (Add a play), "Compétitif" tag, failure, rank-3 badge, destructive |`
- `| `teal` | `#147D71` | "Coopératif" tag, success, rank-2 badge, win portion of bars |`
- `| `ink/faint` | `#C7B493` | Lowest-emphasis decoration & disabled (chevron uses `#988568` for AA) |`

Add one line under the Game-piece colors table:
`> Coral/teal darkened in Brique 8 so 14px crème text on them clears WCAG AA 4.5:1 (was 3.62/3.02).`

- [ ] **Step 6: Commit**

```bash
git add src/styles/tokens.css src/styles/contrast.test.ts src/ui/HistoryRow.module.css DESIGN.md
git commit -m "fix(a11y): darken coral/teal + dedicated chevron token for WCAG AA contrast"
```

---

### Task 2: BackHeader renders `<h1>` only when titled

**Files:**
- Create: `src/app/BackHeader.test.tsx`
- Modify: `src/app/BackHeader.tsx:13-26`

- [ ] **Step 1: Write the failing test**

Create `src/app/BackHeader.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BackHeader } from './BackHeader';

describe('BackHeader', () => {
  it('renders an h1 when given a title', () => {
    render(<BackHeader title="Catan" onBack={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Catan');
  });

  it('renders NO heading when title is empty (host owns the h1)', () => {
    render(<BackHeader title="" onBack={vi.fn()} />);
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('always exposes the back button', () => {
    render(<BackHeader title="" onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Retour' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it, watch the empty-title case fail**

Run: `npm test -- BackHeader`
Expected: FAIL — current code renders `<h1></h1>` even when empty, so `queryByRole('heading')` is non-null.

- [ ] **Step 3: Make the `<h1>` conditional**

In `src/app/BackHeader.tsx`, replace the JSX body:

```tsx
export function BackHeader({ title, onBack }: BackHeaderProps) {
  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.back}
        onClick={onBack}
        aria-label="Retour"
      >
        <ArrowLeft size={24} />
      </button>
      {title ? <h1 className={styles.title}>{title}</h1> : null}
    </header>
  );
}
```

- [ ] **Step 4: Run the test, confirm green**

Run: `npm test -- BackHeader`
Expected: PASS (3/3).

- [ ] **Step 5: Guard against double-h1 in the detail screens**

Run the full suite to confirm GameDetail/PlayForm/PlayerDetail/GameForm tests still pass:
Run: `npm test`
Expected: PASS — all prior specs green (no test asserted the empty `<h1>`).

- [ ] **Step 6: Commit**

```bash
git add src/app/BackHeader.tsx src/app/BackHeader.test.tsx
git commit -m "fix(a11y): BackHeader emits h1 only when titled (single h1 per screen)"
```

---

### Task 3: Explicit offline SPA navigation fallback

**Files:**
- Modify: `vite.config.ts:47-49` (workbox block)

- [ ] **Step 1: Add navigateFallback to the workbox config**

In `vite.config.ts`, expand the `workbox` block:

```ts
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/[^/?]+\.[^/]+$/],
      },
```

- [ ] **Step 2: Type-check + build to confirm the SW generates**

Run: `npm run build`
Expected: PASS — build completes; output lists a generated `sw.js` / precache manifest including `index.html` and `*.woff2`.

- [ ] **Step 3: Confirm the precache manifest covers the shell + fonts**

Run: `grep -o 'navigateFallback\|index.html' dist/sw.js | sort -u`
Expected: prints `index.html` and `navigateFallback` (the fallback is wired).

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts
git commit -m "fix(pwa): explicit navigateFallback so offline deep-link/refresh serves the SPA shell"
```

---

### Task 4: Automated a11y guard (@axe-core/playwright)

**Files:**
- Modify: `package.json` (devDependencies)
- Create: `e2e/axe.ts`
- Create: `e2e/a11y.spec.ts`

- [ ] **Step 1: Install the dependency**

Run: `npm install -D @axe-core/playwright`
Expected: adds `@axe-core/playwright` to devDependencies, no peer warnings (it depends on `axe-core`).

- [ ] **Step 2: Write the shared helper**

Create `e2e/axe.ts`:

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/**
 * Assert zero serious/critical WCAG 2.1 A/AA violations on the current page.
 * Brique 8 a11y gate. Prints offending rule ids + nodes on failure.
 */
export async function expectNoSeriousA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  const summary = blocking.map(
    (v) => `${v.id} (${v.impact}) × ${v.nodes.length}: ${v.help}`,
  );
  expect(blocking, summary.join('\n')).toEqual([]);
}
```

- [ ] **Step 3: Write the a11y spec across the key screens**

Create `e2e/a11y.spec.ts`:

```ts
import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousA11yViolations } from './axe';

async function ready(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => '__ludobox' in window);
}

async function seed(page: Page, fn: string) {
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

test('Fiche jeu compétitive has no serious a11y violations', async ({ page }) => {
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
  await page.getByRole('tab', { name: /Joueurs/ }).click();
  await page.getByRole('button', { name: /Camille/ }).click();
  await expect(page.getByTestId('player-detail')).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});

test('Fiche partie (add play form) has no serious a11y violations', async ({ page }) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository, playerRepository }) => {
      await gameRepository.create({ name: 'Catan', type: 'competitive', minPlayers: 2, maxPlayers: 5, durationMin: 60 });
      await playerRepository.create({ name: 'Camille' });
    }`,
  );
  await page.getByRole('button', { name: /^Catan/ }).click();
  await page.getByRole('button', { name: /Ajouter une partie/ }).click();
  await expect(page.getByTestId('play-form')).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});
```

- [ ] **Step 4: Confirm the testids/roles used above exist**

Run: `grep -rn "data-testid=\"game-detail\"\|data-testid=\"player-detail\"\|data-testid=\"play-form\"" src/`
Expected: each testid resolves to one element. If `player-detail`/`play-form` differ, read the component and adjust the selector in the spec to the real testid before running. (game-detail confirmed in B6.)

- [ ] **Step 5: Run the a11y spec**

Run: `npm run test:e2e -- a11y`
Expected: PASS (4/4). If axe reports a real serious/critical violation, fix the source (not the test) and re-run.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json e2e/axe.ts e2e/a11y.spec.ts
git commit -m "test(a11y): assert zero serious/critical WCAG violations on the 4 key screens"
```

---

### Task 5: The 4-parcours recette (end-to-end)

**Files:**
- Create: `e2e/recette.spec.ts`

- [ ] **Step 1: Write the recette spec (the 4 journeys)**

Create `e2e/recette.spec.ts`:

```ts
import { expect, test, type Page } from '@playwright/test';

/**
 * Brique 8 — Recette globale. Walks the 4 key journeys end-to-end through the
 * real UI. Parcours 1 and 4 are pure UI (create via forms); 2 and 3 read back
 * what 1 produced. Each test starts from a fresh, isolated IndexedDB.
 */
async function ready(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => '__ludobox' in window);
}

async function seed(page: Page, fn: string) {
  await page.evaluate(async (src) => {
    const run = new Function(`return (${src})(window.__ludobox)`);
    return await run();
  }, fn);
  await page.reload();
}

test('Parcours 1 — saisie après soirée jeu: add competitive play → toast → stats update', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository, playerRepository, playRepository }) => {
      const g = await gameRepository.create({ name: 'Catan', type: 'competitive', minPlayers: 2, maxPlayers: 5, durationMin: 60 });
      const a = await playerRepository.create({ name: 'Camille' });
      const b = await playerRepository.create({ name: 'Léa' });
      await playRepository.create({ gameId: g.id, playedAt: new Date('2026-04-12'), participations: [
        { playerId: a.id, isWinner: true, score: 80 },
        { playerId: b.id, score: 70 },
      ]});
    }`,
  );

  await page.getByRole('button', { name: /^Catan/ }).click();
  await expect(page.getByTestId('game-detail')).toBeVisible();
  // Old record is 80.
  await expect(page.getByText('80').first()).toBeVisible();

  // Record a new, record-breaking play.
  await page.getByRole('button', { name: /Ajouter une partie/ }).click();
  await expect(page.getByTestId('play-form')).toBeVisible();

  // Add both players to the play (autocomplete create/select).
  for (const name of ['Camille', 'Léa']) {
    await page.getByPlaceholder(/joueur/i).fill(name);
    await page.getByRole('option', { name }).click();
  }
  // Scores: Camille 150 (new record + winner), Léa 60.
  const scores = page.getByRole('textbox', { name: /score/i });
  await scores.nth(0).fill('150');
  await scores.nth(1).fill('60');
  await page.getByRole('button', { name: /Camille.*gagnant|gagnant/i }).first().click();
  await page.getByRole('button', { name: /Enregistrer/ }).click();

  // Back on the fiche: record toast + updated record 150.
  await expect(page.getByTestId('game-detail')).toBeVisible();
  await expect(page.getByRole('status')).toContainText(/record/i);
  await expect(page.getByText('150').first()).toBeVisible();
  // History now lists 2 plays.
  await expect(
    page.getByTestId('history').getByRole('listitem'),
  ).toHaveCount(2);
});

test('Parcours 2 — stats d’un jeu: counts, record holder, leaderboard, coop success rate', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository, playerRepository, playRepository }) => {
      const coop = await gameRepository.create({ name: 'Pandemic', type: 'cooperative', minPlayers: 2, maxPlayers: 4, durationMin: 45 });
      const a = await playerRepository.create({ name: 'Sam' });
      await playRepository.create({ gameId: coop.id, playedAt: new Date('2026-03-01'), coopResult: 'success', participations: [{ playerId: a.id }] });
      await playRepository.create({ gameId: coop.id, playedAt: new Date('2026-03-08'), coopResult: 'failure', participations: [{ playerId: a.id }] });
    }`,
  );
  await page.getByRole('button', { name: /^Pandemic/ }).click();
  await expect(page.getByTestId('game-detail')).toBeVisible();
  // 2 plays, 50% success rate.
  await expect(page.getByText('50')).toBeVisible();
  await expect(page.getByTestId('history').getByRole('listitem')).toHaveCount(2);
});

test('Parcours 3 — fiche joueur: plays, scores, results, counters', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository, playerRepository, playRepository }) => {
      const g = await gameRepository.create({ name: 'Catan', type: 'competitive', minPlayers: 2, maxPlayers: 5, durationMin: 60 });
      const a = await playerRepository.create({ name: 'Camille' });
      const b = await playerRepository.create({ name: 'Léa' });
      await playRepository.create({ gameId: g.id, playedAt: new Date('2026-04-12'), participations: [
        { playerId: a.id, isWinner: true, score: 80 },
        { playerId: b.id, score: 70 },
      ]});
    }`,
  );
  await page.getByRole('tab', { name: /Joueurs/ }).click();
  await page.getByRole('button', { name: /Camille/ }).click();
  await expect(page.getByTestId('player-detail')).toBeVisible();
  // 1 play, 1 win shown in the counters; history row visible.
  await expect(page.getByTestId('player-detail')).toContainText('Catan');
  await expect(page.getByText('80')).toBeVisible();
});

test('Parcours 4 — gestion collection: create/edit/delete game + create/rename/archive player', async ({
  page,
}) => {
  await ready(page);

  // Create a game via the form.
  await page.getByRole('button', { name: /Ajouter un jeu|Nouveau jeu|jeu/i }).first().click();
  await expect(page.getByTestId('game-form')).toBeVisible();
  await page.getByLabel(/nom/i).fill('Azul');
  await page.getByRole('button', { name: /Compétitif/ }).click();
  await page.getByRole('button', { name: /Enregistrer|Créer/ }).click();
  await expect(page.getByRole('button', { name: /^Azul/ })).toBeVisible();

  // Edit it (rename).
  await page.getByRole('button', { name: /^Azul/ }).click();
  await page.getByRole('button', { name: /Options|Modifier|menu/i }).first().click();
  await page.getByRole('menuitem', { name: /Modifier/ }).click();
  await page.getByLabel(/nom/i).fill('Azul Deluxe');
  await page.getByRole('button', { name: /Enregistrer/ }).click();
  await expect(page.getByRole('heading', { name: /Azul Deluxe/ })).toBeVisible();

  // Delete it (cascade) and confirm it is gone from the collection.
  await page.getByRole('button', { name: /Options|menu/i }).first().click();
  await page.getByRole('menuitem', { name: /Supprimer/ }).click();
  await page.getByRole('button', { name: /Supprimer/ }).last().click();
  await expect(page.getByRole('button', { name: /^Azul Deluxe/ })).toHaveCount(0);

  // Player: create, rename, archive — archived name stays readable in history.
  await page.getByRole('tab', { name: /Joueurs/ }).click();
  await page.getByRole('button', { name: /Ajouter un joueur|joueur/i }).first().click();
  await page.getByLabel(/nom/i).fill('Bob');
  await page.getByRole('button', { name: /Ajouter|Créer/ }).click();
  await expect(page.getByRole('button', { name: /Bob/ })).toBeVisible();

  await page.getByRole('button', { name: /Bob/ }).click();
  await expect(page.getByTestId('player-detail')).toBeVisible();
  // Archive.
  await page.getByRole('button', { name: /Options|Archiver|menu/i }).first().click();
  await page.getByRole('menuitem', { name: /Archiver/ }).click();
  await page.getByRole('button', { name: /Archiver/ }).last().click();
  // Back on the active list, Bob is no longer active.
  await expect(page.getByRole('button', { name: /^Bob$/ })).toHaveCount(0);
});
```

- [ ] **Step 2: Reconcile selectors with the real UI**

The labels/testids above are best-effort. Before running, verify each against source:
Run: `grep -rn "data-testid=\|aria-label=\|placeholder=\|getByRole" src/features/collection src/features/players src/features/play-form src/features/game | grep -iE "ajouter|modifier|supprimer|archiver|enregistrer|score|joueur|nom|game-form|player-detail|play-form|history"`
Adjust any selector in `recette.spec.ts` that does not match a real label/testid. Do NOT change source to fit the test unless the source is genuinely missing an accessible name.

- [ ] **Step 3: Run the recette**

Run: `npm run test:e2e -- recette`
Expected: PASS (4/4). Debug failures by reading the failing step's component; fix selectors (or a genuine source a11y-name gap) and re-run.

- [ ] **Step 4: Run the whole E2E suite for regressions**

Run: `npm run test:e2e`
Expected: PASS — all specs (navigation, collection, players, game-sheet, play-form, smoke, a11y, recette) green.

- [ ] **Step 5: Commit**

```bash
git add e2e/recette.spec.ts
git commit -m "test(e2e): recette globale — the 4 key journeys end-to-end"
```

---

### Task 6: README PWA section, version bump, full recette, factorisation, tag

**Files:**
- Modify: `README.md`
- Modify: `package.json:4` (version)

- [ ] **Step 1: Add the PWA / offline section to README**

In `README.md`, after the Scripts table, add:

```markdown
## PWA & hors-ligne

Ludobox est une PWA installable qui fonctionne **entièrement hors-ligne** (données en
IndexedDB, shell + polices précachés par le service worker).

```bash
npm run build      # build de production + service worker (Workbox)
npm run preview     # sert le build prod sur http://localhost:4173
```

Pour vérifier l'installabilité et le hors-ligne :
1. `npm run build && npm run preview`, ouvrir l'URL dans Chrome.
2. Installer l'app (icône d'installation de la barre d'adresse) → elle se lance en **standalone**.
3. Couper le réseau (DevTools → Network → Offline) puis recharger : l'app démarre,
   navigue, lit et écrit. La navigation profonde retombe sur le shell (`navigateFallback`).
```

- [ ] **Step 2: Bump the version**

In `package.json`, change `"version": "0.1.0"` to `"version": "1.0.0"`.

- [ ] **Step 3: Full unit + lint gate**

Run: `npm test && npm run lint`
Expected: PASS — all Vitest green (incl. new contrast + BackHeader specs), ESLint + Prettier clean.

- [ ] **Step 4: Full E2E gate**

Run: `npm run test:e2e`
Expected: PASS — every spec green.

- [ ] **Step 5: Production build gate**

Run: `npm run build`
Expected: PASS — type-check + Vite build succeed; `dist/sw.js` present.

- [ ] **Step 6: Commit the README + version**

```bash
git add README.md package.json
git commit -m "docs(readme): PWA/offline build & install guide; bump to v1.0.0"
```

- [ ] **Step 7: Factorisation — /code-review then /simplify**

Run `/code-review` on the brique diff (`git diff main...HEAD`), address any high-confidence findings, then `/simplify` for reuse/dead-code. Commit any resulting changes:

```bash
git commit -am "refactor(brique-8): factorisation — code review + simplify"
```

(Skip this commit if neither produced changes.)

- [ ] **Step 8: Tag v1.0.0**

Only after every gate above is green:

```bash
git tag -a v1.0.0 -m "Ludobox V1 — briques 0–8 complètes"
git tag --list v1.0.0
```

Expected: `v1.0.0` listed.

---

## Notes for the executor

- **Invariant:** stats/counters are always computed at read time, never stored. Do not add any
  persisted aggregate while wiring the recette.
- **EN↔FR boundary holds:** domain uses `competitive/cooperative` + `success/failure`; the UI maps
  to `competitif/cooperatif` + `succes/echec` only at the component edge. Seeds use domain values.
- **Selectors:** the E2E selectors in Tasks 4–5 are derived from B4–B7 conventions but must be
  reconciled against current source (Step 2 of each). Prefer fixing the test selector; only touch
  source if an interactive element genuinely lacks an accessible name (which is itself an a11y fix).
- **`window.__ludobox`** dev seam stays (gated by `import.meta.env.DEV`, tree-shaken in prod).
