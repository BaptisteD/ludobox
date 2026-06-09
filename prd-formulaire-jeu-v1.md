# PRD - Formulaire de jeu (Ludothèque personnelle, V1)

> Document spécifique à un seul écran : le **formulaire de jeu** (création et édition). Il est auto-suffisant : un développeur qui ne connaît pas le contexte doit pouvoir le lire et comprendre exactement quoi construire pour cet écran. Il s'inscrit dans le périmètre du brief produit V1 (journal de parties personnel, mobile, hors-ligne, sans compte) et partage le vocabulaire contractuel des PRD fiche jeu, fiche de partie et Listes.
>
> Décision structurante : c'est un **écran unique, toujours éditable**, partagé entre la création et l'édition d'un jeu, sur le même modèle que la fiche de partie. Il n'y a pas d'état de lecture seule. Ouvrir un jeu en édition, c'est l'ouvrir directement dans son formulaire pré-rempli.

---

## 1. Vision de l'écran

Le formulaire de jeu est l'écran de saisie et de correction des informations d'un jeu. C'est la dépendance référencée par la Collection (CTA « Ajouter un jeu ») et par la fiche jeu (action « Modifier le jeu » du menu d'overflow). Le jeu n'est pas un objet de catalogue mais un **conteneur de parties** : ce formulaire ne sert qu'à déclarer ou corriger l'enveloppe d'un jeu (son nom, son type, ses métadonnées de cadrage), pas à consigner des parties ni à lire des statistiques.

Le job est double et protégé : **créer un jeu rapidement** pour l'avoir disponible comme conteneur de parties, et **corriger après coup** une information sans manipulation lourde. La saisie d'un jeu est plus rare que celle d'une partie, mais le type étant structurant et immuable dès qu'une partie existe, la création demande un choix délibéré.

## 2. Problème et utilisateur

Utilisateur unique : le propriétaire de la collection, sur téléphone, en usage personnel. Données locales à l'appareil, pas de compte. Le problème résolu : ajouter un jeu à la ludothèque sans friction, et pouvoir rectifier plus tard une faute de frappe, une métadonnée ou (tant qu'aucune partie n'existe) le type, sans risquer d'incohérence.

## 3. Définitions (vocabulaire contractuel)

Les définitions de Jeu, Type, Partie et Participation sont celles du PRD fiche jeu. Rappels et ajouts utiles à cet écran :

- **Jeu** : entité conteneur. Porte un nom, un type figé une fois qu'une partie existe, et des métadonnées optionnelles.
- **Type** : *compétitif* ou *coopératif*. Obligatoire. Détermine la sémantique des parties (scores et gagnants en compétitif, résultat collectif en coopératif). Immuable dès qu'au moins une partie est rattachée au jeu.
- **Nom de jeu** : libellé d'affichage du jeu. Obligatoire et **unique** dans la collection (voir règle 8.1 et la comparaison de la règle 8.5).
- **Métadonnées optionnelles** : nombre de joueurs minimum, nombre de joueurs maximum, durée. Toutes facultatives. La durée est exprimée en minutes entières.
- **Mode création** : ouverture de l'écran pour un nouveau jeu, aucun jeu en contexte, champs vides, type non pré-sélectionné. Validation par le bouton « Créer le jeu ».
- **Mode édition** : ouverture de l'écran sur un jeu existant, tous champs pré-remplis. Les modifications ne sont persistées qu'à la validation explicite. Validation par le bouton « Enregistrer ».
- **Brouillon** : état non persisté de l'écran entre l'ouverture et la validation. Aucune donnée n'est écrite tant que la sauvegarde n'est pas confirmée et valide.
- **En-tête / placeholder** : en V1, aucun upload d'image n'est proposé. L'en-tête visuel du jeu (sur la fiche jeu) est toujours un placeholder (fond coloré + initiale du jeu). Ce formulaire ne porte donc aucun champ d'image (voir 4.2 et 11).

## 4. Périmètre fonctionnel de l'écran

### 4.1 Dans le périmètre

- Ouverture en **mode création** (depuis le CTA « Ajouter un jeu » de la Collection) et en **mode édition** (depuis l'action « Modifier le jeu » de la fiche jeu).
- Saisie et modification du **nom** du jeu (obligatoire, unique).
- Choix du **type** (compétitif ou coopératif) en création ; modification du type en édition uniquement si le jeu n'a aucune partie ; type verrouillé dès qu'une partie existe.
- Saisie et modification des **métadonnées optionnelles** : nombre de joueurs min, nombre de joueurs max, durée en minutes.
- Validation explicite par bouton de sauvegarde, avec règles bloquantes (section 8).
- Garde-fou contre la perte de modifications non enregistrées à la sortie.

### 4.2 Hors périmètre de l'écran

- **Upload et gestion d'une image de couverture** : reporté en V2. En V1, l'en-tête du jeu reste un placeholder ; ce formulaire ne propose aucun champ d'image (voir 4.4 et 11).
- **Suppression du jeu** : reste portée par la fiche jeu (menu d'overflow, bottom sheet destructive, déjà spécifiée dans le PRD fiche jeu). Ce formulaire, atteint via « Modifier le jeu », ne réhéberge pas la suppression.
- **Saisie d'une partie** : relève de la fiche de partie. Le formulaire de jeu ne crée jamais de partie.
- **Création, renommage ou archivage d'un joueur** : relèvent de l'espace Joueurs, du formulaire de joueur et de la fiche joueur.
- **Calcul et affichage des statistiques** (nombre de parties, record, classement, taux de réussite) : relèvent des écrans de lecture, recalculés à la lecture après toute écriture ici.

### 4.3 Points d'entrée et retours

- **Entrée création** : depuis le CTA « Ajouter un jeu » de la Collection. Aucun jeu en contexte ; champs vides ; type non sélectionné. Validation par « Créer le jeu ».
- **Entrée édition** : depuis l'action « Modifier le jeu » du menu d'overflow de la fiche jeu. Le jeu ciblé est passé en contexte ; tous les champs pré-remplis. Validation par « Enregistrer ».
- **Retour après validation (création)** : retour à la **Collection**, où le nouveau jeu apparaît à sa place de tri alphabétique (cohérent avec le PRD Listes, COL-US2). Voir question ouverte en section 11 sur une alternative (ouverture directe de la fiche du jeu créé).
- **Retour après validation (édition)** : retour à la **fiche jeu**, dont l'en-tête et les statistiques sont recalculés à la lecture pour refléter la modification.
- **Retour sans validation (abandon)** : retour à l'écran appelant sans aucune écriture (voir US5 et 8.4).

### 4.4 Évolution de périmètre actée vs brief V1

Deux écarts assumés par rapport au brief produit V1, à répercuter dans le corpus (voir section 11) :

1. **L'upload d'image de couverture est reporté en V2.** Le brief V1 (section 4.1) décrivait un upload optionnel, un placeholder de repli, et une image modifiable et supprimable. En V1, seul le placeholder existe ; aucun champ d'image n'est présent dans ce formulaire. Impacts à répercuter : brief produit (4.1, 8, 9) et PRD fiche jeu (en-tête 4.1, US7, cas limite « image absente » en 7, contrainte technique de redimensionnement/compression en 10).
2. **Le nom de jeu est unique.** Le brief V1 ne posait pas de contrainte d'unicité sur les jeux. Cette règle est désormais actée et portée par ce formulaire. Impact à répercuter : PRD Listes (règle 8.3, point 2), où la clause de départage « jeux de même nom le cas échéant » devient sans objet (les homonymes ne subsistent que pour les joueurs).

## 5. User stories et critères d'acceptation

Format : En tant que [rôle], je veux [action] afin de [bénéfice]. Critères en Given / When / Then.

### US1 - Créer un jeu
En tant que propriétaire, je veux créer un jeu en renseignant son nom et son type, afin de l'avoir disponible comme conteneur de parties.

- Given la Collection ouverte, When j'active « Ajouter un jeu », Then le formulaire s'ouvre en mode création : champs vides, type non pré-sélectionné, aucun champ d'image.
- Given le formulaire en création, When j'ai renseigné un nom non vide et unique et choisi un type, Then le bouton « Créer le jeu » permet de valider.
- Given un jeu valide, When je le crée, Then le jeu est persisté et je reviens sur la Collection, où il apparaît à sa place alphabétique.
- Given des métadonnées optionnelles laissées vides, When je crée le jeu, Then le jeu est créé sans ces métadonnées (comportement nominal, pas un état d'erreur).

### US2 - Éditer un jeu existant
En tant que propriétaire, je veux modifier les informations d'un jeu, afin de corriger ou compléter sa fiche.

- Given une fiche jeu, When j'ouvre « Modifier le jeu » dans le menu d'overflow, Then le formulaire s'ouvre en mode édition avec tous les champs pré-remplis (nom, type, métadonnées).
- Given un jeu en édition, When je modifie un ou plusieurs champs sans enregistrer, Then aucune donnée n'est persistée tant que la validation n'a pas eu lieu.
- Given des modifications valides, When j'enregistre, Then elles sont persistées et je reviens sur la fiche jeu recalculée à la lecture.
- Given un nom inchangé identique à celui du jeu en cours d'édition, When j'enregistre, Then le contrôle d'unicité n'est pas déclenché contre le jeu lui-même et l'enregistrement est autorisé.

### US3 - Verrou du type selon l'existence de parties
En tant que propriétaire, je veux que le type soit modifiable tant qu'aucune partie n'existe et figé ensuite, afin de préserver la cohérence des parties et des statistiques.

- Given un jeu n'ayant aucune partie, When je l'édite, Then le type (compétitif ou coopératif) est modifiable.
- Given un jeu ayant au moins une partie, When je l'édite, Then le type est affiché mais non modifiable (verrouillé), sans jamais reposer sur la couleur seule pour signaler le verrou.
- Given le formulaire en création, When je n'ai choisi aucun type, Then la validation est bloquée et un message indique qu'un type est requis.

### US4 - Validation bloquante à l'enregistrement
En tant que propriétaire, je veux être empêché d'enregistrer un jeu incohérent, afin de garantir l'unicité et l'intégrité de la collection.

- Given un nom vide, When je tente de valider, Then l'enregistrement est bloqué et un message indique qu'un nom est requis.
- Given un nom identique à celui d'un autre jeu existant (comparaison insensible à la casse et aux accents, règle 8.5), When je tente de valider, Then l'enregistrement est bloqué et un message indique que ce nom est déjà utilisé.
- Given un nombre de joueurs minimum supérieur au maximum (les deux renseignés), When je tente de valider, Then l'enregistrement est bloqué et un message indique que le minimum ne peut pas dépasser le maximum.
- Given un seul des deux champs min ou max renseigné, When je valide, Then l'enregistrement est autorisé (l'autre borne reste vide).
- Given une durée renseignée non entière, nulle ou négative, When je tente de valider, Then la valeur est refusée (saisie restreinte ou message bloquant) ; un champ durée laissé vide reste valide.

### US5 - Quitter sans enregistrer
En tant que propriétaire, je veux être protégé contre la perte involontaire d'une saisie, afin de ne pas perdre la création ou la correction d'un jeu.

- Given un écran avec des modifications non enregistrées, When je tente de quitter (retour, fermeture), Then une confirmation de perte des modifications est demandée avant de quitter.
- Given un écran sans aucune modification depuis l'ouverture, When je quitte, Then aucune confirmation n'est demandée et rien n'est écrit.

## 6. Flows principaux

**Création d'un jeu.** Depuis la Collection, l'utilisateur active « Ajouter un jeu ». Le formulaire s'ouvre vide, sans type pré-sélectionné. Il saisit un nom, choisit un type, renseigne éventuellement le nombre de joueurs min/max et la durée, puis touche « Créer le jeu ». Si le nom est non vide et unique et qu'un type est choisi, le jeu est créé et l'utilisateur revient sur la Collection où le jeu apparaît à sa place alphabétique. Sinon, la validation est bloquée avec le message correspondant.

**Édition d'un jeu.** Depuis la fiche jeu, l'utilisateur ouvre « Modifier le jeu ». Le formulaire s'ouvre pré-rempli. Il modifie un ou plusieurs champs. Tant qu'il n'enregistre pas, rien n'est écrit. Si le jeu a déjà des parties, le type est verrouillé ; sinon il reste modifiable. Il valide ; les mêmes règles bloquantes s'appliquent ; au retour, la fiche jeu est recalculée.

**Tentative de sauvegarde invalide.** À la validation, si une règle bloquante n'est pas satisfaite (nom vide, nom déjà utilisé, min supérieur au max, type absent en création, durée invalide), l'écriture n'a pas lieu et un message explicite indique la règle non satisfaite. L'utilisateur corrige et revalide.

**Abandon d'une saisie ou d'une correction.** L'utilisateur quitte alors qu'il a des modifications non enregistrées : une confirmation de perte des modifications est demandée. S'il confirme, rien n'est écrit et il revient à l'écran appelant.

## 7. Cas limites et états d'erreur

- **Nom vide** : enregistrement bloqué (nom requis).
- **Nom dupliquant un jeu existant** : enregistrement bloqué, message « nom déjà utilisé ». La comparaison est insensible à la casse et aux accents (règle 8.5), si bien que « Catane », « catane » et « CATANE » sont considérés comme le même nom.
- **Nom inchangé en édition** : l'unicité exclut le jeu en cours d'édition ; ré-enregistrer un jeu sans changer son nom n'est jamais bloqué.
- **Type non choisi en création** : enregistrement bloqué (type requis).
- **Type d'un jeu avec parties** : verrouillé en édition, non modifiable.
- **Type d'un jeu sans partie** : modifiable en édition, sans effet de bord (aucune partie dépendante).
- **min supérieur au max** (les deux renseignés) : enregistrement bloqué.
- **min ou max seul** : autorisé (l'autre borne reste vide).
- **Durée non entière, nulle ou négative** : refusée (la durée est un entier strictement positif de minutes).
- **Métadonnées toutes vides** : autorisé, le jeu est créé ou enregistré sans métadonnées.
- **En-tête sans image** : en V1, l'en-tête est toujours un placeholder ; aucun champ ni action d'image n'est présent dans ce formulaire.
- **Modifications non enregistrées à la sortie** : confirmation de perte demandée.
- **Création annulée** : aucun jeu créé ; au retour sur la Collection, la liste est inchangée (cohérent Listes COL-US2).

## 8. Règles de validation et d'écriture (déterministes)

Aucune statistique n'est calculée par cet écran ; il ne fait qu'écrire des données cohérentes que les écrans de lecture recalculeront. Toutes les règles ci-dessous s'appliquent **au moment de la validation explicite** (bouton de sauvegarde), jamais au fil de la frappe pour le blocage (à l'exception de la restriction de saisie des champs numériques, qui peut s'appliquer en continu).

### 8.1 Conditions de validité communes (création et édition)
1. Le nom est présent et non vide (après suppression des espaces de début et de fin).
2. Le nom est unique dans la collection selon la comparaison de la règle 8.5 ; en édition, la comparaison exclut le jeu en cours d'édition.
3. Un type est sélectionné : compétitif ou coopératif.

### 8.2 Métadonnées optionnelles
1. Nombre de joueurs min et max : entiers positifs, optionnels et indépendants.
2. Si min et max sont tous deux renseignés, alors min doit être inférieur ou égal à max ; sinon la validation est bloquée.
3. Renseigner une seule des deux bornes est autorisé.
4. Durée : entier strictement positif, en minutes, optionnel. Une durée vide est une durée non renseignée.

### 8.3 Immutabilité du type
1. En création, le type est librement choisi (et obligatoire, règle 8.1.3).
2. En édition, le type est modifiable si et seulement si le jeu n'a aucune partie rattachée.
3. Dès qu'au moins une partie existe, le type est verrouillé et ne peut plus être modifié.

### 8.4 Écriture et atomicité
1. À la validation valide, l'écriture du jeu (création ou mise à jour) est atomique : soit l'ensemble des champs est persisté, soit rien ne l'est.
2. En mode édition, aucune écriture intermédiaire n'a lieu avant la validation ; les modifications vivent en brouillon non persisté.
3. En cas d'abandon (sortie sans validation), aucune donnée n'est écrite.

### 8.5 Comparaison d'unicité du nom
1. La comparaison de noms pour la détection de doublon est insensible à la casse et aux accents, selon la locale française (cohérent avec les tris du PRD Listes 8.3 et le classement de la fiche jeu 8.2).
2. Deux noms équivalents par cette comparaison constituent un doublon et sont refusés.
3. Le nom est néanmoins stocké et affiché tel que saisi (la casse et les accents saisis sont conservés) ; seule la comparaison est insensible.

## 9. Séparation UI et logique

- **Logique fonctionnelle** : structure et règles ci-dessus (validations section 8, comportements section 7, écritures atomiques). Indépendante du rendu.
- **Rendu visuel (indicatif, mobile-first)** : un seul écran-formulaire. Champ nom en tête. Sélecteur de type à deux options (compétitif / coopératif) ; en édition d'un jeu ayant des parties, le type est rendu verrouillé, avec une indication non basée sur la couleur seule (libellé, icône ou état désactivé explicite). Champs de métadonnées optionnels (joueurs min, joueurs max, durée), avec saisie numérique restreinte. Aucun champ ni action d'image en V1. Bouton de sauvegarde primaire clairement visible et atteignable au pouce : « Créer le jeu » en création, « Enregistrer » en édition. Messages de validation explicites au blocage. Cibles tactiles d'au moins 44 px. Le détail du style est laissé à la phase de design ; seules les contraintes d'accessibilité tactile et de hiérarchie sont normatives.

## 10. Contraintes techniques connues

- Mobile-first, cibles tactiles d'au moins 44 px, pas de formulaire multi-étapes.
- Mono-utilisateur, sans compte, fonctionnement hors-ligne, données locales à l'appareil.
- Écran unique toujours éditable, partagé création/édition ; sauvegarde explicite ; brouillon non persisté ; écriture atomique du jeu.
- Le type d'un jeu est immuable dès qu'au moins une partie existe.
- Le nom de jeu est unique, comparaison insensible à la casse et aux accents (locale française) ; le nom est conservé tel que saisi.
- Modèle de données normalisé (jeux, joueurs, parties, participations).
- Aucun upload d'image en V1 : l'en-tête du jeu est un placeholder ; l'image de couverture est réintroduite en V2.
- Cet écran n'effectue aucun calcul de statistique ; les écrans de lecture recalculent à la lecture après toute écriture.

## 11. Décisions actées et points de cohérence corpus

Décisions actées propres à cet écran :

- **Écran unique toujours éditable**, partagé création/édition (modèle fiche de partie). Pas d'état de lecture seule.
- **Sauvegarde explicite** avec brouillon non persisté et garde-fou de sortie, calqués sur la fiche de partie.
- **Suppression du jeu** non réhébergée ici : elle reste sur la fiche jeu.
- **Retour après création** vers la Collection (cohérent Listes COL-US2).
- **Durée** en entier de minutes ; **nom unique** avec comparaison insensible casse/accents.

Points de cohérence corpus à répercuter (non bloquants pour l'implémentation de cet écran) :

- **Image reportée en V2** : mettre à jour le brief produit (4.1, 8, 9) et le PRD fiche jeu (4.1, US7, cas limite « image absente » en 7, contrainte technique en 10) pour retirer l'upload d'image de la V1 et acter l'en-tête placeholder seul.
- **Unicité du nom de jeu** : mettre à jour le PRD Listes (8.3, point 2) pour retirer le cas « jeux de même nom » du départage de tri (les homonymes ne subsistent que pour les joueurs).

Questions ouvertes (non bloquantes) :

- [Produit / UX] Retour après création : défaut retenu = retour à la Collection. Alternative envisageable = ouvrir directement la fiche du jeu créé pour enchaîner sur l'ajout d'une première partie (cohérent avec la boucle de saisie). À trancher au design.
- [Design] Pré-sélection du type en création : défaut retenu = aucune pré-sélection, choix requis. Alternative = pré-sélectionner compétitif. Non bloquant.
- [Design / UX copy] Libellés des champs durée et joueurs min/max, et message exact de blocage d'unicité. Non bloquant.
- [Design] Restitution du verrou du type en édition (champ désactivé, libellé explicatif, icône cadenas). Non bloquant.
