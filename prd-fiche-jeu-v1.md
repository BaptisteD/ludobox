# PRD — Écran Fiche jeu (Ludothèque personnelle, V1)

> Document spécifique à un seul écran : la **fiche jeu**. Il est auto-suffisant : un développeur qui ne connaît pas le contexte doit pouvoir le lire et comprendre exactement quoi construire pour cet écran. Il s'inscrit dans le périmètre du brief produit V1 (journal de parties personnel, mobile, hors-ligne, sans compte).

---

## 1. Vision de l'écran

La fiche jeu est l'écran central du produit. Le jeu n'est pas un objet de catalogue mais un **conteneur de parties** : c'est ici que l'utilisateur consigne ses parties et lit les statistiques qui répondent à ses questions de joueur régulier (qui gagne le plus sur ce jeu, quel est le record, combien de fois l'a-t-on sorti). L'écran doit rendre la consultation immédiate et l'ajout d'une partie sans friction.

## 2. Problème et utilisateur

Utilisateur unique : le propriétaire de la collection, sur téléphone, en usage personnel. Données locales à l'appareil, pas de compte. Le problème résolu par cet écran : accéder en un coup d'œil à la mémoire des parties d'un jeu donné et à ses statistiques, et pouvoir corriger ou compléter cet historique sans manipulation lourde.

## 3. Définitions (vocabulaire contractuel)

- **Jeu** : entité conteneur. Type *compétitif* ou *coopératif* : modifiable tant qu'aucune partie n'existe, immuable dès la première partie enregistrée.
- **Partie** : une session jouée, rattachée à un jeu. Porte une date et une note libre.
- **Participation** : lien entre une partie et un joueur. Porte un score (optionnel) et un indicateur de victoire (booléen).
- **Indicateur de victoire** : drapeau booléen sur la participation, déclaré manuellement par l'utilisateur. Aucune déduction automatique à partir du score.
- **Gagnant** : joueur dont la participation a l'indicateur de victoire à vrai sur une partie donnée.
- **Joueur archivé** : joueur retiré de la liste active (donc absent de l'autocomplete et sans fiche consultable), mais conservé dans l'historique et comptabilisé dans toutes les statistiques.
- **Record** : score numérique le plus élevé enregistré sur le jeu, avec le joueur correspondant. Voir règle de calcul en section 8.
- **Taux de réussite** : pour un jeu coopératif, proportion de parties en succès sur le total.

## 4. Périmètre fonctionnel de l'écran

### 4.1 Dans le périmètre

- Affichage de l'en-tête du jeu (placeholder visuel, nom, type, métadonnées optionnelles ; image reportée en V2).
- Accès à l'édition et à la suppression du jeu (via menu d'overflow).
- CTA d'ajout d'une partie.
- Section statistiques calculée à la lecture (jamais stockée), différente selon le type.
- Historique chronologique des parties.
- Ouverture du détail d'une partie, son édition (tous champs) et sa suppression.
- État vide quand le jeu n'a aucune partie.

### 4.2 Hors périmètre de l'écran

- Recherche BoardGameGeek et import automatique de métadonnées ou d'images riches (V2).
- Statistiques inter-jeux ou écran d'accueil transverse (V2).
- Parties en équipe (V2).
- Fusion de joueurs en doublon (V2).
- Création ou renommage d'un joueur en tant que tels : ils relèvent de l'espace Joueurs et du formulaire de partie, pas de cet écran (la création à la volée pendant la saisie d'une partie reste possible via le formulaire de partie, hors périmètre de ce document).

### 4.3 Évolution de périmètre actée vs brief V1

L'**ex-aequo (plusieurs gagnants par partie)** est **activé en V1** sur cet écran et dans la saisie de partie. Le modèle de données du brief le supporte déjà (la victoire est un attribut de la participation). La mention « un seul gagnant en V1 » du brief est donc caduque et doit être répercutée dans le brief produit.

## 5. User stories et critères d'acceptation

Format : En tant que [rôle], je veux [action] afin de [bénéfice]. Critères en Given / When / Then.

### US1 — Lire les statistiques d'un jeu compétitif
En tant que propriétaire, je veux voir le nombre de parties, le record et le top 3 des joueurs par victoires, afin de répondre immédiatement à mes questions de joueur régulier.

- Given un jeu compétitif avec au moins une partie, When j'ouvre sa fiche, Then la section statistiques affiche le nombre de parties, le record et le classement des joueurs par victoires.
- Given des parties dont au moins une porte un score, When j'ouvre la fiche, Then le record affiche la valeur du plus haut score et le nom du joueur correspondant.
- Given aucune partie ne porte de score, When j'ouvre la fiche, Then la ligne record affiche un état vide explicite (libellé « Pas encore de score enregistré ») et les autres statistiques restent affichées.

### US2 — Lire les statistiques d'un jeu coopératif
En tant que propriétaire, je veux voir le nombre de parties, le nombre de succès et d'échecs et le taux de réussite, afin de suivre ma performance collective sur ce jeu.

- Given un jeu coopératif avec au moins une partie, When j'ouvre sa fiche, Then la section statistiques affiche le nombre de parties, le nombre de succès, le nombre d'échecs et le taux de réussite.
- Given un jeu coopératif, When j'ouvre sa fiche, Then aucune notion de record ni de classement par victoires n'est affichée.

### US3 — Consulter l'historique des parties
En tant que propriétaire, je veux voir toutes les parties du jeu en ordre chronologique, afin de retrouver le détail de chaque session.

- Given un jeu avec plusieurs parties, When j'ouvre sa fiche, Then l'historique liste toutes les parties triées par date décroissante (la plus récente en haut) ; à date égale, par horodatage de création décroissant.
- Given une partie compétitive, When elle s'affiche dans l'historique, Then l'entrée montre la date, les participants, les scores s'ils sont renseignés, et met en évidence le ou les gagnants.
- Given une partie coopérative, When elle s'affiche dans l'historique, Then l'entrée montre la date, les participants et le résultat collectif (succès ou échec).
- Given une partie portant une note, When elle s'affiche dans l'historique, Then un indicateur de présence de note est visible (le contenu complet est lisible dans le détail).
- Given une partie impliquant un joueur archivé, When elle s'affiche, Then le nom du joueur archivé apparaît sans lien cliquable.

### US4 — Ajouter une partie
En tant que propriétaire, je veux lancer l'ajout d'une partie depuis la fiche du jeu, afin de consigner une session juste après l'avoir jouée.

- Given une fiche jeu ouverte, When j'active le CTA d'ajout, Then le formulaire de saisie de partie s'ouvre avec la date pré-remplie à aujourd'hui et le type de saisie correspondant au type du jeu.
- Given une nouvelle partie enregistrée, When je reviens sur la fiche, Then l'historique et les statistiques reflètent la nouvelle partie (recalcul à la lecture).

### US5 — Éditer une partie
En tant que propriétaire, je veux modifier tous les éléments d'une partie après coup, afin de corriger une erreur de saisie.

- Given une partie existante, When j'ouvre son détail et lance l'édition, Then je peux modifier la date, les participants, les scores, le ou les gagnants (compétitif) ou le résultat collectif (coopératif) et la note.
- Given une partie en cours d'édition, When je l'enregistre, Then les statistiques et l'historique de la fiche sont recalculés en conséquence.
- Given une partie compétitive, When je tente de l'enregistrer sans aucun gagnant, Then l'enregistrement est bloqué et un message indique qu'au moins un gagnant est requis.
- Given le type du jeu, When j'édite une partie, Then je ne peux pas changer la nature compétitive ou coopérative de la partie (elle découle du jeu).

### US6 — Supprimer une partie
En tant que propriétaire, je veux supprimer une partie isolément, afin de retirer une saisie erronée.

- Given une partie existante, When je demande sa suppression, Then une confirmation explicite est requise avant exécution.
- Given une suppression confirmée, When elle s'exécute, Then seule cette partie et ses participations sont supprimées, sans effet sur le jeu ni sur les autres parties, et les statistiques sont recalculées.

### US7 — Éditer le jeu
En tant que propriétaire, je veux modifier les informations d'un jeu, afin de corriger ou compléter sa fiche.

- Given une fiche jeu, When j'ouvre l'édition du jeu, Then je peux modifier le nom et les métadonnées optionnelles (joueurs min/max, durée). La création/édition de jeu (champs, validations, unicité du nom, verrou du type) est détaillée dans `prd-formulaire-jeu-v1`.
- Given un jeu ayant au moins une partie, When j'ouvre l'édition, Then le type (compétitif ou coopératif) n'est pas modifiable.
- Given un jeu n'ayant aucune partie, When j'ouvre l'édition, Then le type est modifiable.

### US8 — Supprimer le jeu
En tant que propriétaire, je veux supprimer un jeu, afin de retirer un jeu que je ne possède plus.

- Given une fiche jeu, When je demande la suppression du jeu, Then une confirmation explicite mentionnant la suppression en cascade des parties est requise.
- Given une suppression confirmée, When elle s'exécute, Then le jeu, toutes ses parties et toutes les participations associées sont supprimés.

### US9 — État vide
En tant que propriétaire, je veux un écran clair quand un jeu n'a encore aucune partie, afin d'être incité à en consigner une.

- Given un jeu sans aucune partie, When j'ouvre sa fiche, Then la section statistiques et l'historique sont remplacés par un état vide (illustration et CTA « Ajouter une partie ») et le CTA est l'élément dominant.

## 6. Flows principaux

**Consultation d'un jeu compétitif.** L'utilisateur ouvre la fiche depuis la Collection. Il voit l'en-tête, puis le CTA d'ajout, puis le nombre de parties, le record et son détenteur, le top 3 par victoires, enfin l'historique en ordre chronologique décroissant.

**Consultation d'un jeu coopératif.** Identique, mais la section statistiques affiche nombre de parties, succès, échecs et taux de réussite à la place du record et du classement.

**Ajout d'une partie.** Depuis la fiche, l'utilisateur active le CTA, le formulaire de partie s'ouvre (date du jour pré-remplie, mode compétitif ou coopératif selon le jeu). Après validation, il revient sur la fiche mise à jour.

**Correction d'une partie.** L'utilisateur touche une entrée de l'historique, ouvre le détail, lance l'édition, modifie un ou plusieurs champs, enregistre. La fiche se recalcule.

**Suppression d'une partie.** Depuis le détail d'une partie, l'utilisateur demande la suppression, confirme, et la fiche se recalcule.

**Édition ou suppression du jeu.** Via le menu d'overflow de l'en-tête, l'utilisateur ouvre l'édition du jeu ou lance la suppression (avec confirmation et avertissement de cascade).

## 7. Cas limites et états d'erreur

- **Jeu sans aucune partie** : état vide global (illustration et CTA), pas de section statistiques ni d'historique.
- **Jeu compétitif avec parties mais aucun score** : historique et classement affichés normalement ; ligne record en état vide explicite.
- **Jeu compétitif avec parties mais aucun gagnant marqué** : le classement affiche les joueurs avec 0 victoire selon la règle de complétion (section 8.2). Remarque : ce cas ne peut survenir que pour des parties créées avant l'activation de la règle « gagnant obligatoire » ; toute nouvelle partie compétitive impose au moins un gagnant.
- **Partie avec scores partiels** : un score peut être renseigné pour certains participants seulement ; le record se calcule sur les seules participations ayant un score.
- **Égalité de victoires au-delà de la 3e place** : la liste est coupée nette à 3 entrées, départage alphabétique appliqué (section 8.2).
- **Moins de 3 joueurs ayant joué le jeu** : le classement affiche tous les joueurs existants, sans entrée fictive.
- **Joueur archivé** : reste comptabilisé dans le record, le classement et l'historique ; affiché par son nom, sans lien.
- **Suppression de la dernière partie d'un jeu** : la fiche bascule sur l'état vide.
- **Dates identiques entre deux parties** : départage déterministe par horodatage de création décroissant (la partie créée le plus récemment en premier). Règle commune avec la fiche joueur.
- **En-tête toujours en placeholder** (fond coloré et initiale du jeu) ; l'image de couverture est reportée en V2.
- **Note absente sur une partie** : aucun indicateur de note affiché.

## 8. Règles de calcul (déterministes, calculées à la lecture)

Toutes les statistiques sont recalculées à chaque affichage, jamais persistées.

### 8.1 Record (jeu compétitif)
1. Considérer toutes les participations du jeu ayant un score renseigné.
2. Le record est la participation au score numérique le plus élevé, sans interprétation du sens métier du jeu (le plus haut score est toujours considéré comme le record, y compris pour des jeux où un score bas serait « meilleur »).
3. En cas d'égalité au score maximum, retenir la participation de la partie la plus récente (date la plus récente) ; à date égale, départager par ordre alphabétique du nom du joueur.
4. Affichage : valeur du score et nom du joueur (joueur archivé inclus).
5. Si aucune participation n'a de score, pas de record (état vide explicite).

### 8.2 Classement des joueurs par victoires (jeu compétitif)
1. Pour chaque joueur ayant au moins une participation au jeu, compter ses participations dont l'indicateur de victoire est vrai (une partie à plusieurs gagnants incrémente chaque gagnant).
2. Trier par nombre de victoires décroissant, puis, à égalité, par ordre alphabétique du nom (comparaison insensible à la casse et aux accents).
3. Afficher au maximum 3 entrées (coupe nette à 3, sans extension en cas d'égalité sur la 3e place).
4. Inclure les joueurs archivés.
5. Si moins de 3 joueurs ont au moins 1 victoire, compléter avec des joueurs à 0 victoire (triés alphabétiquement) jusqu'à 3.
6. Si le jeu compte moins de 3 joueurs au total, afficher tous les joueurs existants.

### 8.3 Statistiques coopératives
1. Nombre de parties : compte des parties du jeu.
2. Succès et échecs : compte des parties selon leur résultat collectif.
3. Taux de réussite : succès divisé par total, exprimé en pourcentage arrondi à l'entier le plus proche (ex : 67 %).

### 8.4 Nombre de parties
Compte de toutes les parties rattachées au jeu, pour les deux types.

### 8.5 Tri de l'historique
1. Trier les parties du jeu par date décroissante (la plus récente en premier).
2. À date égale, départager par horodatage de création décroissant (la partie créée le plus récemment en premier). Règle commune avec la fiche joueur.

Chaque partie persiste un horodatage de création immuable, distinct de la date jouée (modifiable). Cette règle de tri est indépendante du départage propre au record (section 8.1), qui reste inchangé.

## 9. Séparation UI et logique

- **Logique fonctionnelle** : structure et règles ci-dessus (calculs section 8, validations section 5, comportements section 7). Indépendante du rendu.
- **Rendu visuel (indicatif, mobile-first)** : en-tête avec placeholder (fond coloré + initiale du jeu), titre, sous-titre métadonnées, menu d'overflow à 3 points en haut à droite. CTA d'ajout en bouton primaire visible. Statistiques en bloc lisible d'un coup d'œil. Historique en liste verticale, entrée tappable. Cibles tactiles d'au moins 44 px. Le détail exact du style est laissé à la phase de design ; seules les contraintes d'accessibilité tactile et de hiérarchie sont normatives.

## 10. Contraintes techniques connues

- Mobile-first, cibles tactiles d'au moins 44 px, pas de formulaire multi-étapes.
- Mono-utilisateur, sans compte, fonctionnement hors-ligne, données locales à l'appareil.
- Statistiques toujours calculées à la lecture, jamais stockées, pour préserver l'intégrité lors des suppressions.
- Modèle de données normalisé (jeux, joueurs, parties, participations), la victoire étant un attribut de la participation.
- L'indicateur de victoire est booléen par participation ; il supporte nativement plusieurs gagnants par partie.
- Le type d'un jeu est immuable dès qu'au moins une partie existe.
- Chaque partie persiste un horodatage de création immuable, distinct de la date jouée, pour le tri secondaire déterministe des historiques.

## 11. Questions ouvertes

- [Design] Faut-il marquer visuellement un joueur archivé dans le classement et l'historique (ex : libellé « (archivé) ») ou l'afficher comme un joueur normal ? Non bloquant.
- [Design] Mise en évidence visuelle de plusieurs gagnants dans une entrée d'historique : à définir au design. Non bloquant.
- [Acté] Au moins un gagnant est obligatoire pour valider une partie compétitive. Décision confirmée et appliquée par le PRD fiche de partie (US8, règle 8.2).
- [Acté] Brief produit aligné : mention « un seul gagnant en V1 » retirée, ex-aequo sorti du hors-périmètre, image de couverture reportée en V2 (patch corpus V1 appliqué).
- [Data] Format d'affichage du taux de réussite (entier vs une décimale) : défaut retenu = entier. Non bloquant.
