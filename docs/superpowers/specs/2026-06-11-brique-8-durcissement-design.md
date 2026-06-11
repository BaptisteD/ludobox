# Brique 8 — Durcissement : PWA offline, accessibilité WCAG 2.1 AA & recette globale

> Design doc. Racine : `/Users/baptiste/Documents/DEV/Ludobox`. Branche : `brique-8-durcissement`.
> Source : `dev-briefs/brique-8-durcissement.md`. Prérequis : briques 0–7 livrées.

## But

Durcissement final et conformité — **aucune nouvelle fonctionnalité**. Garantir le hors-ligne,
l'installabilité PWA, l'accessibilité WCAG 2.1 AA, et valider les 4 parcours clés de bout en bout.

L'essentiel de l'infrastructure existe déjà (vite-plugin-pwa + manifest complet + icônes réelles,
reset `prefers-reduced-motion` global, rendu lisible des joueurs archivés, cibles tactiles ≥44px).
Cette brique cible les **failles réelles** restantes + la **vérification** + la **recette**.

## Constats d'audit (chiffrés)

Ratios de contraste calculés (formule WCAG, sRGB) :

| Paire | Ratio | Seuil | Verdict |
|---|---|---|---|
| crème `#fff6e9` sur **coral** `#e14b6a`, texte 14px (Tag, ResultChip, SegmentedResult actif, RankBadge) | **3.62** | 4.5:1 | ❌ |
| crème sur **teal** `#1fa091`, texte 14px (idem) | **3.02** | 4.5:1 | ❌ |
| **chevron** `ink-faint #c7b493` sur crème `#fdf3e3` (signale une ligne tappable) | **1.84** | 3:1 | ❌ |
| crème sur coral/teal — gros texte CTA / Avatar (≥18.66px gras) | 3.62 / 3.02 | 3:1 | ✓ |
| `ink-muted #7a6a56` (mois 9px) sur tuile **blanche** `#ffffff` | 5.22 | 4.5:1 | ✓ |
| `ink-muted` méta sur crème | 4.75 | 4.5:1 | ✓ |
| `ink-faint`/`putty` sur éléments **désactivés** (CTA dormant, placeholder) | — | exempté WCAG | ✓ |

## Périmètre

### 1. Remédiation contraste (churn minimal sur les tokens)

- **Coral** `--coral #e14b6a → #c43355` (crème/coral = **4.96**).
- **Teal** `--teal #1fa091 → #147d71` (crème/teal = **4.67**).
- Ces deux tokens ne sont jamais du texte sur crème ; ce sont des fonds. Les assombrir
  **améliore** tout texte crème-sur-couleur et ne dégrade aucune autre paire (les contours/ombres
  restent `ink-primary`). Stratégie retenue : assombrir les tokens globaux (2 valeurs), **pas** de
  shades `-deep` parallèles (éviter deux corals côte à côte).
- **Chevron** : nouveau token dédié `--chevron-disclosure: #988568` (crème = **3.24**, ≥3:1),
  appliqué à `HistoryRow .chevron`. Le `ink-faint` faible
  reste pour les usages réellement décoratifs / désactivés (exemptés).
- **Synchroniser** `DESIGN.md` (valeurs hex coral/teal + note chevron) et les commentaires de
  `tokens.css` avec les nouvelles valeurs.

### 2. Sémantique des titres (un seul `<h1>` par écran)

`BackHeader` rend toujours `<h1>{title}</h1>`. Deux familles d'appelants :
- **Sans `<h1>` propre** (`GameForm` `title={title}`, `PlayerDetail` `title={name}`,
  `PlaceholderDetail`) — le `<h1>` de `BackHeader` EST leur titre de page. À conserver.
- **Avec `<h1>` héro propre** (`GameDetail` ligne ~159, `PlayForm` ligne ~289) qui passent `title=""` :
  ils obtiennent **deux `<h1>` dont un vide**. C'est le bug.

Correction : `BackHeader` ne rend le `<h1>` **que si `title` est non vide** ; sinon il n'émet aucun
titre (le `<header>` landmark + bouton retour `aria-label="Retour"` restent). Ainsi chaque écran a
exactement **un** `<h1>` : via `BackHeader` pour GameForm/PlayerDetail/PlaceholderDetail, via le héro
pour GameDetail/PlayForm. La prop `title` est conservée (toujours utilisée).

### 3. Robustesse hors-ligne

- Ajouter `navigateFallback: 'index.html'` explicite au bloc `workbox` de `vite.config.ts` pour que
  la navigation profonde / le refresh hors-ligne résolvent le shell SPA (au lieu de dépendre du
  défaut). `globPatterns` couvre déjà `js,css,html,svg,png,woff2` (shell + polices + assets).
- Vérifier au build/preview que le SW précache bien shell + polices woff2.

### 4. Garde-fou a11y automatisé

- Ajouter le devDependency `@axe-core/playwright`.
- Assertion « zéro violation serious/critical » (tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`)
  sur les 4 écrans clés, intégrée à la suite E2E (helper partagé `e2e/axe.ts`).

### 5. Recette des 4 parcours (E2E end-to-end)

Auditer les specs existantes (`game-sheet`, `play-form`, `players`, `collection`) au regard des 4
parcours du brief, puis ajouter `e2e/recette.spec.ts` qui déroule de bout en bout :

1. **Saisie après soirée jeu** : fiche jeu → ajouter une partie compétitive (scores + gagnant) →
   toast record → record / classement / historique à jour.
2. **Stats d'un jeu** : ouvrir une fiche → nb parties, record + détenteur, classement, historique
   chronologique ; taux de réussite pour un coopératif.
3. **Fiche joueur** : ouvrir → parties, scores, résultats, compteurs parties/victoires.
4. **Gestion collection** : créer / éditer / supprimer un jeu (cascade) ; créer / renommer /
   archiver un joueur, et **confirmer la persistance** du joueur archivé dans l'historique.

Réutiliser le seam dev `window.__ludobox` pour seed quand utile. Pas de duplication : si un parcours
est déjà couvert intégralement par une spec existante, l'étendre plutôt que recopier.

### 6. README + version

- README : section **PWA / hors-ligne** (build prod, install standalone, vérif offline).
- Bump `package.json` `0.1.0 → 1.0.0`.
- Tag annoté `v1.0.0` sur le commit de brique (après recette + factorisation vertes).

## Recette (checklist de sortie)

- [ ] `npm test` — domaine/stats/validations vert.
- [ ] `npm run test:e2e` — 4 parcours + assertions axe verts.
- [ ] `npm run build && npm run preview` — installer la PWA, **couper le réseau**, dérouler le
      parcours 1 + archiver un joueur et confirmer sa persistance.
- [ ] Contrastes AA confirmés (tableau ci-dessus re-vérifié sur les nouvelles valeurs).
- [ ] `npm run lint` vert.

## Factorisation (Definition of Done)

- [ ] Revue transverse : code mort supprimé (prop `title` de `BackHeader`), cohérence tokens ↔ DESIGN.md.
- [ ] README de prise en main à jour (install, scripts, build PWA).
- [ ] `/code-review` puis `/simplify` sur le diff transverse ; commit ; tag `v1.0.0`.

## Hors-périmètre

Aucune fonctionnalité V2 (BoardGameGeek, images, multi-appareils, équipes, fusion de joueurs,
stats inter-jeux). Aucun nouveau token décoratif au-delà du `--chevron-disclosure`. Ne pas darken
au-delà du minimum nécessaire pour franchir le seuil.
