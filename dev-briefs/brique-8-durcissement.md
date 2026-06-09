# Brief — Brique 8 : PWA offline, accessibilité & recette globale

> Conversation Claude Code dédiée. Racine : `/Users/baptiste/Documents/DEV/Ludobox`. **Prérequis : toutes les briques 0–7 livrées.**

## Contexte projet

**Ludobox** V1 fonctionnelle. Lis `PRODUCT.md` §Accessibility & Inclusion et `DESIGN.md` §Accessibility. Cette brique est le **durcissement final** et la **conformité** — pas de nouvelle fonctionnalité.

## But de la brique

Garantir hors-ligne, installabilité, accessibilité WCAG 2.1 AA, et valider les 4 parcours clés de bout en bout.

## Périmètre (Build / vérification)

- **Hors-ligne complet** : couper le réseau → l'app démarre, navigue, lit et écrit ; données persistées en IndexedDB ; service worker met bien en cache le shell + assets.
- **Installabilité PWA** : manifest complet (icônes, nom, thème), prompt d'installation, lance en standalone.
- **Accessibilité WCAG 2.1 AA** :
  - Contrastes — vérifier les plus risqués (cf. `DESIGN.md`) : crème-sur-couleur (`#FFF6E9` sur coral/teal), ink muté (`#7A6A56`, `#C7B493`) sur crème, le **chevron faint** et le **label mois 9px**. Corriger ce qui échoue à AA.
  - Cibles tactiles **≥44px** partout.
  - **Jamais la couleur seule** pour win/loss, type de jeu, rang : toujours icône/texte/nombre.
  - **`prefers-reduced-motion`** respecté partout (toute motion célébratoire/transition dégrade en instantané).
  - Joueur archivé : rendu lisible par son nom dans historiques/stats, **jamais comme un état d'erreur**.
- **Audit Lighthouse** : PWA + Accessibilité.

## Recette (les 4 parcours clés, E2E end-to-end)

1. **Saisie après soirée jeu** : fiche jeu → ajouter une partie compétitive (scores + gagnant) → toast → record/classement/historique à jour.
2. **Stats d'un jeu** : ouvrir une fiche → nb parties, record + détenteur, classement, historique chronologique (et taux de réussite pour un coopératif).
3. **Fiche joueur** : ouvrir une fiche joueur → parties, scores, résultats, compteurs parties/victoires.
4. **Gestion collection** : créer / éditer / supprimer un jeu (cascade) ; créer / renommer / archiver un joueur.

Checklist finale :
- [ ] `npm test` — toute la logique domaine/stats/validations verte.
- [ ] `npm run test:e2e` — les 4 parcours passent.
- [ ] `npm run build && npm run preview` — installer la PWA, **couper le réseau**, dérouler le parcours 1 + archiver un joueur et confirmer sa persistance dans l'historique.
- [ ] Lighthouse PWA + accessibilité au vert (cibles AA).

## Factorisation (Definition of Done)

- [ ] Revue transverse finale : suppression du code mort, cohérence des tokens vs `DESIGN.md`.
- [ ] `README` de prise en main à jour (install, scripts, build PWA).
- [ ] `/code-review` puis `/simplify` sur le diff transverse ; commit ; tag de version V1.

## À ne PAS faire ici

Aucune fonctionnalité V2 (BoardGameGeek, images, multi-appareils, équipes, fusion de joueurs, stats inter-jeux).
