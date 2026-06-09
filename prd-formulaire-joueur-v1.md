# PRD - Formulaire de joueur (Ludothèque personnelle, V1)

> Document spécifique à un seul écran : le **formulaire de création d'un joueur**. Il est auto-suffisant : un développeur qui ne connaît pas le contexte doit pouvoir le lire et comprendre exactement quoi construire pour cet écran. Il s'inscrit dans le périmètre du brief produit V1 (journal de parties personnel, mobile, hors-ligne, sans compte) et partage le vocabulaire contractuel des PRD fiche jeu, fiche joueur, fiche de partie et Listes.
>
> C'est un écran volontairement minimal : un seul champ (le nom), rendu indicatif via une bottom sheet. Il ne couvre que la **création** d'un joueur. Le renommage relève de la fiche joueur, la création à la volée pendant une saisie relève de la fiche de partie.

---

## 1. Vision de l'écran

Le formulaire de joueur sert uniquement à **créer un joueur depuis l'espace Joueurs**, pour l'avoir disponible comme participant lors des saisies de parties. C'est la dépendance référencée par l'espace Joueurs (CTA « Ajouter un joueur »). La création doit être immédiate et sans friction : un nom suffit.

Il existe trois surfaces touchant l'identité d'un joueur, à ne pas confondre : la **création standalone** (cet écran, persistée immédiatement), la **création à la volée** pendant la saisie d'une partie (fiche de partie, persistée seulement avec la partie), et le **renommage** d'un joueur existant (fiche joueur). Ce document ne traite que la première. Les trois surfaces appliquent la même règle d'unicité du nom parmi les joueurs actifs.

## 2. Problème et utilisateur

Utilisateur unique : le propriétaire de la collection, sur téléphone, en usage personnel. Données locales à l'appareil, pas de compte. Le problème résolu : ajouter une personne à la liste des joueurs actifs en une saisie minimale, sans surcharge ni étape inutile, tout en garantissant qu'on puisse distinguer sans ambiguïté les joueurs sélectionnables.

## 3. Définitions (vocabulaire contractuel)

Les définitions de Joueur, Joueur actif, Joueur archivé et Participation sont celles des PRD fiche joueur et Listes. Rappels et ajouts utiles à cet écran :

- **Joueur** : identité propre et stable. Le nom est un libellé d'affichage ; l'identité interne ne change pas au renommage.
- **Joueur actif** : joueur non archivé. Seuls les joueurs actifs figurent dans la liste Joueurs, dans l'autocomplete de saisie et ont une fiche consultable. Un joueur créé via ce formulaire est actif.
- **Unicité du nom (joueurs actifs)** : deux joueurs **actifs** ne peuvent pas porter le même nom. La comparaison est insensible à la casse et aux accents (voir règle 8.3). Un nom identique à celui d'un joueur **archivé** reste autorisé : l'unicité ne porte que sur l'espace actif.
- **Création standalone** : création d'un joueur depuis l'espace Joueurs via ce formulaire, persistée immédiatement et de façon atomique. À distinguer de la création à la volée de la fiche de partie, qui n'est persistée qu'avec l'enregistrement de la partie (règle fiche de partie 8.6).

## 4. Périmètre fonctionnel de l'écran

### 4.1 Dans le périmètre

- Ouverture du formulaire depuis le CTA « Ajouter un joueur » de l'espace Joueurs.
- Saisie du **nom** du joueur (champ unique, obligatoire).
- Validation explicite créant un joueur actif, persisté immédiatement, avec contrôle bloquant d'unicité parmi les joueurs actifs.
- Annulation sans création.

### 4.2 Hors périmètre de l'écran

- **Renommage** d'un joueur existant : relève de la fiche joueur (qui applique la même règle d'unicité).
- **Archivage** d'un joueur : relève de la fiche joueur.
- **Création à la volée** d'un joueur pendant la saisie d'une partie : relève de la fiche de partie (persistance différée, règle 8.6 de ce PRD).
- **Métadonnées de joueur** (avatar, couleur, surnom, etc.) : aucune en V1 ; le joueur n'a qu'un nom.
- **Statistiques et historiques** : relèvent des écrans de lecture (fiche joueur).

### 4.3 Points d'entrée et retours

- **Entrée** : depuis le CTA « Ajouter un joueur » de l'espace Joueurs.
- **Retour après validation** : retour à l'espace Joueurs, où le nouveau joueur (actif) apparaît à sa place de tri alphabétique (PRD Listes 8.3).
- **Retour sans validation (annulation)** : retour à l'espace Joueurs sans aucune écriture ; la liste est inchangée.

## 5. User stories et critères d'acceptation

Format : En tant que [rôle], je veux [action] afin de [bénéfice]. Critères en Given / When / Then.

### US1 - Créer un joueur
En tant que propriétaire, je veux créer un joueur en saisissant son nom, afin de l'avoir disponible pour mes saisies de parties.

- Given l'espace Joueurs ouvert, When j'active « Ajouter un joueur », Then le formulaire s'ouvre avec un unique champ nom vide.
- Given un nom non vide et non déjà porté par un joueur actif, When je valide, Then un joueur actif est créé et persisté immédiatement, et je reviens sur l'espace Joueurs où il apparaît à sa place alphabétique.
- Given un joueur fraîchement créé sans aucune partie, When il s'affiche dans la liste, Then son nombre de parties vaut 0 (comportement nominal, pas un état d'erreur).

### US2 - Validation bloquante (nom requis et unique)
En tant que propriétaire, je veux être empêché de créer un joueur sans nom ou portant le nom d'un joueur actif existant, afin de garder une liste de participants sans ambiguïté.

- Given un champ nom vide (ou ne contenant que des espaces), When je tente de valider, Then la création est bloquée et un message indique qu'un nom est requis.
- Given un nom identique à celui d'un joueur **actif** existant (comparaison insensible à la casse et aux accents, règle 8.3), When je tente de valider, Then la création est bloquée et un message indique que ce nom est déjà utilisé.
- Given un nom identique à celui d'un joueur **archivé** uniquement, When je valide, Then la création est autorisée (l'unicité ne porte que sur les joueurs actifs).

### US3 - Annuler la création
En tant que propriétaire, je veux pouvoir abandonner la création, afin de ne rien ajouter si je me ravise.

- Given le formulaire ouvert avec ou sans saisie, When je l'annule (fermeture de la bottom sheet), Then aucun joueur n'est créé, aucune confirmation de perte n'est demandée, et la liste de l'espace Joueurs est inchangée.

## 6. Flows principaux

**Création d'un joueur.** Depuis l'espace Joueurs, l'utilisateur active « Ajouter un joueur ». Le formulaire s'ouvre (bottom sheet indicative) avec un champ nom. Il saisit un nom, valide. Si le nom est non vide et non déjà porté par un joueur actif, un joueur actif est créé immédiatement et l'utilisateur revient sur l'espace Joueurs, où le joueur apparaît à sa place alphabétique. Si le nom est vide ou déjà utilisé par un joueur actif, la validation est bloquée avec le message correspondant.

**Annulation.** L'utilisateur ferme le formulaire sans valider. Aucun joueur n'est créé, sans confirmation.

## 7. Cas limites et états d'erreur

- **Nom vide ou composé uniquement d'espaces** : création bloquée (le nom est nettoyé de ses espaces de début et de fin avant contrôle).
- **Nom identique à un joueur actif existant**, y compris à la casse ou aux accents près : création bloquée, message « nom déjà utilisé ».
- **Nom identique à un joueur archivé uniquement** : création autorisée ; un nom actif et un nom archivé identiques peuvent coexister (l'archivé n'apparaît ni dans la liste active ni dans l'autocomplete).
- **Annulation après saisie** : aucun joueur créé ; aucune confirmation de perte (champ unique).
- **Joueur créé sans partie** : apparaît dans la liste avec 0 partie ; sa fiche affiche l'état vide (PRD fiche joueur US5).

## 8. Règles de validation et d'écriture (déterministes)

Aucune statistique n'est calculée par cet écran. Les règles s'appliquent au moment de la validation explicite.

### 8.1 Conditions de validité
1. Le nom est présent et non vide après suppression des espaces de début et de fin.
2. Le nom n'est porté par aucun joueur **actif** existant, selon la comparaison de la règle 8.3.

### 8.2 Écriture et atomicité
1. À la validation valide, la création du joueur est atomique et **immédiate** : le joueur est persisté à l'état actif, doté d'un nom d'affichage et d'une identité interne stable.
2. À la différence de la création à la volée de la fiche de partie (persistance différée à l'enregistrement de la partie, règle 8.6 de ce PRD), la création standalone ne dépend d'aucune autre écriture.
3. En cas d'annulation, aucun joueur n'est créé.

### 8.3 Comparaison d'unicité du nom
1. La comparaison de noms pour la détection de doublon est insensible à la casse et aux accents, selon la locale française (identique à la règle d'unicité du nom de jeu, formulaire de jeu 8.5, et cohérente avec les tris du PRD Listes 8.3).
2. La comparaison ne porte que sur les joueurs **actifs** ; les joueurs archivés en sont exclus.
3. Le nom est stocké et affiché tel que saisi (la casse et les accents saisis sont conservés) ; seule la comparaison est insensible.
4. Aucune limite de longueur n'est imposée au nom en V1.

## 9. Séparation UI et logique

- **Logique fonctionnelle** : conditions de validité (8.1), comparaison d'unicité (8.3), écriture atomique immédiate (8.2), intégration du résultat dans la liste triée. Indépendante du rendu.
- **Rendu visuel (indicatif, mobile-first)** : une bottom sheet légère (composant exact laissé au design : bottom sheet, modale ou champ inline selon ce qui sert le mieux le besoin), un unique champ nom, un bouton de validation primaire « Ajouter » et une action d'annulation. Message de validation explicite si le nom est vide ou déjà utilisé par un joueur actif. Cibles tactiles d'au moins 44 px. Le détail du style est laissé à la phase de design ; seules les contraintes d'accessibilité tactile et de hiérarchie sont normatives.

## 10. Contraintes techniques connues

- Mobile-first, cibles tactiles d'au moins 44 px, pas de formulaire multi-étapes.
- Mono-utilisateur, sans compte, fonctionnement hors-ligne, données locales à l'appareil.
- Modèle de données normalisé (jeux, joueurs, parties, participations) ; le statut actif/archivé est un attribut du joueur.
- Le joueur créé est actif, doté d'une identité interne stable et d'un nom d'affichage modifiable ultérieurement (renommage hors de cet écran).
- Création atomique et immédiate. Unicité du nom parmi les joueurs actifs, comparaison insensible à la casse et aux accents (locale française) ; le nom est conservé tel que saisi.
- Cet écran n'effectue aucun calcul de statistique ; les écrans de lecture recalculent à la lecture.

## 11. Décisions actées et points de cohérence corpus

Décisions actées propres à cet écran :

- **Création standalone uniquement** : renommage et archivage hors périmètre (fiche joueur), création à la volée hors périmètre (fiche de partie).
- **Champ unique (nom)**, aucune métadonnée de joueur en V1, aucune limite de longueur.
- **Unicité du nom parmi les joueurs actifs** : les homonymes entre joueurs actifs sont interdits ; un nom identique à un joueur archivé reste autorisé. Comparaison insensible casse/accents (règle 8.3).
- **Persistance immédiate et atomique**, par opposition à la persistance différée de la création à la volée (fiche de partie 8.6).
- **Annulation sans confirmation de perte** (champ unique).
- **Rendu indicatif en bottom sheet**, bouton « Ajouter », composant exact laissé au design.

Points de cohérence corpus : l'interdiction des homonymes a été propagée dans les PRD Listes (L-1, L-2, L-4, L-5), fiche de partie (FP-1 à FP-4), fiche joueur (FY-3, FY-4) et brief produit (B-7) via les patch corpus V1 et V2. Ces points sont traités.
