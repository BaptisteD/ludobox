# Brief — Brique 6 : Fiche jeu (lecture + statistiques)

> Conversation Claude Code dédiée. Racine : `/Users/baptiste/Documents/DEV/Ludobox`. **Prérequis : briques 1, 2, 4 livrées.**

## Contexte projet

**Ludobox** : la **Fiche jeu est le cœur du produit** (logging + lecture). Lis **`prd-fiche-jeu-v1.md`** et `DESIGN.md` §Layout (structure Fiche jeu). Cette brique branche les **sélecteurs de stats purs de la brique 1** sur l'UI de la brique 2. Ici, **lecture seulement** — l'ajout de partie est la brique 7.

## But de la brique

Afficher la fiche d'un jeu avec ses statistiques calculées à la lecture et son historique.

## Périmètre (Build) — dans `src/features/game/`

Structure top→bottom (cf. `DESIGN.md`) :
- **Header** : back + overflow (l'overflow donne accès à suppression — la sheet existe déjà brique 4).
- **Hero** : titre Baloo 36px ; rangée appariant `Tag` type + meta (joueurs · durée) à gauche avec le **nb de parties** (glyphe dé + count Baloo 28px) right-aligné. Le nb de parties est dans le hero pour les **deux types**.
- **Contenu** :
  - **CTA "Ajouter une partie"** (coral, pleine largeur) — déclenche la navigation vers le formulaire (brique 7 ; pour l'instant, route stub si la 7 n'est pas faite).
  - **Carte feature** : compétitif → `RecordCard` (RECORD + grand nombre + avatar détenteur, initiale) ; coopératif → `SuccessRateCard` (% + barre win/loss + compteurs succès/échec, « sur N parties »).
  - **Classement par victoires** (compétitif) : `LeaderboardRow` ordonnés, rang 1 sur surface raised.
  - **Historique chronologique** : `HistoryRow` (date + résultat + meta + chevron), tri déterministe (playedAt desc, createdAt desc).
- **États** : compétitif, coopératif, **vide** (dice motif + copie + CTA), suppression (réutilise la sheet).

Toutes les valeurs viennent des **sélecteurs purs** de la brique 1 — **aucune stat recalculée dans le composant**.

## Recette (critères d'acceptation)

- [ ] **E2E Playwright** : ouvrir une fiche avec parties (fixture) → record correct + détenteur ; classement ordonné par victoires ; historique trié.
- [ ] Bascule compétitif/coopératif : le coopératif montre le taux de réussite à la place du record/classement.
- [ ] État vide rendu (dice + CTA) quand le jeu n'a aucune partie.
- [ ] **Recalcul instantané** : après une mutation (suppression d'une partie via fixture), les stats reflètent l'état à jour.
- [ ] Joueur archivé toujours présent par nom dans record/classement/historique.

## Factorisation (Definition of Done)

- [ ] Zéro calcul de stat dans les composants : tout via les sélecteurs purs (brique 1).
- [ ] Pas de cards-in-cards (cf. `DESIGN.md`) ; rows directement sur cream, divisées par l'espace.
- [ ] Composants de la brique 2 réutilisés tels quels.
- [ ] `/code-review` puis `/simplify` ; tests verts ; commit.

## À ne PAS faire ici

Le formulaire d'ajout/édition de partie (brique 7) — seulement le point d'entrée (CTA + navigation). Pas de toast de célébration (brique 7).
