# Briefs de développement — Ludobox V1

Ce dossier contient un **brief autonome par brique** de développement. Chaque fichier est conçu pour être **collé tel quel au début d'une conversation Claude Code dédiée** : il est auto-suffisant et renvoie aux documents sources du projet pour le détail.

## Ordre d'exécution

Les briques se font **dans l'ordre**, une par conversation. Une brique n'est close qu'après **recette verte ET factorisation** (sa "Definition of Done").

| # | Brief | Dépend de |
|---|-------|-----------|
| 0 | [Fondations & outillage](brique-0-fondations.md) | — |
| 1 | [Domaine & persistance](brique-1-domaine.md) | 0 |
| 2 | [Design system / UI kit](brique-2-design-system.md) | 0 |
| 3 | [Coquille de navigation](brique-3-navigation.md) | 0, 2 |
| 4 | [Collection (CRUD jeu)](brique-4-collection.md) | 1, 2, 3 |
| 5 | [Joueurs](brique-5-joueurs.md) | 1, 2, 3 |
| 6 | [Fiche jeu (lecture + stats)](brique-6-fiche-jeu.md) | 1, 2, 4 |
| 7 | [Fiche partie (formulaire)](brique-7-fiche-partie.md) | 5, 6 |
| 8 | [PWA offline, a11y & recette globale](brique-8-durcissement.md) | toutes |

Les briques 4 et 5 sont parallélisables une fois 1–3 livrées.

## Documents sources (à lire dans chaque conversation)

- `product-brief-ludobox-v1.md` — périmètre fonctionnel et modèle d'entités.
- `PRODUCT.md` — vision, personnalité de marque, principes de design.
- `DESIGN.md` — système visuel "Tabletop pop" (couleurs, typo, composants).
- `prd-navigation-v1.md`, `prd-listes-v1.md`, `prd-fiche-jeu-v1.md`, `prd-fiche-joueur-v2.md`, `prd-fiche-partie-v1.md`, `prd-formulaire-jeu-v1.md`, `prd-formulaire-joueur-v1.md` — spécifications détaillées par écran.

Le plan d'ensemble validé est dans `~/.claude/plans/j-ai-la-sensation-que-lexical-kay.md`.

## Rituel commun à chaque brique

1. **Build** — implémenter le périmètre.
2. **Recette** — vérifier les critères d'acceptation (tests automatisés + checklist).
3. **Factorisation** — `/code-review` puis `/simplify` sur le diff, extraire les doublons, supprimer le code mort, puis commit.

**Invariant transverse** : les statistiques et compteurs sont **toujours calculés à la lecture, jamais stockés**.
