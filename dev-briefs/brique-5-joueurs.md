# Brief — Brique 5 : Joueurs (liste + fiche + renommage + archivage)

> Conversation Claude Code dédiée. Racine : `/Users/baptiste/Documents/DEV/Ludobox`. **Prérequis : briques 1, 2, 3 livrées.**

## Contexte projet

**Ludobox**. Lis **`prd-fiche-joueur-v2.md`** et **`prd-formulaire-joueur-v1.md`** — specs contractuelles. Réutilise domaine (brique 1), composants (brique 2), navigation (brique 3).

## But de la brique

L'espace **Joueurs** complet : liste, fiche joueur, création, renommage inline, archivage.

## Périmètre (Build) — dans `src/features/players/`

- **Liste des joueurs actifs** : nom + compteur dans un slot fixe (cf. `DESIGN.md` §Numerals). **Aucune action d'archivage par ligne.**
- **Création** d'un joueur : nom **unique parmi les actifs** (insensible casse/accents ; homonyme d'un archivé autorisé) — règle du domaine.
- **Fiche joueur** :
  - Identité : `Avatar` (initiale, couleur game-piece) + nom Baloo 34px.
  - Compteurs **two-up** (parties jouées · victoires) séparés par un divider vertical ink ; victoires avec petite couronne gold, nombre en `gold/ink`. Compteur victoires = **uniquement victoires compétitives**.
  - **Historique cross-jeu** : une ligne par partie (nom du jeu + chip résultat + score). `Victoire`/`Défaite` (compétitif) ou `Succès`/`Échec` (coop). **« Score non renseigné »** rendu explicitement en italique `ink/muted` (jamais vide/erreur).
  - **Pas de CTA "ajouter une partie"**, pas de carte feature : la page lit, elle ne logge pas.
- **Overflow menu** (en-tête "⋮") : `Renommer` + `Supprimer le joueur` (destructif coral).
- **Renommage inline** : `Avatar` + champ blanc + bouton confirm teal + helper « Le nouveau nom s'affiche partout. L'identité du joueur ne change pas. ». Nouveau nom unique parmi actifs. Identité interne stable.
- **Archivage** déclenché **depuis la fiche** (overflow), pas depuis la liste. Le joueur archivé : disparaît de la liste active, de l'autocomplete (brique 7) et n'a plus de fiche, mais **reste affiché par son nom dans les historiques et comptabilisé dans les stats des jeux**.
- **État vide** de la fiche joueur (compteurs à 0 + dice motif + copie).

## Recette (critères d'acceptation)

- [ ] **E2E Playwright** : créer un joueur → le renommer (le nom change partout) → l'archiver (disparaît de la liste).
- [ ] Nom actif dupliqué refusé ; homonyme d'archivé accepté.
- [ ] Un joueur archivé **reste** dans l'historique d'un jeu et dans ses stats (record/classement), mais **n'apparaît plus** dans la liste Joueurs ni l'autocomplete.
- [ ] Compteur victoires = seulement victoires compétitives (les succès coop n'y entrent pas).
- [ ] « Score non renseigné » affiché explicitement quand le score est `null`.

## Factorisation (Definition of Done)

- [ ] Réutilise `Avatar`, overflow menu, `BottomSheet`, `HistoryRow`/`ResultChip` de la brique 2.
- [ ] Règle d'unicité de nom partagée avec la saisie à la volée (brique 7) — même util domaine.
- [ ] `/code-review` puis `/simplify` ; tests verts ; commit.

## À ne PAS faire ici

Pas de saisie de partie (brique 7). Pas de fusion de doublons ni stats inter-jeux (V2).
