# PRD — Listes Collection et Joueurs (Ludothèque personnelle, V1)

> Document spécifique aux **deux listes de premier niveau** : la Collection (liste des jeux) et l'espace Joueurs (liste des joueurs). Il est auto-suffisant : un développeur qui ne connaît pas le contexte doit pouvoir le lire et comprendre exactement quoi construire pour ces deux écrans. Il s'inscrit dans le périmètre du brief produit V1 (journal de parties personnel, mobile, hors-ligne, sans compte) et partage le vocabulaire contractuel des PRD fiche jeu et fiche joueur. La structure de navigation (bottom bar, retour) relève du PRD Navigation ; les formulaires de création relèvent du PRD Formulaires.

-----

## 1. Vision

Les deux listes sont les écrans de premier niveau de l'app. La Collection liste les jeux, qui sont des **conteneurs de parties** ; l'espace Joueurs liste les personnes actives. Ce sont des écrans de lecture rapide et de point d'entrée : on y retrouve un jeu ou un joueur d'un coup d'œil pour ouvrir sa fiche, et on y déclenche la création d'un nouveau jeu ou joueur. Les deux écrans sont symétriques par construction (même structure : liste triée, entrée avec nom + nombre de parties, CTA de création, état vide).

## 2. Problème et utilisateur

Utilisateur unique : le propriétaire de la collection, sur téléphone, en usage personnel. Données locales à l'appareil, pas de compte. Le problème résolu : accéder vite à un jeu ou un joueur dans une liste lisible, et amorcer une création sans friction, sans surcharge d'information.

## 3. Définitions (vocabulaire contractuel)

Les définitions de Jeu, Partie, Participation, Joueur, Joueur actif et Joueur archivé sont celles des PRD fiche jeu et fiche joueur. Rappels utiles ici :

- **Joueur actif** : joueur non archivé. Seuls les joueurs actifs figurent dans la liste Joueurs et ont une fiche consultable.
- **Joueur archivé** : retiré de la liste active et de l'autocomplete, sans fiche consultable, mais conservé dans les historiques et statistiques. Absent de la liste Joueurs.
- **Nombre de parties (d'un jeu)** : nombre de parties rattachées au jeu (règle de calcul fiche jeu 8.4).
- **Nombre de parties (d'un joueur)** : nombre de parties distinctes auxquelles le joueur a une participation, tous types confondus (règle de calcul fiche joueur 8.1).
- **Unicité du nom de joueur** : deux joueurs actifs ne peuvent pas porter le même nom (comparaison insensible à la casse et aux accents). Un nom identique à un joueur archivé reste possible.

## 4. Périmètre fonctionnel

### 4.1 Dans le périmètre

- Affichage de la liste Collection : pour chaque jeu, son nom et son nombre de parties. Les noms de jeux sont uniques dans la collection (renvoi `prd-formulaire-jeu-v1` règle 8.5).
- Affichage de la liste Joueurs : pour chaque joueur actif, son nom et son nombre de parties ; les joueurs archivés en sont exclus.
- Tri alphabétique des deux listes (voir règle 8.3).
- Ouverture de la fiche correspondante au tap d'une entrée (fiche jeu, fiche joueur).
- CTA "Ajouter un jeu" sur la Collection et "Ajouter un joueur" sur l'espace Joueurs, comme **points d'entrée** vers les formulaires de création.
- États vides des deux listes.

### 4.2 Hors périmètre de l'écran

- Formulaires de création de jeu et de joueur : relèvent du **PRD Formulaires** (validations, champs, upload d'image). Ces listes n'en portent que le déclenchement et l'intégration du résultat.
- Renommage et archivage d'un joueur : relèvent de la fiche joueur.
- Édition et suppression d'un jeu : relèvent de la fiche jeu.
- Bottom bar, retour, présence de navigation : relèvent du PRD Navigation.
- Recherche et filtre : hors V1 (champ de recherche sur la Collection prévu en V2).
- Statistiques inter-jeux, écran d'accueil ou de synthèse transverse : V2.

### 4.3 Dépendances

- **PRD Formulaires** : cible des CTA de création (jeu et joueur). Contrat limité ici à : le CTA ouvre le formulaire ; au retour après création, la nouvelle entrée apparaît dans la liste à sa place de tri.
- **PRD Navigation** : présence/absence de la bottom bar, retour, recalcul à la lecture au retour.
- **Fiche jeu** et **fiche joueur** : cibles du tap sur une entrée.

## 5. User stories et critères d'acceptation

Format : En tant que [rôle], je veux [action] afin de [bénéfice]. Critères en Given / When / Then.

### COL-US1 — Consulter la liste des jeux

En tant que propriétaire, je veux voir tous mes jeux dans une liste, afin de retrouver et d'ouvrir un jeu.

- Given au moins un jeu existe, When j'ouvre la Collection, Then la liste affiche tous les jeux, chacun avec son nom et son nombre de parties.
- Given plusieurs jeux, When la liste s'affiche, Then elle est triée par nom en ordre alphabétique croissant (insensible à la casse et aux accents).
- Given une entrée de jeu, When je la tape, Then la fiche du jeu correspondant s'ouvre.
- Given un jeu sans aucune partie, When il s'affiche, Then son nombre de parties vaut 0 (comportement nominal, pas un état d'erreur).

### COL-US2 — Lancer la création d'un jeu

En tant que propriétaire, je veux ajouter un jeu depuis la Collection, afin d'enrichir ma ludothèque.

- Given la Collection ouverte, When j'active le CTA "Ajouter un jeu", Then le formulaire de création de jeu s'ouvre (PRD Formulaires).
- Given un jeu créé via le formulaire, When je reviens sur la Collection, Then le nouveau jeu apparaît dans la liste à sa place alphabétique.
- Given une création annulée, When je reviens sur la Collection, Then la liste est inchangée.
- Given un nom de jeu identique à un jeu existant, When je tente de créer le jeu, Then la création est bloquée (unicité du nom de jeu, voir PRD Formulaire de jeu).

### COL-US3 — État vide de la Collection

En tant que propriétaire, je veux un écran clair quand je n'ai aucun jeu, afin d'être incité à en ajouter un.

- Given aucun jeu n'existe, When j'ouvre la Collection, Then la liste est remplacée par un état vide explicite (illustration et libellé) et le CTA "Ajouter un jeu" est l'élément dominant.
- Given le dernier jeu vient d'être supprimé, When je reviens sur la Collection, Then elle bascule sur l'état vide.

### JOU-US1 — Consulter la liste des joueurs

En tant que propriétaire, je veux voir mes joueurs actifs dans une liste, afin d'ouvrir la fiche d'une personne.

- Given au moins un joueur actif existe, When j'ouvre l'espace Joueurs, Then la liste affiche tous les joueurs actifs, chacun avec son nom et son nombre de parties.
- Given des joueurs archivés existent, When la liste s'affiche, Then ils n'y figurent pas.
- Given plusieurs joueurs, When la liste s'affiche, Then elle est triée par nom en ordre alphabétique croissant (insensible à la casse et aux accents).
- Given une entrée de joueur, When je la tape, Then la fiche du joueur correspondant s'ouvre.

### JOU-US2 — Lancer la création d'un joueur

En tant que propriétaire, je veux ajouter un joueur depuis l'espace Joueurs, afin de l'avoir disponible pour mes saisies de parties.

- Given l'espace Joueurs ouvert, When j'active le CTA "Ajouter un joueur", Then le formulaire de création de joueur s'ouvre (PRD Formulaires).
- Given un joueur créé via le formulaire, When je reviens sur l'espace Joueurs, Then le nouveau joueur (état actif) apparaît dans la liste à sa place alphabétique.
- Given un nom identique à un joueur actif existant, When je tente de créer le joueur, Then la création est bloquée (unicité parmi les joueurs actifs, voir PRD Formulaire de joueur) ; un nom identique à un joueur archivé reste autorisé.

### JOU-US3 — État vide de l'espace Joueurs

En tant que propriétaire, je veux un écran clair quand je n'ai aucun joueur actif, afin d'être incité à en créer un.

- Given aucun joueur actif n'existe, When j'ouvre l'espace Joueurs, Then la liste est remplacée par un état vide explicite et le CTA "Ajouter un joueur" est mis en avant.
- Given tous les joueurs existants sont archivés, When j'ouvre l'espace Joueurs, Then l'état vide s'affiche également (aucun joueur actif à lister).

## 6. Flows principaux

**Consultation de la Collection.** Depuis la bottom bar, l'utilisateur ouvre la Collection. Il voit la liste des jeux triée alphabétiquement, chaque entrée portant le nom et le nombre de parties. Il tape un jeu pour ouvrir sa fiche, ou active "Ajouter un jeu".

**Consultation de l'espace Joueurs.** Identique, sur la liste des joueurs actifs ; chaque entrée porte le nom et le nombre de parties. Tap pour ouvrir la fiche joueur, ou "Ajouter un joueur".

**Création (jeu ou joueur).** Depuis la liste, l'utilisateur active le CTA, le formulaire correspondant s'ouvre (PRD Formulaires), il valide ; au retour sur la liste, la nouvelle entrée apparaît à sa place de tri.

## 7. Cas limites et états d'erreur

- **Collection vide** : état vide global (illustration et CTA dominant), aucune liste.
- **Espace Joueurs vide** : état vide ; survient sans aucun joueur, ou lorsque tous les joueurs sont archivés.
- **Jeu ou joueur sans aucune partie** : nombre de parties à 0, comportement nominal.
- **Joueur archivé** : jamais listé dans l'espace Joueurs ; il reste néanmoins comptabilisé dans les statistiques des jeux (hors de cet écran).
- **Doublons de nom interdits** parmi les joueurs actifs ; un nom identique à un joueur archivé reste possible mais l'archivé n'apparaît pas dans cette liste.
- **Noms à casse ou accents différents** ("Léa" / "Lea", "anna" / "Anna") : le tri les considère équivalents pour le classement (insensible casse et accents) ; en cas d'égalité de tri, la règle de départage 8.3 fixe l'ordre.
- **Nom commençant par un chiffre, un symbole ou un emoji** : trié selon l'ordre de comparaison de la locale française ; comportement déterministe, sans traitement spécial.
- **Liste longue** : liste verticale scrollable simple, sans pagination ni recherche en V1.

## 8. Règles de calcul (déterministes, calculées à la lecture)

Toutes les valeurs affichées sont recalculées à chaque affichage, jamais persistées.

### 8.1 Nombre de parties d'un jeu (entrée Collection)
1. Compter toutes les parties rattachées au jeu (identique à la règle fiche jeu 8.4).

### 8.2 Nombre de parties d'un joueur (entrée Joueurs)
1. Compter les parties distinctes auxquelles le joueur a une participation, tous types de jeu confondus (identique à la règle fiche joueur 8.1).

### 8.3 Tri des listes
1. Trier par nom en ordre alphabétique croissant, comparaison insensible à la casse et aux accents, selon la locale française (cohérent avec le classement par victoires de la fiche jeu, règle 8.2).
2. En cas d'égalité stricte de nom (normalement inatteignable : ni deux jeux ni deux joueurs actifs ne peuvent partager un nom), départager par ordre de création croissant (identité interne stable) comme garde-fou déterministe.

### 8.4 Composition d'une entrée
1. Collection : nom du jeu + nombre de parties (8.1).
2. Joueurs : nom du joueur + nombre de parties (8.2).

## 9. Séparation UI et logique

- **Logique fonctionnelle** : tri (8.3), exclusion des joueurs archivés, comptages (8.1, 8.2), conditions d'état vide, intégration du résultat de création. Indépendante du rendu.
- **Rendu visuel (indicatif, mobile-first)** : liste verticale d'entrées tappables, chaque entrée portant nom et nombre de parties ; cibles tactiles d'au moins 44 px ; CTA de création en bouton primaire visible (réutilise le pattern du CTA principal du produit, libellé "Ajouter un jeu" ou "Ajouter un joueur" selon l'écran) ; état vide avec illustration, libellé et CTA dominant. Le détail du style est laissé à la phase de design ; seules les contraintes d'accessibilité tactile et de hiérarchie sont normatives.

## 10. Contraintes techniques connues

- Mobile-first, cibles tactiles d'au moins 44 px, pas de formulaire multi-étapes.
- Mono-utilisateur, sans compte, fonctionnement hors-ligne, données locales à l'appareil.
- Compteurs (nombre de parties) calculés à la lecture sur l'ensemble de la liste, jamais stockés, pour préserver l'intégrité lors des éditions et suppressions.
- Modèle de données normalisé (jeux, joueurs, parties, participations) ; le statut actif/archivé est un attribut du joueur.
- Tri et départage déterministes (8.3) pour un ordre d'affichage stable.

## 11. Questions ouvertes

- [Acté] Unicité du nom de joueur parmi les actifs (patch corpus V1). Départage de tri par ordre de création maintenu comme garde-fou déterministe (normalement inatteignable).
- [Acté] Nombre de parties par entrée conservé pour les deux listes (Collection et Joueurs). Décision validée (patch corpus V2).
- [Design] Placement et persistance du CTA de création (bouton bas ancré vs en-tête) : à définir au design. Non bloquant.
- [Design] Illustrations et libellés des états vides des deux listes : à définir au design / UX copy. Non bloquant.
- [V2] Champ de recherche sur la Collection : hors scope V1, à réintroduire si le volume le justifie.
