# Brief — Brique 3 : Coquille de navigation

> Conversation Claude Code dédiée. Racine : `/Users/baptiste/Documents/DEV/Ludobox`. **Prérequis : briques 0 et 2 livrées.**

## Contexte projet

**Ludobox**, PWA mobile-first. Lis **`prd-navigation-v1.md`** en entier — c'est la spec contractuelle de cette brique.

## But de la brique

Le squelette de navigation qui relie les deux espaces de premier niveau (Collection, Joueurs) et les écrans de détail. Minimal, prévisible au pouce.

## Périmètre (Build) — dans `src/app/`

- **Bottom bar** à deux entrées (Collection / Joueurs), icône + libellé, onglet actif mis en évidence **sans reposer sur la couleur seule** (poids/forme), cibles ≥44px.
- **Présence de la bottom bar limitée aux écrans de premier niveau** ; absente sur tout écran de détail (qui affiche à la place un retour explicite en en-tête).
- **Pile de navigation** : descente dans les détails, retour qui **dépile d'un cran** (vers l'écran appelant, pas directement la liste).
- Lancement sur **Collection**.
- **Re-tap de l'onglet actif** → remontée en haut de la liste (non destructif).
- **Recalcul à la lecture au retour** sur un écran de premier niveau (le contenu reflète toute mutation faite dans un détail).
- **Conservation du scroll** des listes de premier niveau tant que l'app reste en mémoire.
- **Retour depuis un objet supprimé/archivé** (jeu supprimé, joueur archivé) → ramené à l'écran de premier niveau pertinent, l'objet n'y figure plus.
- Geste de retour système (Android) mappé sur la même navigation.

Pour l'instant, Collection et Joueurs peuvent être des **écrans placeholder** (les contenus réels arrivent briques 4–5). L'enjeu ici est la **mécanique de navigation**, pas le contenu.

## Recette (critères d'acceptation)

- [ ] Tests unitaires sur la logique de pile : dépilement d'un cran, présence de la bottom bar uniquement au premier niveau, recalcul déclenché au retour.
- [ ] **E2E Playwright** : au lancement on est sur Collection avec bottom bar ; bascule Collection↔Joueurs ; descente dans un détail → bottom bar disparaît + retour visible ; retour → on remonte d'un cran et la bottom bar réapparaît au premier niveau.
- [ ] Re-tap onglet actif remonte en haut de liste.

## Factorisation (Definition of Done)

- [ ] Logique de pile isolée (réducteur/hook) du rendu, testable indépendamment.
- [ ] Règle "bottom bar au premier niveau uniquement" centralisée, pas dispersée par écran.
- [ ] `/code-review` puis `/simplify` ; tests verts ; commit.

## À ne PAS faire ici

Pas de contenu réel des listes ni des fiches (briques suivantes). Pas de recherche/filtres (V2).
