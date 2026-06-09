# Brief — Brique 7 : Fiche partie (le formulaire) + célébration

> Conversation Claude Code dédiée. Racine : `/Users/baptiste/Documents/DEV/Ludobox`. **Prérequis : briques 5 et 6 livrées** (donc 1–4 aussi).

## Contexte projet

**Ludobox** : la saisie de partie est l'action **la plus utilisée**, le chemin sans friction est sacré. C'est le **premier formulaire** du corpus et l'écran le plus complexe. Lis **`prd-fiche-partie-v1.md`** et `DESIGN.md` §Fiche partie components (specs exactes des inputs). Réutilise tous les composants de la brique 2.

## But de la brique

Le formulaire de saisie/édition de partie, compétitif et coopératif, avec validation, suppression, abandon, et le toast de confirmation/célébration au retour.

## Périmètre (Build) — dans `src/features/play-form/`

- **Ouverture depuis la Fiche jeu** (CTA "Ajouter une partie").
- **Context block** : overline (`Nouvelle partie` / `Modifier la partie`) + titre du jeu Baloo **27px** + tag de type **immuable**.
- **Date** : pré-remplie à aujourd'hui, modifiable (`DateField`).
- **Participants** :
  - `Autocomplete` sur les **joueurs actifs** + **création à la volée** (ligne `Créer « <nom> »` sur surface raised). Unicité de nom déléguée au domaine (même util que brique 5).
  - **Compétitif** : lignes participant avec `Avatar` (coral/teal/ink — pas gold), nom, **score input** (60×38, entier optionnel, négatif autorisé, vide = non renseigné) et **`WinnerToggle`** (couronne, ex-aequo = plusieurs on), + remove `×`. Helper « Touche le trophée pour désigner le gagnant. Le score est facultatif. »
  - **Coopératif** : lignes participant (avatar + nom + remove), pas de score ni gagnant ; **`SegmentedResult`** `Résultat collectif` (Succès/Échec, défaut Succès).
- **Note** : `NoteField` libre, `facultatif`.
- **Validité minimale → état du Save** :
  - Compétitif : **≥1 participant ET ≥1 gagnant**.
  - Coopératif : ≥1 participant (résultat par défaut Succès).
  - Save **disabled** = forme dormante (putty, sans ombre). Jamais de Save disabled sans **indice inline** expliquant le blocage.
  - **Indice "gagnant manquant"** (compétitif) : ligne discrète au-dessus du Save, couronne outline coral + `Désigne le gagnant pour enregistrer la partie.`
- **Édition** : pré-remplie ; en-tête `⋮` donnant accès à la suppression ; label Save `Enregistrer les modifications`.
- **Sheets** : **suppression de partie** (trash) et **abandon des modifications non enregistrées** (undo-arrow / `Abandonner` / `Continuer la saisie`).
- **Retour + toast** : après `Enregistrer`, retour sur la Fiche jeu avec le **`Toast` gold** célébrant le moment le plus fort (`Nouveau record, <nom>` si record battu, sinon `<nom> l'emporte`) + sous-ligne `Partie enregistrée · N pts`. Dégrade en apparition instantanée sous `prefers-reduced-motion`. Une seule célébration, jamais de confetti.

## Recette (critères d'acceptation)

- [ ] **E2E Playwright** (parcours clé) : ouvrir le formulaire depuis une fiche compétitive → ajouter participants (scores) → désigner un gagnant → enregistrer → retour fiche jeu avec **toast** + historique et stats à jour.
- [ ] Save **désactivé** tant qu'aucun gagnant en compétitif, avec **indice** affiché ; s'active dès qu'un gagnant est désigné.
- [ ] **Création de joueur à la volée** depuis l'autocomplete → le joueur existe ensuite dans l'espace Joueurs.
- [ ] Flux **coopératif** : pas de score, segmented Succès/Échec, Save actif dès 1 participant.
- [ ] **Édition** : valeurs pré-remplies, modification persistée.
- [ ] **Suppression** et **abandon** : sheets de confirmation fonctionnelles ; abandon ne perd pas par erreur.
- [ ] Ex-aequo (plusieurs gagnants) accepté ; partie solo acceptée.

## Factorisation (Definition of Done)

- [ ] **Hook de form/validation** extrait et testable indépendamment de l'UI (Vitest).
- [ ] Réutilise `WinnerToggle`, `SegmentedResult`, `Autocomplete`, `Toast`, sheets, `Avatar`, `DateField`, `NoteField` (brique 2) — pas de réimplémentation.
- [ ] Validations et calcul "record battu ?" délégués au domaine (brique 1).
- [ ] `/code-review` puis `/simplify` ; tests verts ; commit.

## À ne PAS faire ici

Pas de parties en équipe (V2). Pas de nouvelle logique de stats (réutilise la brique 1).
