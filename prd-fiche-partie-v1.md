# PRD - Écran Fiche de partie (Ludothèque personnelle, V1)

> Document spécifique à un seul écran : la **fiche de partie**. Il est auto-suffisant : un développeur qui ne connaît pas le contexte doit pouvoir le lire et comprendre exactement quoi construire pour cet écran. Il s'inscrit dans le périmètre du brief produit V1 (journal de parties personnel, mobile, hors-ligne, sans compte) et partage le vocabulaire contractuel des PRD fiche jeu et fiche joueur.

---

## 1. Vision de l'écran

La fiche de partie est l'écran de saisie et de correction d'une session jouée. C'est la dépendance partagée référencée par la fiche jeu (ajout, édition, suppression d'une partie) et par la fiche joueur (ouverture d'une partie depuis l'historique pour la corriger). Le job est double et protégé : **consigner une partie sans friction juste après l'avoir jouée**, et **corriger une saisie après coup sans manipulation lourde**.

Décision structurante : c'est un **écran unique, toujours éditable**. Il n'y a pas d'état de lecture seule distinct. Ouvrir une partie existante, c'est l'ouvrir directement dans son formulaire pré-rempli. La consultation et l'édition sont le même état.

## 2. Problème et utilisateur

Utilisateur unique : le propriétaire de la collection, sur téléphone, en usage personnel. Données locales à l'appareil, pas de compte. Le contexte de saisie est le moment qui suit une soirée jeu : il faut pouvoir consigner participants, scores et résultat au pouce, vite, avant que le souvenir s'efface. Le contexte de correction intervient plus tard : retrouver une partie et rectifier une erreur de score, de gagnant ou de date.

## 3. Définitions (vocabulaire contractuel)

Les définitions de Jeu, Partie, Participation, Indicateur de victoire, Gagnant et Joueur archivé sont celles du PRD fiche jeu. Rappels et ajouts utiles à cet écran :

- **Partie** : une session jouée, rattachée à un jeu. Porte une date et une note libre. Sa nature (compétitive ou coopérative) découle du type du jeu et n'est jamais modifiable.
- **Participation** : lien entre une partie et un joueur. Porte un score (optionnel) et un indicateur de victoire (booléen), pertinents uniquement en compétitif.
- **Résultat collectif** : pour une partie coopérative, succès ou échec. Attribut de la partie, pas de la participation.
- **Mode création** : ouverture de l'écran pour une nouvelle partie, jeu déjà déterminé, date pré-remplie à aujourd'hui, aucun participant. Validation par le bouton « Enregistrer la partie ».
- **Mode édition** : ouverture de l'écran sur une partie existante, tous champs pré-remplis. Les modifications ne sont persistées qu'à la validation explicite.
- **Brouillon** : état non persisté de l'écran entre l'ouverture et la validation. Aucune donnée n'est écrite tant que la sauvegarde n'est pas confirmée et valide.
- **Horodatage de création** : instant d'enregistrement initial de la partie, persisté sur la partie, fixé une fois à la création et jamais modifié ensuite (y compris si la date jouée est éditée). Sert de critère de tri secondaire à date égale dans les historiques (fiche jeu et fiche joueur).
- **Création de joueur à la volée** : création d'un joueur actif depuis le sélecteur de participants de cet écran, par saisie d'un nom non encore connu. Le joueur créé est immédiatement disponible comme participant.

## 4. Périmètre fonctionnel de l'écran

### 4.1 Dans le périmètre

- Ouverture en mode création (depuis la fiche jeu) et en mode édition (depuis un historique fiche jeu ou fiche joueur).
- Saisie et modification de la date de la partie.
- Sélection des participants par autocomplete sur les joueurs actifs, et **création d'un joueur à la volée** (soumise au même contrôle d'unicité parmi les joueurs actifs que la création standalone).
- Retrait d'un participant de la partie.
- Compétitif : saisie d'un score numérique optionnel par participant, et désignation du ou des gagnants (ex-aequo autorisé).
- Coopératif : choix du résultat collectif (succès ou échec).
- Saisie d'une note libre (optionnelle).
- Validation explicite par bouton de sauvegarde, avec règles bloquantes (section 8).
- Suppression de la partie, avec confirmation explicite (mode édition uniquement).

### 4.2 Hors périmètre de l'écran

- Création de partie depuis un autre point d'entrée que la fiche jeu (pas de « + » global en V1). Le jeu est donc toujours connu à l'ouverture.
- Changement du jeu rattaché à une partie, ou changement de sa nature compétitive/coopérative (immuables).
- Renommage d'un joueur existant, archivage ou suppression d'un joueur : relèvent de l'espace Joueurs et de la fiche joueur.
- Parties en équipe (V2).
- Ex-aequo : il est **activé en V1** (plusieurs gagnants autorisés), conformément à l'évolution de périmètre actée dans le PRD fiche jeu.
- Calcul et affichage des statistiques (record, classement, taux de réussite) : relèvent des écrans de lecture (fiche jeu, fiche joueur), recalculés à la lecture après toute écriture ici.

### 4.3 Points d'entrée et retours

- **Entrée création** : depuis le CTA « Ajouter une partie » de la fiche jeu. Le jeu est passé en contexte ; date pré-remplie à aujourd'hui ; mode de saisie (compétitif/coopératif) dérivé du type du jeu.
- **Entrée édition** : depuis une ligne d'historique de la fiche jeu ou de la fiche joueur. La partie ciblée est passée en contexte.
- **Retour après validation ou suppression** : retour à l'écran appelant, dont l'historique et les statistiques sont recalculés à la lecture pour refléter l'écriture. Aucune statistique n'est calculée par cet écran.

## 5. User stories et critères d'acceptation

Format : En tant que [rôle], je veux [action] afin de [bénéfice]. Critères en Given / When / Then.

### US1 - Créer une partie compétitive
En tant que propriétaire, je veux saisir une partie pour un jeu compétitif, afin de consigner qui a joué, les scores et le ou les gagnants.

- Given une fiche jeu compétitif, When j'active « Ajouter une partie », Then l'écran s'ouvre en mode création : date du jour pré-remplie, aucun participant, mode compétitif (champs score et désignation de gagnant disponibles).
- Given le formulaire en cours de saisie, When j'ajoute des participants, saisis des scores optionnels et désigne au moins un gagnant, Then le bouton « Enregistrer la partie » permet de valider.
- Given une partie valide, When je l'enregistre, Then la partie et ses participations sont créées et je reviens sur la fiche jeu mise à jour.

### US2 - Créer une partie coopérative
En tant que propriétaire, je veux saisir une partie pour un jeu coopératif, afin de consigner qui a joué et le résultat collectif.

- Given une fiche jeu coopératif, When j'active « Ajouter une partie », Then l'écran s'ouvre en mode coopératif : ni champ score, ni désignation de gagnant, mais un choix de résultat collectif (succès ou échec).
- Given le formulaire coopératif, When j'ajoute des participants et choisis un résultat collectif, Then je peux enregistrer la partie.
- Given une partie coopérative valide, When je l'enregistre, Then la partie et ses participations sont créées et je reviens sur la fiche jeu mise à jour.

### US3 - Gérer les participants
En tant que propriétaire, je veux ajouter ou retirer des participants, afin de refléter exactement qui était présent.

- Given le sélecteur de participants, When je tape les premières lettres d'un nom, Then l'autocomplete propose les joueurs actifs dont le nom correspond.
- Given un nom saisi ne correspondant à aucun joueur actif, When je choisis de créer ce joueur, Then un joueur actif est créé avec ce nom et ajouté comme participant de la partie.
- Given un participant déjà ajouté, When je le retire, Then il n'est plus participant ; en compétitif, son score et son indicateur de victoire éventuels sont retirés avec lui.
- Given un même joueur déjà participant, When je tente de l'ajouter une seconde fois à la même partie, Then l'ajout est empêché (un joueur ne participe qu'une fois par partie).

### US4 - Désigner le ou les gagnants (compétitif)
En tant que propriétaire, je veux marquer un ou plusieurs gagnants, afin de gérer une victoire simple comme un ex-aequo.

- Given une partie compétitive avec des participants, When je marque un participant comme gagnant, Then son indicateur de victoire passe à vrai.
- Given plusieurs participants, When j'en marque plusieurs comme gagnants, Then chacun porte un indicateur de victoire à vrai (ex-aequo autorisé).
- Given l'indicateur de victoire, When je le modifie, Then il reste indépendant du score (un gagnant peut n'avoir aucun score, un non-gagnant peut avoir le meilleur score).

### US5 - Saisir les scores (compétitif, optionnel)
En tant que propriétaire, je veux saisir un score par participant quand c'est pertinent, afin d'alimenter le record sans y être contraint.

- Given une partie compétitive, When je laisse un ou plusieurs scores vides, Then la partie reste valide (le score est optionnel).
- Given un champ score, When je saisis une valeur, Then seules les valeurs numériques sont acceptées (voir règle 8.4).
- Given des scores renseignés pour une partie seulement, When j'enregistre, Then les scores sont conservés tels quels, sans interprétation du sens métier (le record s'évalue ailleurs, à la lecture).

### US6 - Éditer une partie existante
En tant que propriétaire, je veux ouvrir et modifier tous les champs d'une partie, afin de corriger une erreur de saisie.

- Given une ligne d'historique (fiche jeu ou fiche joueur), When je la tape, Then l'écran s'ouvre en mode édition avec tous les champs pré-remplis (date, participants, scores, gagnants ou résultat collectif, note).
- Given une partie en édition, When je modifie un ou plusieurs champs sans enregistrer, Then aucune donnée n'est persistée (modifications non écrites tant que la validation n'a pas eu lieu).
- Given une partie en édition, When j'enregistre des modifications valides, Then les modifications sont persistées et je reviens sur l'écran appelant recalculé.
- Given le type du jeu, When j'édite la partie, Then je ne peux changer ni le jeu rattaché ni la nature compétitive/coopérative de la partie.

### US7 - Supprimer une partie
En tant que propriétaire, je veux supprimer une partie, afin de retirer une saisie erronée.

- Given une partie en mode édition, When je demande sa suppression, Then une confirmation explicite est requise avant exécution.
- Given une suppression confirmée, When elle s'exécute, Then seule cette partie et ses participations sont supprimées, sans effet sur le jeu, les joueurs ni les autres parties, et je reviens sur l'écran appelant recalculé.
- Given une partie en mode création (pas encore enregistrée), When je quitte sans valider, Then aucune partie n'est créée et il n'y a rien à supprimer (l'action de suppression n'existe qu'en mode édition).

### US8 - Validation bloquante à l'enregistrement
En tant que propriétaire, je veux être empêché d'enregistrer une partie incohérente, afin de garantir l'intégrité des statistiques calculées ailleurs.

- Given une partie compétitive sans aucun gagnant marqué, When je tente d'enregistrer, Then l'enregistrement est bloqué et un message indique qu'au moins un gagnant est requis.
- Given une partie compétitive en édition, When je décoche le seul gagnant ou retire le participant qui était l'unique gagnant, et que je tente d'enregistrer, Then l'enregistrement est bloqué tant qu'aucun gagnant n'est marqué.
- Given une partie coopérative sans résultat collectif choisi, When je tente d'enregistrer, Then l'enregistrement est bloqué et un message indique qu'un résultat (succès ou échec) est requis.
- Given une partie sans aucun participant, When je tente d'enregistrer, Then l'enregistrement est bloqué et un message indique qu'au moins un participant est requis.
- Given une date absente ou invalide, When je tente d'enregistrer, Then l'enregistrement est bloqué et un message indique qu'une date valide est requise.

### US9 - Quitter sans enregistrer
En tant que propriétaire, je veux être protégé contre la perte involontaire d'une saisie, afin de ne pas perdre une partie ou une correction.

- Given un écran avec des modifications non enregistrées, When je tente de quitter (retour, fermeture), Then une confirmation de perte des modifications est demandée avant de quitter.
- Given un écran sans aucune modification depuis l'ouverture, When je quitte, Then aucune confirmation n'est demandée.

## 6. Flows principaux

**Création d'une partie compétitive.** Depuis la fiche jeu, l'utilisateur active « Ajouter une partie ». L'écran s'ouvre, date du jour pré-remplie. Il ajoute les participants en tapant les premières lettres (autocomplete) ou crée un joueur à la volée pour un absent de la liste. Il saisit éventuellement les scores, marque le ou les gagnants, ajoute une note si besoin, puis touche « Enregistrer la partie ». Si au moins un gagnant est marqué et qu'il y a au moins un participant, la partie est créée et il revient sur la fiche jeu recalculée. Sinon, la validation est bloquée avec le message correspondant.

**Création d'une partie coopérative.** Identique, mais sans score ni gagnant : l'utilisateur choisit le résultat collectif (succès ou échec), qui est obligatoire pour valider.

**Correction d'une partie.** Depuis l'historique de la fiche jeu ou de la fiche joueur, l'utilisateur tape une partie. L'écran s'ouvre pré-rempli. Il modifie un ou plusieurs champs. Tant qu'il n'enregistre pas, rien n'est écrit. Il valide ; les mêmes règles bloquantes s'appliquent ; au retour, l'écran appelant est recalculé.

**Suppression d'une partie.** En mode édition, l'utilisateur demande la suppression. Une confirmation explicite s'affiche. Après confirmation, la partie et ses participations sont supprimées et il revient sur l'écran appelant recalculé.

**Abandon d'une saisie ou d'une correction.** L'utilisateur quitte alors qu'il a des modifications non enregistrées : une confirmation de perte des modifications est demandée. S'il confirme, rien n'est écrit.

## 7. Cas limites et états d'erreur

- **Jeu coopératif** : aucun champ score ni désignation de gagnant n'est rendu ; seul le résultat collectif est demandé, et il est obligatoire.
- **Aucun participant** : enregistrement bloqué (au moins un participant requis).
- **Compétitif sans aucun gagnant** : enregistrement bloqué.
- **Compétitif, retrait ou décochage du dernier gagnant en édition** : enregistrement bloqué tant qu'aucun gagnant n'est marqué.
- **Scores partiels** : un score peut être renseigné pour certains participants seulement ; les champs vides sont conservés vides, la partie reste valide.
- **Gagnant sans score** et **non-gagnant avec le meilleur score** : tous deux autorisés (victoire indépendante du score).
- **Joueur archivé déjà participant d'une partie éditée** : il reste affiché comme participant, par son nom, sans lien ; son score et son indicateur de victoire restent éditables ; s'il est retiré, il ne peut pas être rajouté (absent de l'autocomplete des joueurs actifs).
- **Création à la volée d'un nom identique à un joueur actif existant** : l'autocomplete fait remonter le joueur existant, qui est sélectionné à la place ; la création d'un second joueur actif portant ce nom est empêchée (unicité parmi les actifs). Un nom identique à un joueur archivé uniquement peut être créé comme nouveau joueur actif.
- **Doublon de participant dans la même partie** : empêché (un joueur ne participe qu'une fois par partie).
- **Date pré-remplie modifiée** : la date est libre, y compris une date future ; aucun blocage sur les dates postérieures à aujourd'hui. Le pré-remplissage à aujourd'hui n'est qu'un défaut.
- **Modifications non enregistrées à la sortie** : confirmation de perte demandée.
- **Note vide** : la note est optionnelle, son absence n'a aucun effet.

## 8. Règles de validation et d'écriture (déterministes)

Aucune statistique n'est calculée par cet écran ; il ne fait qu'écrire des données cohérentes que les écrans de lecture recalculeront. Toutes les règles ci-dessous s'appliquent **au moment de la validation explicite** (bouton de sauvegarde), jamais au fil de la frappe pour le blocage.

### 8.1 Conditions de validité communes (compétitif et coopératif)
1. Au moins un participant.
2. Une date présente et valide.

### 8.2 Conditions de validité compétitives (en plus de 8.1)
1. Au moins une participation avec indicateur de victoire à vrai (au moins un gagnant).
2. Les scores sont optionnels ; tout champ score renseigné doit être numérique valide (voir 8.4).

### 8.3 Conditions de validité coopératives (en plus de 8.1)
1. Un résultat collectif est choisi : succès ou échec. L'absence de choix bloque la validation.
2. Aucun score ni indicateur de victoire n'est saisi ni stocké pour une partie coopérative.

### 8.4 Format du score (compétitif)
1. Le score est un entier. Le signe négatif est autorisé (certains jeux ont des scores négatifs).
2. Un champ score vide est un score non renseigné (distinct d'un zéro saisi).
3. Les décimales ne sont pas autorisées : le score est un entier en V1.

### 8.5 Écriture et atomicité
1. À la validation valide, l'écriture de la partie et de toutes ses participations est atomique : soit l'ensemble est persisté, soit rien ne l'est.
2. En mode édition, aucune écriture intermédiaire n'a lieu avant la validation ; les modifications vivent en brouillon non persisté.
3. La suppression d'une partie supprime la partie et toutes ses participations de façon atomique, sans toucher au jeu, aux joueurs, ni aux autres parties.

### 8.6 Création de joueur à la volée
1. Un joueur créé à la volée est un joueur **actif**, doté d'un nom d'affichage et d'une identité interne stable.
2. Le nom d'un joueur créé à la volée doit être unique parmi les joueurs actifs (comparaison insensible à la casse et aux accents, identique à la règle du formulaire de joueur). Un nom déjà porté par un joueur actif n'est pas créé : le joueur existant est sélectionné à la place.
3. Le joueur n'est persisté qu'au sein de l'écriture atomique de la partie (cohérent avec 8.5.2) : tant que la partie n'est pas enregistrée, le joueur créé en brouillon n'existe pas dans l'espace Joueurs. En cas d'abandon de la saisie, aucun joueur n'est créé.

### 8.7 Horodatage de création (donnée pour le tri secondaire)
1. À la création d'une partie, un horodatage de création est persisté sur la partie.
2. Cet horodatage est immuable : l'édition de la partie, y compris la modification de la date jouée, ne le change jamais.
3. Il constitue le critère de départage déterministe à date jouée égale dans les historiques : à date égale, la partie créée le plus récemment est classée en premier (horodatage de création décroissant). Cette règle est commune aux historiques de la fiche jeu et de la fiche joueur ; cet écran n'effectue pas le tri mais en fournit la donnée.

## 9. Séparation UI et logique

- **Logique fonctionnelle** : structure et règles ci-dessus (validations section 8, comportements section 7, écritures atomiques). Indépendante du rendu.
- **Rendu visuel (indicatif, mobile-first)** : un seul écran-formulaire, champ date en tête, sélecteur de participants avec autocomplete et action de création à la volée, liste des participants avec, en compétitif, un champ score par ligne et un contrôle de désignation de gagnant supportant la sélection multiple ; en coopératif, un contrôle binaire de résultat collectif à la place. Champ note libre. Bouton de sauvegarde primaire (« Enregistrer la partie » en création) clairement visible et atteignable au pouce. En mode édition, action de suppression accessible avec confirmation explicite. Messages de validation explicites au blocage. Cibles tactiles d'au moins 44 px. Le détail du style est laissé à la phase de design ; seules les contraintes d'accessibilité tactile et de hiérarchie sont normatives. La distinction de tout état (gagnant, résultat) ne doit jamais reposer sur la couleur seule.

## 10. Contraintes techniques connues

- Mobile-first, cibles tactiles d'au moins 44 px, pas de formulaire multi-étapes.
- Mono-utilisateur, sans compte, fonctionnement hors-ligne, données locales à l'appareil.
- Modèle de données normalisé (jeux, joueurs, parties, participations), la victoire étant un attribut booléen de la participation, supportant nativement plusieurs gagnants.
- La nature d'une partie (compétitive/coopérative) et son jeu de rattachement sont immuables après création.
- Sauvegarde explicite : aucune persistance avant validation ; écritures et suppression atomiques.
- Chaque partie persiste un horodatage de création immuable, distinct de la date jouée (modifiable), nécessaire au tri secondaire déterministe des historiques.
- Cet écran n'effectue aucun calcul de statistique ; les écrans de lecture recalculent à la lecture après toute écriture.

## 11. Décisions actées et points de cohérence corpus

Toutes les questions ouvertes propres à cet écran sont tranchées :

- **Tri secondaire à date égale** : horodatage de création de la partie, décroissant (règle 8.7). À répercuter dans les PRD fiche jeu et fiche joueur, qui la signalaient comme question ouverte transverse : la règle est désormais figée pour les deux historiques.
- **Persistance du joueur créé à la volée** : uniquement à l'enregistrement de la partie (règle 8.6). Pas de persistance immédiate ; abandon de saisie = aucun joueur créé.
- **Unicité du nom parmi les joueurs actifs** : un nom déjà porté par un joueur actif n'est jamais dupliqué (le joueur existant est sélectionné) ; un nom de joueur archivé peut être réutilisé pour créer un nouveau joueur actif.
- **Dates futures** : autorisées, aucun blocage.
- **Nombre minimal de participants** : aucun minimum spécifique au compétitif ; la seule contrainte est « au moins un participant » (règle 8.1), ce qui autorise les jeux solo (un seul participant, qui peut être l'unique gagnant).
- **Format du score** : entier uniquement, signe négatif autorisé (règle 8.4).

