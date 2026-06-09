# Brief — Brique 4 : Collection (liste + CRUD jeu)

> Conversation Claude Code dédiée. Racine : `/Users/baptiste/Documents/DEV/Ludobox`. **Prérequis : briques 1, 2, 3 livrées.**

## Contexte projet

**Ludobox** : la Collection est une liste de jeux saisis à la main, conteneurs des parties. Lis **`prd-listes-v1.md`** et **`prd-formulaire-jeu-v1.md`** — specs contractuelles. Réutilise le domaine (brique 1), les composants (brique 2) et la navigation (brique 3).

## But de la brique

L'espace **Collection** complet : lister, créer, éditer, supprimer un jeu.

## Périmètre (Build) — dans `src/features/collection/`

- **Liste** des jeux en vignettes : placeholder (fond coloré + initiale du jeu) + nom + **nb de parties** dans un **slot fixe à droite** (right-aligned, unité `parties`/`partie` alignée — voir `DESIGN.md` §Numerals). Compteur **calculé à la lecture**.
- **CTA de création** de jeu.
- **Formulaire ajout** : nom **requis et unique** (insensible casse/accents, via le domaine), type **requis** (compétitif/coopératif), min/max joueurs et durée **optionnels**. En-tête visuel = placeholder seul (pas d'upload image en V1).
- **Formulaire édition** : nom + métadonnées. **Type modifiable tant qu'aucune partie** n'existe ; verrouillé sinon (avec indication claire). Mutualiser création/édition.
- **Suppression** via `BottomSheet` de confirmation explicite (icône trash coral, titre nommant le jeu) → **cascade** sur toutes les parties associées (logique domaine).
- **État vide** de la collection (invitant, pas blanc).

## Recette (critères d'acceptation)

- [ ] **E2E Playwright** : créer un jeu → il apparaît dans la liste → l'éditer → le supprimer (avec confirmation) → il disparaît.
- [ ] Nom dupliqué refusé avec message clair (« Café » vs « cafe »).
- [ ] Type verrouillé en édition dès qu'une partie existe (fixture).
- [ ] Au retour sur la liste après mutation, le **compteur de parties est recalculé**.
- [ ] Suppression → cascade vérifiée (parties associées disparaissent).
- [ ] Cibles ≥44px, état vide rendu.

## Factorisation (Definition of Done)

- [ ] Réutilise `TextField`, `BottomSheet`, `Avatar`/placeholder de la brique 2 (pas de réimplémentation).
- [ ] Formulaire création/édition mutualisé.
- [ ] Validations déléguées au domaine (brique 1), pas dupliquées dans l'UI.
- [ ] `/code-review` puis `/simplify` ; tests verts ; commit.

## À ne PAS faire ici

Pas de saisie de partie (brique 7), pas d'intégration BoardGameGeek ni upload image (V2).
