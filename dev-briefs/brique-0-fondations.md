# Brief — Brique 0 : Fondations & outillage

> Colle ce brief au début d'une conversation Claude Code dédiée. Travaille à la racine du projet `/Users/baptiste/Documents/DEV/Ludobox`.

## Contexte projet

**Ludobox** est un journal personnel de parties de jeux de société : mobile-first (390px), hors-ligne, sans compte, données locales à l'appareil. Stack décidée : **PWA React + Vite + TypeScript**, persistance **IndexedDB via Dexie**, recette **Vitest (logique) + Playwright (E2E ciblés)**.

Avant de commencer, lis : `PRODUCT.md` (vision) et `DESIGN.md` (système visuel — c'est la source des tokens à créer ici).

## But de la brique

Un squelette d'app qui démarre, les tokens de design appliqués, la chaîne de test prête à l'emploi. **Aucune fonctionnalité métier** dans cette brique.

## Périmètre (Build)

1. **Scaffold** : projet Vite template `react-ts`. Crée l'arborescence cible :
   ```
   src/domain/  src/db/  src/ui/  src/app/  src/features/  src/test/
   e2e/
   ```
2. **PWA** : `vite-plugin-pwa` (manifest avec nom/icônes Ludobox, service worker, shell offline, installable).
3. **Tokens de design** (CSS variables globales, depuis `DESIGN.md`) :
   - Couleurs : `--bg-cream #FDF3E3`, `--bg-cream-raised #FBE7C0`, `--surface-white #FFFFFF`, `--on-dark-cream #FFF6E9`, `--ink-primary #2A2018`, `--ink-muted #7A6A56`, `--ink-faint #C7B493`, `--coral #E14B6A`, `--gold #F4B53C`, `--gold-ink #C98A1E`, `--gold-trophy #E1A11F`, `--gold-on-gold #7A4F1A`, `--teal #1FA091`.
   - Signature : épaisseurs d'outline (2 / 2.5 / 3px) ink, ombres dures (`4px 5px 0`, `5px 6px 0`, `2px 2px 0` — couleur ink, 0 blur). Helpers réutilisables.
   - Rayons (chip 14, CTA 16, carte record 22, etc.), padding écran 20px, rythme 4px.
   - Échelle typo (voir tableau `DESIGN.md` §Typography) en variables ou classes utilitaires.
4. **Polices self-host** : **Baloo 2** (700, 800) + **Hanken Grotesk** (500, 700, 800) en woff2 dans `src/assets/fonts`, `@font-face` + `font-display: swap`. `font-variant-numeric: tabular-nums` sur la racine.
5. **Outillage** : ESLint + Prettier (config TS/React), **Vitest** + `@testing-library/react` + `jsdom` + `fake-indexeddb`, **Playwright**. Alias d'import `@/` → `src/`.
6. Scripts npm : `dev`, `build`, `preview`, `test`, `test:e2e`, `lint`.
7. `git init`, `.gitignore`, premier commit.

## Recette (critères d'acceptation)

- [ ] `npm run dev` affiche une page vide sur fond crème `#FDF3E3`, largeur cadrée à 390px, polices Baloo 2 + Hanken chargées (vérifier dans l'inspecteur).
- [ ] `npm test` s'exécute avec 1 test fumée vert (ex. un util trivial).
- [ ] `npm run test:e2e` lance Playwright avec 1 test fumée vert (la page se charge).
- [ ] `npm run build` produit une PWA installable (manifest + SW présents) ; `npm run preview` la sert.
- [ ] `npm run lint` passe sans erreur.

## Factorisation (Definition of Done)

- [ ] Convention de dossiers et alias `@/` figés et documentés.
- [ ] `README.md` court : prérequis, installation, scripts.
- [ ] Tokens centralisés dans un seul fichier CSS, aucune couleur en dur ailleurs.
- [ ] Commit propre.

## À ne PAS faire ici

Pas d'entités, pas de composants métier, pas d'écrans. Uniquement le socle.
