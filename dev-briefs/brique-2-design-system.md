# Brief — Brique 2 : Design system / UI kit

> Conversation Claude Code dédiée. Racine : `/Users/baptiste/Documents/DEV/Ludobox`. **Prérequis : brique 0 livrée.**

## Contexte projet

**Ludobox**, PWA mobile-first 390px, style **"Tabletop pop"** : fond crème, couleurs "game-piece", outlines ink épais, ombres dures décalées, quelques inclinaisons. Lis **`DESIGN.md`** en entier (c'est LA spec de cette brique) et `PRODUCT.md` §Brand/Design principles.

## But de la brique

Construire **tous les composants visuels réutilisables** de `DESIGN.md` en composants React isolés, **avant** de monter les écrans, pour ne jamais dupliquer la signature visuelle. Composants **sans logique métier** : props pures, présentational.

## Périmètre (Build) — dans `src/ui/`

Implémente chaque composant avec ses variantes/états (réfère-toi à `DESIGN.md` §Components et §Fiche partie components pour les specs exactes) :

- **`CTA` / `Button`** : pill-rect coral 56px, icône + label Baloo, outline 2.5px, ombre `4px 5px 0`. États **enabled** et **disabled** (fill putty `#EFE1C6`, sans ombre, outline `ink/faint`).
- **`Tag`** : pastille type de jeu (Compétitif=coral, Coopératif=teal), texte crème Hanken Bold, toujours avec label.
- **`ResultChip`** : `Victoire`/`Défaite` (teal/coral) et `Succès`/`Échec`, **toujours icône + texte** (jamais couleur seule).
- **`RankBadge`** : badge numéroté rond, cycle gold(1)/teal(2)/coral(3).
- **`Avatar`** : rond, initiale en `on-dark/cream` Baloo, fond game-piece, outline 2.5px + ombre. Paramétré (taille, couleur) — **un seul composant**, pas de variantes copiées.
- **`RecordCard`** et **`SuccessRateCard`** : carte feature gold inclinée `-1.4deg`, radius 22, outline 2.5px, ombre `5px 6px 0`.
- **`LeaderboardRow`** : rang + (trophée) + nom Baloo + count + "vict.". Rang 1 sur `bg/cream-raised`.
- **`HistoryRow`** : tuile date blanche (numéro + mois) + résultat + meta + chevron faint. Divisé par l'espace, pas de bordures.
- **`DiceMotif`** : paire de dés inclinés (coral + gold) pour les états vides.
- **`BottomSheet`** : scrim crème assombri + grabber + disc d'icône 64px + titre Baloo + copie + bouton action + annuler texte.
- **`TextField`**, **`DateField`** (icône calendrier + date lisible + chevron), **`NoteField`** (multi-ligne) : blanc, outline 2px ink, radius 14, **sans ombre**.
- **`WinnerToggle`** : contrôle couronne 40px. On = fill gold + couronne ink + ombre `2px 2px 0` ; off = transparent + couronne outline `ink/faint`. État jamais par couleur seule.
- **`SegmentedResult`** : track blanc 2 segments (Succès=teal+check / Échec=coral+cross), le sélectionné rempli, l'autre transparent.
- **`Autocomplete`** : popover blanc, outline 2px + ombre, matches actifs en haut + ligne **créer à la volée** sur `bg/cream-raised` avec disc coral `+`.
- **`Toast`** : toast gold incliné `-1.4deg` (célébration/confirmation), avatar + badge couronne crème, titre Baloo + sous-ligne. Apparition instantanée sous `prefers-reduced-motion`.

## Recette (critères d'acceptation)

- [ ] **Galerie de démo** interne (route `/ui-gallery` ou page dédiée) affichant chaque composant dans toutes ses variantes/états — sert de référence visuelle vivante.
- [ ] Tests RTL sur les composants à logique d'état : `WinnerToggle` (toggle on/off), `SegmentedResult` (sélection), `CTA` (enabled/disabled), `Autocomplete` (filtrage + ligne créer).
- [ ] A11y de base : toutes les cibles tactiles ≥44px ; aucun statut transmis par la couleur seule (icône/texte toujours présents) ; rôles ARIA corrects sur boutons/toggles.
- [ ] `prefers-reduced-motion` : le `Toast` n'anime pas.

## Factorisation (Definition of Done)

- [ ] La "signature" (outline + ombre dure) est factorisée dans un util/classe partagé, pas recopiée par composant.
- [ ] `Avatar` unique et paramétré.
- [ ] Tokens consommés depuis la brique 0, **aucune valeur hex en dur**.
- [ ] `/code-review` puis `/simplify` ; tests verts ; commit.

## À ne PAS faire ici

Aucun accès aux données, aucune logique métier, aucune navigation. Composants purs uniquement.
