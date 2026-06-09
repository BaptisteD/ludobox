# PRD — Écran Fiche joueur (Ludothèque personnelle, V1)

> Document spécifique à un seul écran : la **fiche joueur**. Il est auto-suffisant : un développeur qui ne connaît pas le contexte doit pouvoir le lire et comprendre exactement quoi construire pour cet écran. Il s'inscrit dans le périmètre du brief produit V1 (journal de parties personnel, mobile, hors-ligne, sans compte) et partage le vocabulaire contractuel du PRD fiche jeu.
>
> **Version 2.** Amendement actant que l'archivage du joueur se déclenche depuis cette fiche (menu d'overflow de l'en-tête), et non depuis l'espace Joueurs. Impacts : sections 1, 4.1, 4.2, 4.4 (nouvelle), US6 (nouvelle), 6, 7, 9, 10, 11.

-----

## 1. Vision de l'écran

La fiche joueur restitue le parcours d'une personne à travers toutes ses parties, tous jeux confondus. Elle répond à la question "qu'est-ce que cette personne a joué, et avec quels résultats". C'est un écran de lecture : on y consulte l'historique et deux compteurs simples, et on y accède au détail d'une partie pour la corriger. Le renommage et l'archivage du joueur s'y font également, via le menu d'overflow de l'en-tête. L'écran ne calcule aucune statistique inter-jeux (taux de victoire global, jeu fétiche) : ces agrégats relèvent de la V2.

## 2. Problème et utilisateur

Utilisateur unique : le propriétaire de la collection, sur téléphone, en usage personnel. Données locales à l'appareil, pas de compte. Le problème résolu par cet écran : retrouver d'un coup d'œil ce qu'une personne a joué et comment elle s'en est sortie, et pouvoir corriger une saisie en ouvrant la partie concernée.

## 3. Définitions (vocabulaire contractuel)

Les définitions de Jeu, Partie, Participation, Indicateur de victoire, Gagnant et Joueur archivé sont celles du PRD fiche jeu. Rappels et ajouts utiles à cet écran :

- **Joueur** : identité propre et stable. Le nom est un libellé d'affichage modifiable ; l'identité interne ne change pas au renommage.
- **Joueur actif** : joueur non archivé. Seuls les joueurs actifs ont une fiche consultable.
- **Joueur archivé** : retiré de la liste active, absent de l'autocomplete, sans fiche consultable. Cet écran n'est donc jamais atteignable pour un joueur archivé. L'archivage est l'action qui fait passer un joueur de l'état actif à l'état archivé ; il est déclenché depuis cette fiche (voir 4.1 et US6).
- **Archivage** : changement d'état (actif vers archivé), jamais un effacement. Le joueur sort de la liste active et de l'autocomplete et perd sa fiche, mais ses participations passées et les statistiques dérivées (record, classement, historiques) restent intègres.
- **Nombre de parties (du joueur)** : nombre de parties auxquelles le joueur a une participation, tous types de jeu confondus. Voir règle 8.1.
- **Nombre de victoires (du joueur)** : nombre de participations du joueur marquées gagnantes sur des jeux **compétitifs** uniquement. Les succès coopératifs n'entrent pas dans ce compteur. Voir règle 8.2.
- **Résultat (d'une ligne d'historique)** : Victoire ou Défaite pour une partie compétitive ; Succès ou Échec pour une partie coopérative (résultat collectif).

## 4. Périmètre fonctionnel de l'écran

### 4.1 Dans le périmètre

- Affichage de l'en-tête joueur (nom, deux compteurs : nombre de parties, nombre de victoires).
- Renommage du joueur depuis cette fiche (via le menu d'overflow de l'en-tête).
- Archivage ("suppression") du joueur depuis le menu d'overflow de l'en-tête, avec confirmation explicite. Comportement = archivage, pas effacement (voir définitions et règle 8 / section 10).
- Historique chronologique de toutes les parties du joueur, tous jeux confondus.
- Ouverture de la fiche de partie en tapant une ligne d'historique (point d'entrée uniquement, voir 4.3).
- État vide quand le joueur n'a aucune partie.

### 4.2 Hors périmètre de l'écran

- Statistiques inter-jeux (taux de victoire global, jeu le plus joué, jeu fétiche) et tout écran de synthèse transverse (V2).
- Création d'un joueur : relève de l'espace Joueurs et de la saisie de partie à la volée.
- Édition et suppression d'une partie : relèvent de la **fiche de partie** (dépendance externe, voir 4.3).
- CTA "Ajouter une partie" : **absent de cet écran**. L'ajout d'une partie se fait exclusivement depuis la fiche jeu (seul écran porteur de ce CTA), car une partie est rattachée à un jeu.

### 4.3 Dépendance : la fiche de partie

Cet écran référence un écran partagé non spécifié dans ce document : la **fiche de partie** (détail d'une partie, avec édition de tous les champs et suppression). Cette fiche est également appelée depuis la fiche jeu. Pour la fiche joueur, le contrat est limité à :

- **Entrée** : taper une ligne d'historique ouvre la fiche de la partie correspondante.
- **Retour** : au retour sur la fiche joueur, l'historique et les deux compteurs sont recalculés à la lecture pour refléter toute édition ou suppression intervenue.

La spécification complète de la fiche de partie (champs éditables, validations, confirmation de suppression) fera l'objet d'un PRD dédié.

### 4.4 Évolution de périmètre actée vs brief V1

L'**archivage du joueur est déclenché depuis la fiche joueur** (menu d'overflow de l'en-tête), et non depuis l'espace Joueurs comme le suggérait le brief V1 (section 4.4). En conséquence, la liste de l'espace Joueurs ne porte **aucune action d'archivage par ligne** : elle se limite à lister, créer et ouvrir un joueur. La mention du brief situant la suppression/archivage dans l'espace Joueurs doit être répercutée dans le brief produit.

## 5. User stories et critères d'acceptation

Format : En tant que [rôle], je veux [action] afin de [bénéfice]. Critères en Given / When / Then.

### US1 — Consulter le parcours d'un joueur

En tant que propriétaire, je veux voir toutes les parties d'une personne en ordre chronologique avec ses compteurs, afin de retrouver son parcours d'un coup d'œil.

- Given un joueur actif avec au moins une partie, When j'ouvre sa fiche, Then l'en-tête affiche son nom, son nombre de parties et son nombre de victoires, et l'historique liste toutes ses parties.
- Given un joueur avec plusieurs parties, When j'ouvre sa fiche, Then l'historique est trié par date décroissante (la plus récente en haut).
- Given une partie compétitive du joueur, When elle s'affiche dans l'historique, Then la ligne montre le jeu, la date, le score du joueur s'il est renseigné, et le résultat Victoire ou Défaite.
- Given une partie coopérative du joueur, When elle s'affiche dans l'historique, Then la ligne montre le jeu, la date et le résultat collectif Succès ou Échec, sans score individuel.

### US2 — Lire les compteurs du joueur

En tant que propriétaire, je veux voir le nombre de parties et le nombre de victoires d'une personne, afin de situer son activité et sa réussite en compétitif.

- Given un joueur avec des parties, When j'ouvre sa fiche, Then le nombre de parties compte toutes ses parties, compétitives et coopératives confondues.
- Given un joueur ayant des participations gagnantes en compétitif, When j'ouvre sa fiche, Then le nombre de victoires compte uniquement ces participations gagnantes compétitives.
- Given un joueur n'ayant joué que des parties coopératives, When j'ouvre sa fiche, Then le nombre de victoires vaut 0 (comportement nominal, pas un état d'erreur).

### US3 — Renommer un joueur

En tant que propriétaire, je veux renommer un joueur depuis sa fiche, afin de corriger une faute de frappe ou d'uniformiser un nom.

- Given une fiche joueur ouverte, When j'ouvre le menu d'overflow de l'en-tête et choisis "Renommer", Then je peux saisir un nouveau nom.
- Given un nouveau nom non vide, When je valide, Then le nom d'affichage est mis à jour partout où il apparaît (fiche, historiques, classements des fiches jeu), l'identité interne restant inchangée.
- Given une tentative de renommage avec un nom vide, When je valide, Then l'enregistrement est bloqué et un message indique qu'un nom est requis.
- Given un nouveau nom déjà porté par un autre joueur actif (comparaison insensible à la casse et aux accents, exclusion du joueur en cours de renommage), When je valide, Then l'enregistrement est bloqué et un message indique que ce nom est déjà utilisé. Le renommage vers un nom identique à un joueur archivé reste autorisé.
- Given un renommage validé, When je consulte une fiche jeu où ce joueur a des participations, Then son nom mis à jour s'affiche dans l'historique et le classement.

### US4 — Ouvrir le détail d'une partie pour la corriger

En tant que propriétaire, je veux ouvrir une partie depuis l'historique d'un joueur, afin de corriger une erreur de saisie après coup.

- Given une ligne d'historique, When je la tape, Then la fiche de la partie correspondante s'ouvre.
- Given une partie éditée ou supprimée depuis la fiche de partie, When je reviens sur la fiche joueur, Then l'historique et les compteurs sont recalculés en conséquence.
- Given une édition retirant ce joueur de la partie, When je reviens sur la fiche joueur, Then cette partie ne figure plus dans son historique et ses compteurs sont recalculés.

### US5 — État vide

En tant que propriétaire, je veux un écran clair quand un joueur n'a aucune partie, afin de comprendre l'état sans le confondre avec un bug.

- Given un joueur actif sans aucune partie, When j'ouvre sa fiche, Then l'historique est remplacé par un état vide explicite (libellé du type "Aucune partie enregistrée pour ce joueur") et les deux compteurs affichent 0.
- Given un joueur dont la dernière partie vient d'être supprimée, When je reviens sur sa fiche, Then la fiche bascule sur l'état vide.

### US6 — Archiver un joueur

En tant que propriétaire, je veux archiver un joueur depuis sa fiche, afin de le retirer de ma liste active sans perdre l'historique des parties.

- Given une fiche joueur ouverte, When j'ouvre le menu d'overflow de l'en-tête, Then les actions "Renommer" et "Supprimer" (archivage) y sont disponibles.
- Given l'action "Supprimer" choisie, When je la déclenche, Then une confirmation explicite est requise avant exécution, et le message indique que les parties passées et les statistiques sont conservées.
- Given un archivage confirmé, When il s'exécute, Then le joueur disparaît de la liste active et de l'autocomplete, sa fiche n'est plus consultable, mais ses participations restent dans les historiques et il reste comptabilisé dans toutes les statistiques des jeux (record, classement par victoires, nombre de parties).
- Given un archivage exécuté, When il se termine, Then l'utilisateur est ramené à la liste de l'espace Joueurs (la fiche du joueur archivé n'étant plus consultable).
- Given la confirmation d'archivage, When je l'annule, Then aucun changement n'est appliqué et je reste sur la fiche.

## 6. Flows principaux

**Consultation d'une fiche joueur.** Depuis l'espace Joueurs, l'utilisateur ouvre la fiche d'une personne. Il voit l'en-tête (nom, nombre de parties, nombre de victoires), puis l'historique chronologique décroissant de toutes ses parties, chaque ligne portant le jeu, la date, le score s'il s'applique, et le résultat selon le type de jeu.

**Renommage.** Depuis le menu d'overflow de l'en-tête, l'utilisateur lance le renommage, saisit un nouveau nom, valide. L'affichage du nom est mis à jour sur cet écran et partout ailleurs ; l'identité interne ne bouge pas.

**Archivage.** Depuis le menu d'overflow de l'en-tête, l'utilisateur choisit "Supprimer". Une confirmation explicite (bottom sheet, pattern aligné sur la suppression de jeu) rappelle que les parties et statistiques sont conservées. Après confirmation, le joueur est archivé et l'utilisateur revient à la liste de l'espace Joueurs.

**Correction d'une partie.** L'utilisateur tape une ligne d'historique, ce qui ouvre la fiche de la partie. Il y édite ou supprime la partie. Au retour sur la fiche joueur, l'historique et les compteurs se recalculent.

## 7. Cas limites et états d'erreur

- **Joueur sans aucune partie** : état vide global, compteurs à 0. Peut survenir pour un joueur créé dans l'espace Joueurs sans partie, ou dont la saisie à la volée a été annulée.
- **Joueur n'ayant que des parties coopératives** : nombre de victoires à 0, comportement nominal. Ne pas le présenter comme une anomalie.
- **Historique mixte (compétitif et coopératif)** : les deux types coexistent dans la même liste. Le libellé de résultat suit le type de chaque partie (Victoire / Défaite pour le compétitif, Succès / Échec pour le coopératif).
- **Score absent sur une participation compétitive** : la ligne affiche un état neutre pour le score (tiret discret ou mention "non renseigné"), le reste de la ligne s'affiche normalement.
- **Parties coopératives** : aucune colonne de score individuel n'est affichée pour ces lignes (le score n'existe pas en coopératif).
- **Archivage d'un joueur ayant des parties** : le joueur reste comptabilisé dans tous les historiques et statistiques des jeux ; seule sa fiche devient inaccessible et il sort de la liste active et de l'autocomplete.
- **Archivage d'un joueur sans aucune partie** : possible ; le joueur disparaît simplement de la liste active.
- **Archivage accidentel** : en V1, aucune fonction de désarchivage n'est prévue (voir question ouverte) ; la confirmation explicite sert de garde-fou.
- **Joueur archivé** : aucune fiche accessible ; l'écran n'est pas atteignable depuis la liste active ni l'autocomplete. En cas d'accès résiduel par un lien obsolète, l'écran ne doit pas se rendre comme une fiche valide (garde-fou à prévoir côté navigation).
- **Suppression de la dernière partie du joueur** depuis la fiche de partie : retour sur la fiche en état vide.
- **Date identique entre deux parties** : départage par horodatage de création décroissant (la partie créée le plus récemment en premier). Règle commune avec la fiche jeu (fiche de partie 8.7).

## 8. Règles de calcul (déterministes, calculées à la lecture)

Toutes les statistiques sont recalculées à chaque affichage, jamais persistées.

### 8.1 Nombre de parties du joueur

1. Considérer toutes les participations du joueur.
1. Le nombre de parties est le nombre de parties distinctes rattachées à ces participations, tous types de jeu confondus.

### 8.2 Nombre de victoires du joueur

1. Considérer les participations du joueur dont l'indicateur de victoire est vrai.
1. Ne retenir que celles rattachées à une partie d'un jeu **compétitif**.
1. Le nombre de victoires est le compte de ces participations.
1. Les parties coopératives, quel que soit leur résultat collectif, n'entrent jamais dans ce compteur (décision actée, fidèle au modèle : la victoire est un attribut de participation, inexistant en coopératif).

### 8.3 Tri de l'historique

1. Trier toutes les parties du joueur par date décroissante (la plus récente en premier).
1. À date égale, départager par horodatage de création décroissant (la partie créée le plus récemment en premier). Règle commune avec la fiche jeu (fiche de partie 8.7).

### 8.4 Contenu d'une ligne d'historique

1. Jeu : nom du jeu, avec indication de son type (compétitif ou coopératif) suffisante pour lever toute ambiguïté sur la sémantique du résultat.
1. Date de la partie.
1. Score : score du joueur sur cette partie si renseigné et si le jeu est compétitif ; sinon état neutre. Jamais de score pour une partie coopérative.
1. Résultat : Victoire / Défaite (compétitif, dérivé de l'indicateur de victoire de la participation) ou Succès / Échec (coopératif, résultat collectif de la partie).

## 9. Séparation UI et logique

- **Logique fonctionnelle** : structure et règles ci-dessus (calculs section 8, validations section 5, comportements section 7). Indépendante du rendu.
- **Rendu visuel (indicatif, mobile-first)** : en-tête avec nom du joueur et deux compteurs lisibles d'un coup d'œil ; menu d'overflow dans l'en-tête donnant accès au renommage et à la suppression (archivage) ; confirmation d'archivage via bottom sheet (pattern aligné sur la suppression de jeu, fond cream assombri, action destructive corail, action neutre "Annuler"). Aucun CTA "Ajouter une partie" sur cet écran. Historique en liste verticale d'entrées tappables, distinction visuelle claire entre Victoire/Défaite et Succès/Échec sans jamais reposer sur la couleur seule (icône, forme ou libellé associés). Cibles tactiles d'au moins 44 px. Le détail du style est laissé à la phase de design ; seules les contraintes d'accessibilité tactile et de hiérarchie sont normatives.

## 10. Contraintes techniques connues

- Mobile-first, cibles tactiles d'au moins 44 px, pas de formulaire multi-étapes.
- Mono-utilisateur, sans compte, fonctionnement hors-ligne, données locales à l'appareil.
- Statistiques toujours calculées à la lecture, jamais stockées, pour préserver l'intégrité lors des éditions et suppressions.
- Modèle de données normalisé (jeux, joueurs, parties, participations), la victoire étant un attribut de la participation.
- Le nom du joueur est un libellé d'affichage dérivé d'une identité interne stable ; le renommage ne touche pas l'identité ni les participations. Le renommage applique la même unicité parmi les joueurs actifs que la création (comparaison insensible à la casse et aux accents, exclusion du joueur en cours de renommage).
- L'archivage est un changement d'état (actif vers archivé), jamais un effacement : les participations et statistiques dérivées restent intègres. Après archivage, la fiche du joueur n'est plus consultable.
- La fiche joueur n'existe que pour les joueurs actifs.

## 11. Questions ouvertes

- [Produit] [RÉSOLU en v2] Déclenchement de l'archivage : acté depuis cette fiche (menu d'overflow), et non depuis l'espace Joueurs. Action de suivi : répercuter dans le brief produit (section 4.4).
- [Acté] Désarchivage / réversibilité : aucune fonction de désarchivage en V1. La confirmation explicite est le seul garde-fou. Un archivage accidentel est irréversible en V1 (décision confirmée, patch corpus V2).
- [Design / UX copy] Libellé de l'action ("Supprimer" vs "Archiver") et texte de la confirmation rappelant la conservation des parties et des statistiques. Défaut retenu : libellé "Supprimer" (cohérent avec la suppression de jeu), comportement = archivage. Non bloquant.
- [RÉSOLU] Règle de tri secondaire des historiques à date égale : horodatage de création décroissant, commun fiche jeu et fiche joueur (fiche de partie 8.7, patch corpus V2 appliqué).
- [Dépendance] La fiche de partie (détail, édition, suppression) n'est pas spécifiée ici. Elle doit faire l'objet d'un PRD dédié, partagé avec la fiche jeu. Bloquant pour l'implémentation de l'ouverture d'une partie depuis l'historique.
- [Design] Faut-il afficher un indicateur de présence de note sur les lignes d'historique, comme sur la fiche jeu, sachant que la note est portée par la partie et non par la participation ? Non bloquant.
- [Design] Présentation de l'indication de type de jeu sur chaque ligne (tag, icône, libellé) pour distinguer la sémantique Victoire/Défaite de Succès/Échec. Non bloquant.
