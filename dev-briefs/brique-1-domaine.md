# Brief — Brique 1 : Domaine & persistance (le cœur logique)

> Conversation Claude Code dédiée. Racine : `/Users/baptiste/Documents/DEV/Ludobox`. **Prérequis : brique 0 livrée.**

## Contexte projet

**Ludobox** = journal personnel de parties de jeux de société, hors-ligne, données locales (IndexedDB/Dexie), stats **calculées à la lecture, jamais stockées**.

Lis avant de commencer : `product-brief-ludobox-v1.md` (§4 Périmètre, §6 Modèle d'entités, §9 Règles) — c'est la spec contractuelle de cette brique.

## But de la brique

Toute la logique métier et la persistance, **sans aucune UI**. C'est la brique la plus testée : les invariants du produit vivent ici. Cible : couverture exhaustive en Vitest.

## Périmètre (Build) — dans `src/domain/` et `src/db/`

### Types (`src/domain/types.ts`)
- `Game` : `id`, `name`, `type: 'competitive' | 'cooperative'`, `minPlayers?`, `maxPlayers?`, `durationMin?`.
- `Player` : `id`, `name`, `status: 'active' | 'archived'`.
- `Play` : `id`, `gameId`, `playedAt` (date jouée, modifiable), `note?`, `createdAt` (immuable, tri secondaire déterministe).
- `Participation` : `id`, `playId`, `playerId`, `score: number | null`, `isWinner: boolean`. (Coopératif : le résultat collectif succès/échec est porté au niveau de la `Play` — modélise via un champ `coopResult?: 'success' | 'failure'` ou équivalent ; documente le choix.)

### Persistance Dexie (`src/db/`)
- Schéma normalisé : 4 tables (`games`, `players`, `plays`, `participations`) avec index pertinents (`plays.gameId`, `participations.playId`, `participations.playerId`).
- Repository CRUD par entité, async.

### Validations (fonctions pures, `src/domain/validation.ts`)
- **Normalisation de nom** : util unique `normalizeName` (NFD + suppression des diacritiques + lowercase + trim) réutilisé partout.
- **Unicité nom de jeu** dans la collection (insensible casse + accents).
- **Unicité nom de joueur parmi les actifs uniquement** (homonyme d'un joueur archivé autorisé).
- **Type de jeu immuable dès la 1ʳᵉ partie** enregistrée.
- Validité partie **compétitive** : ≥1 participant ET ≥1 gagnant (ex-aequo autorisé : plusieurs `isWinner`). Partie **solo** autorisée (1 participant pouvant être l'unique gagnant). Score `null` = non renseigné, entier, négatif autorisé.
- Validité partie **coopérative** : ≥1 participant, résultat collectif `success | failure` (défaut `success`), pas de score ni de gagnant.
- **Suppression de jeu** → cascade sur ses parties + participations.
- **Suppression de joueur = archivage** (jamais d'effacement) ; participations passées intègres.

### Sélecteurs de stats (purs, `src/domain/stats.ts`)
Entrée = données brutes, sortie = vue. **Aucun accès direct au store** dans ces fonctions.
- Jeu compétitif : nb parties ; **record** (valeur du high score + nom du détenteur) ; **classement des joueurs par nombre de victoires** sur ce jeu.
- Jeu coopératif : nb parties ; nb succès / échecs ; **taux de réussite**.
- Joueur : nb parties ; **nb victoires** (uniquement participations gagnantes sur jeux **compétitifs** — les succès coop n'y entrent pas).
- **Un joueur archivé reste comptabilisé partout** (record, classement, historique) ; il ne disparaît que des listes actives/autocomplete (géré en UI plus tard).
- Tri d'historique **déterministe** : `playedAt` desc puis `createdAt` desc.

## Recette (Vitest, exhaustif)

Un cas de test par règle. Couvre explicitement les cas limites :
- [ ] Nom de jeu dupliqué refusé (« Café » vs « cafe »).
- [ ] Nom de joueur actif dupliqué refusé ; homonyme d'archivé accepté.
- [ ] Type de jeu verrouillé après 1ʳᵉ partie.
- [ ] Partie compétitive sans gagnant rejetée ; avec ex-aequo (2 gagnants) acceptée ; solo acceptée.
- [ ] Score `null` géré comme « non renseigné » (pas 0) ; score négatif accepté.
- [ ] Record = bon high score + bon détenteur ; classement ordonné par victoires.
- [ ] Taux de réussite coopératif correct.
- [ ] Compteur victoires joueur = seulement compétitif gagnant.
- [ ] Suppression de jeu → parties et participations bien supprimées (cascade).
- [ ] Archivage d'un joueur → reste dans record/classement/historique, stats inchangées.
- [ ] Tri d'historique déterministe (même `playedAt`, départage par `createdAt`).

Tests sur base Dexie en mémoire (`fake-indexeddb`).

## Factorisation (Definition of Done)

- [ ] `normalizeName` est l'unique point de normalisation, réutilisé partout.
- [ ] Sélecteurs de stats purs et sans accès au store (testables avec des données en dur).
- [ ] `/code-review` puis `/simplify` sur le diff ; tests verts ; commit.

## À ne PAS faire ici

Aucune UI, aucun composant React, aucune route. Seulement domaine + persistance + tests.
