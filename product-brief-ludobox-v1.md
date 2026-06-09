# Product Brief — Ludothèque personnelle (V1)

## 1. Contexte et problème

Les parties de jeux de société jouées au fil du temps ne laissent aucune trace exploitable : pas d'historique consolidé, pas de mémoire des scores, aucune réponse simple aux questions naturelles d'un joueur régulier ("qui gagne le plus sur ce jeu", "quel est le record", "combien de fois l'a-t-on sorti"). Les applications existantes du marché couvrent ce besoin mais au prix d'une richesse fonctionnelle élevée, souvent d'un compte utilisateur et d'une prise en main qui crée de la friction au moment précis où il faudrait saisir vite, après une soirée jeu.

Le besoin adressé par cette V1 est volontairement resserré : un outil personnel, mobile, sans compte, qui consigne les parties sans friction et restitue des statistiques utiles par jeu et par joueur.

## 2. Utilisateur cible et cas d'usage

Utilisateur unique, le propriétaire de la collection. Usage personnel, principalement sur téléphone. En V1 les données sont locales à l'appareil (mono-appareil).

Cas d'usage principaux, par ordre de fréquence attendue :

1. Consigner une partie juste après l'avoir jouée : ouvrir l'app, choisir le jeu, saisir rapidement participants, scores et gagnant (ou succès/échec en coopératif).
2. Consulter les statistiques d'un jeu : record, classement des joueurs, historique des parties.
3. Consulter le parcours d'un joueur : ses parties, ses scores, ses victoires.
4. Gérer la collection : ajouter un jeu, le corriger, le supprimer.

## 3. Proposition de valeur et objectifs de la V1

Valeur centrale : une mémoire fiable et sans friction des parties jouées, et des statistiques qui répondent immédiatement aux questions du joueur régulier.

Cadrage important : en retirant l'intégration BoardGameGeek de la V1, le produit n'est plus un catalogue de collection mais un journal de parties. La collection devient une liste de jeux saisis à la main, qui servent avant tout de conteneurs pour les parties. C'est ce prisme (logger et restituer, plutôt que cataloguer) qui priorise l'ensemble du périmètre.

Objectifs de la V1 :

- Permettre une saisie de partie rapide et confortable au pouce, sans formulaire multi-étapes.
- Restituer par jeu : nombre de parties, record, classement des joueurs par victoires, historique.
- Restituer par joueur : ses parties et leurs résultats.
- Fonctionner hors-ligne, sans aucune création de compte.

Critère de succès (usage personnel) : l'app est utilisée à chaque soirée jeu parce que la saisie n'est pas une corvée, et les statistiques donnent envie d'y revenir.

## 4. Périmètre fonctionnel détaillé (V1)

### 4.1 Collection

- Liste des jeux sous forme de vignettes (placeholder + nom).
- Ajout manuel d'un jeu. Champs obligatoires : nom (unique dans la collection, comparaison insensible à la casse et aux accents), type (compétitif ou coopératif). Champs optionnels : nombre de joueurs min/max, durée. En-tête visuel : placeholder (fond coloré + initiale du jeu) ; image de couverture reportée en V2.
- Édition d'un jeu (nom, métadonnées). Le type est modifiable tant qu'aucune partie n'existe ; il devient immuable dès la première partie enregistrée.
- Suppression d'un jeu avec confirmation explicite. La suppression entraîne la suppression en cascade de toutes les parties associées.

### 4.2 Saisie de partie

- Accessible depuis la fiche du jeu.
- Date pré-remplie à aujourd'hui, modifiable.
- Participants : sélection de joueurs existants via autocomplete, ou création d'un nouveau joueur à la volée.
- Selon le type du jeu :
  - Compétitif : score numérique par participant (optionnel, entier, signe négatif autorisé ; champ vide = score non renseigné) et désignation du ou des gagnants (ex-aequo activé en V1, la victoire est déclarée manuellement indépendamment du score). Au moins un gagnant est obligatoire. Les parties solo (un seul participant, pouvant être l'unique gagnant) sont autorisées.
  - Coopératif : résultat collectif unique, succès ou échec.
- Champ texte libre pour des notes.
- Suppression d'une partie individuellement, avec confirmation.

### 4.3 Fiche jeu

- Métadonnées du jeu saisies manuellement.
- Bouton d'ajout d'une partie.
- Section statistiques, calculées à la lecture (jamais stockées) :
  - Jeu compétitif : nombre de parties, record (valeur du high score + nom du joueur), classement des joueurs par nombre de victoires sur ce jeu.
  - Jeu coopératif : nombre de parties, nombre de succès et d'échecs (taux de réussite).
- Liste chronologique des parties avec leurs détails (date, participants, scores, résultat, notes).

### 4.4 Espace Joueurs

- Liste des joueurs actifs.
- Création d'un joueur, possible ici comme à la volée pendant la saisie d'une partie. Le nom d'un joueur actif est unique (homonymes entre joueurs actifs interdits, comparaison insensible à la casse et aux accents) ; un nom identique à un joueur archivé reste autorisé. La création contrôle cette unicité sur les deux surfaces.
- Renommage d'un joueur (l'identité interne reste stable, seul l'affichage change). Le nouveau nom doit être unique parmi les joueurs actifs (même règle que la création).
- Archivage ("suppression") d'un joueur déclenché depuis la fiche joueur (menu d'overflow de l'en-tête), et non depuis cette liste. La liste de l'espace Joueurs ne porte aucune action d'archivage par ligne. Le joueur archivé disparaît de la liste active, de l'autocomplete et n'a plus de fiche, mais son nom reste affiché dans l'historique des parties et il reste comptabilisé dans les statistiques des jeux (record, classement par victoires).
- Fiche joueur : liste chronologique de ses parties (jeu, date, score, résultat) et compteurs simples (nombre de parties, nombre de victoires). Le compteur de victoires ne compte que les participations gagnantes sur des jeux compétitifs ; les succès coopératifs n'y entrent pas.

### 4.5 Navigation et UX

- Bottom bar à deux entrées : Collection et Joueurs.
- Action d'ajout accessible clairement (jeu depuis la Collection, partie depuis la fiche jeu).
- Mobile-first. Zones interactives confortables au pouce (hauteur minimale de 44px).
- Pas de formulaire multi-étapes complexe.

## 5. Parcours utilisateurs clés

Saisie après une soirée jeu. L'utilisateur ouvre l'app, va sur la fiche du jeu joué, lance l'ajout de partie. La date est déjà au jour même. Il ajoute les participants en tapant les premières lettres (autocomplete sur les joueurs connus) ou crée à la volée un joueur absent. Il saisit les scores, désigne le ou les gagnants, ajoute éventuellement une note, valide. Pour un jeu coopératif, il bascule simplement le résultat sur succès ou échec.

Consultation des statistiques d'un jeu. Depuis la Collection, l'utilisateur ouvre une fiche jeu. Il voit le nombre de parties, le record et son détenteur, le classement des joueurs par victoires, puis l'historique chronologique. Pour un jeu coopératif, il voit le taux de réussite à la place du record.

Consultation d'une fiche joueur. Depuis l'espace Joueurs, l'utilisateur ouvre la fiche d'une personne et voit l'ensemble de ses parties avec scores et résultats, ainsi que ses compteurs de parties et de victoires.

## 6. Modèle conceptuel des entités

Niveau produit, indépendant du choix technique.

- Jeu : identité propre, nom (unique dans la collection, comparaison insensible à la casse et aux accents), type (compétitif ou coopératif), métadonnées optionnelles (joueurs min/max, durée). Pas d'image en V1 (placeholder seul ; image reportée en V2).
- Joueur : identité propre et stable, nom modifiable (unique parmi les joueurs actifs, comparaison insensible à la casse et aux accents ; un nom identique à un joueur archivé reste autorisé), état actif ou archivé.
- Partie : rattachée à un jeu, porte une date jouée (modifiable), une note, et un horodatage de création immuable servant au tri secondaire déterministe des historiques.
- Participation : lien entre une partie et un joueur, porte le score (optionnel) et l'indicateur de victoire.

Relations : un jeu a plusieurs parties ; une partie réunit plusieurs joueurs au travers de participations ; un joueur prend part à plusieurs parties au travers de participations.

Deux choix de modélisation structurants, alignés sur des évolutions déjà anticipées :

- La victoire est un attribut de la participation (un indicateur par joueur), et non un vainqueur unique de la partie. La V1 autorise plusieurs gagnants par partie (ex-aequo activé), le modèle le supportant nativement. Au moins un gagnant est obligatoire pour une partie compétitive.
- La suppression d'un joueur est un archivage (changement d'état), et non un effacement. Les participations passées restent intègres et les statistiques dérivées restent cohérentes.

## 7. Hors périmètre V1 et pistes V2

- Intégration BoardGameGeek : recherche d'un jeu, import automatique des métadonnées et des images riches. Réintroduit en V2.
- Upload et gestion d'image de couverture : reporté en V2 (en-tête en placeholder seul en V1).
- Parties en équipe (2 contre 2, etc.).
- Statistiques inter-jeux par joueur (taux de victoire global, jeu fétiche) et écran d'accueil ou de statistiques transverses.
- Synchronisation multi-appareils (base distante, sans compte utilisateur).
- Fusion de joueurs en doublon.

## 8. Contraintes et principes directeurs

- Mobile-first, cibles tactiles d'au moins 44px, navigation par bottom bar, pas de multi-étapes.
- Mono-utilisateur, sans compte.
- Fonctionnement hors-ligne, données locales à l'appareil en V1.
- Statistiques toujours calculées à la lecture, jamais stockées, pour éviter toute dérive d'intégrité lors des suppressions.
- Structures de données normalisées dès la V1 (jeux, joueurs, parties, participations) afin de préparer une future migration vers une base distante sans refonte.

## 9. Risques et questions ouvertes

- Stockage des images de couverture : sans objet en V1 (image de couverture reportée en V2 ; l'en-tête reste toujours un placeholder fond coloré + initiale).
- Joueur archivé et statistiques agrégées (décision actée) : un joueur archivé reste comptabilisé partout où ses parties réelles sont restituées (record, classement par victoires, historique chronologique), afin de ne pas fausser les statistiques. Il disparaît uniquement de la liste active des joueurs, de l'autocomplete de saisie et n'a plus de fiche consultable.
- Définition de la victoire pour le classement : elle s'appuie sur l'indicateur de gagnant marqué manuellement, indépendant du score, et supporte nativement l'ex-aequo (plusieurs gagnants par partie). Cela évite d'avoir à gérer le sens du score (le plus haut ou le plus bas gagne selon les jeux).
- Jeux coopératifs : pas de notion de record, on affiche le taux de réussite à la place.
