# Ludobox

Journal personnel de parties de jeux de société. PWA **mobile-first** (390px),
**hors-ligne**, **sans compte**, données locales à l'appareil.

Stack : **React + Vite + TypeScript**, persistance **IndexedDB via Dexie**,
recette **Vitest** (logique) + **Playwright** (E2E ciblés).

## Prérequis

- Node ≥ 20 (développé sous Node 25, npm 11)

## Installation

```bash
npm install
npx playwright install chromium   # navigateur pour les tests E2E
```

## Scripts

| Script             | Rôle                                              |
| ------------------ | ------------------------------------------------- |
| `npm run dev`      | Serveur de dev Vite (http://localhost:5173)       |
| `npm run build`    | Type-check + build de production (PWA)             |
| `npm run preview`  | Sert le build de production                        |
| `npm test`         | Tests unitaires Vitest (run unique)                |
| `npm run test:watch` | Vitest en mode watch                             |
| `npm run test:e2e` | Tests E2E Playwright                               |
| `npm run lint`     | ESLint + vérification du formatage Prettier        |
| `npm run format`   | Applique Prettier                                  |

## PWA & hors-ligne

Ludobox est une PWA installable qui fonctionne **entièrement hors-ligne** (données en
IndexedDB, shell + polices précachés par le service worker).

```bash
npm run build      # build de production + service worker (Workbox)
npm run preview    # sert le build prod sur http://localhost:4173
```

Pour vérifier l'installabilité et le hors-ligne :

1. `npm run build && npm run preview`, ouvrir l'URL dans Chrome.
2. Installer l'app (icône d'installation de la barre d'adresse) → elle se lance en **standalone**.
3. Couper le réseau (DevTools → Network → Offline) puis recharger : l'app démarre, navigue,
   lit et écrit. La navigation profonde retombe sur le shell (`navigateFallback`).

## Conventions de dossiers

Alias d'import **`@/`** → `src/` (configuré dans `vite.config.ts` et
`tsconfig.app.json`).

```
src/
  app/        Coquille applicative, routing, providers
  domain/     Logique métier pure (entités, règles, stats calculées à la lecture)
  db/         Persistance Dexie / IndexedDB
  features/   Écrans et fonctionnalités (collection, joueurs, fiches…)
  ui/         Composants UI réutilisables (design system)
  styles/     tokens.css (source unique des tokens), fonts.css, global.css
  assets/     Polices self-host (woff2) et médias
  test/       Setup Vitest + tests transverses
e2e/          Tests Playwright
public/       Icônes PWA, favicon
scripts/      Outils de build (génération d'icônes)
```

## Design system

Les tokens visuels (couleurs, outlines, ombres dures, rayons, échelle typo)
sont centralisés dans **`src/styles/tokens.css`** — source de vérité unique,
transcrite de `DESIGN.md` (direction « Tabletop pop »). Aucune couleur en dur
ailleurs dans le code.

**Invariant transverse** : les statistiques et compteurs sont **toujours
calculés à la lecture, jamais stockés**.
