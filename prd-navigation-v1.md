# PRD — Navigation et structure d'app (Ludothèque personnelle, V1)

> Document spécifique à la **structure de navigation transverse** de l'app. Il est auto-suffisant : un développeur qui ne connaît pas le contexte doit pouvoir le lire et comprendre exactement quoi construire pour la navigation. Il s'inscrit dans le périmètre du brief produit V1 (journal de parties personnel, mobile, hors-ligne, sans compte) et partage le vocabulaire contractuel des PRD fiche jeu et fiche joueur. Le contenu des écrans (listes, fiches, formulaires) est hors de ce document : il relève de leurs PRD respectifs.

-----

## 1. Vision

La navigation est le squelette qui relie les deux espaces de premier niveau (Collection, Joueurs) et les écrans de détail (fiche jeu, fiche joueur, fiche de partie, formulaires). Elle doit rester minimale et prévisible au pouce : deux destinations principales, une règle nette de présence de la bottom bar, un retour qui ne perd jamais l'utilisateur. Aucun apprentissage requis.

## 2. Problème et utilisateur

Utilisateur unique : le propriétaire de la collection, sur téléphone, en usage personnel. Données locales à l'appareil, pas de compte. Le problème résolu : se déplacer entre les deux espaces et descendre dans les détails sans ambiguïté de niveau, avec un retour cohérent et des données toujours à jour au retour.

## 3. Définitions (vocabulaire contractuel)

- **Écran de premier niveau** : une des deux destinations de la bottom bar, la Collection ou l'espace Joueurs.
- **Écran de détail** : tout écran atteint en descendant dans la hiérarchie depuis un écran de premier niveau ou un autre détail (fiche jeu, fiche joueur, fiche de partie, formulaires de création ou d'édition).
- **Bottom bar** : barre de navigation basse à deux entrées (Collection, Joueurs), présente uniquement sur les écrans de premier niveau.
- **Onglet actif** : la destination de premier niveau actuellement affichée.
- **Pile de navigation** : empilement des écrans de détail ouverts par-dessus l'écran de premier niveau courant. Le retour dépile d'un cran.

## 4. Périmètre fonctionnel

### 4.1 Dans le périmètre

- Bottom bar à deux entrées : Collection et Joueurs.
- Onglet affiché au lancement : Collection.
- Mise en évidence de l'onglet actif.
- Présence de la bottom bar limitée aux écrans de premier niveau ; absente sur tout écran de détail.
- Navigation de retour disponible sur les écrans de détail (dépilement d'un cran).
- Au retour sur un écran de premier niveau, recalcul à la lecture de son contenu (compteurs, listes) pour refléter toute modification intervenue dans les détails.
- Conservation de la position de scroll d'une liste de premier niveau tant que l'app reste ouverte.

### 4.2 Hors périmètre

- Contenu et comportement des listes Collection et Joueurs (PRD Listes).
- Contenu des fiches jeu, joueur, partie (PRD dédiés).
- Formulaires de création et d'édition (PRD Formulaires).
- Recherche, filtres, écran d'accueil ou de statistiques transverses (V2).
- Onboarding, écran de démarrage, deep links externes.
- Reprise de l'état de navigation après fermeture complète de l'app (voir question ouverte).

## 5. User stories et critères d'acceptation

Format : En tant que [rôle], je veux [action] afin de [bénéfice]. Critères en Given / When / Then.

### NAV-US1 — Naviguer entre Collection et Joueurs

En tant que propriétaire, je veux basculer entre la Collection et l'espace Joueurs via une bottom bar, afin d'accéder rapidement aux deux espaces principaux.

- Given l'app ouverte, When elle se lance, Then l'onglet Collection est affiché et la bottom bar montre les deux entrées (Collection, Joueurs).
- Given je suis sur un écran de premier niveau, When je tape l'autre entrée de la bottom bar, Then l'écran bascule sur cet onglet et l'entrée active est mise en évidence (jamais par la couleur seule).
- Given je suis sur un écran de détail, When il s'affiche, Then la bottom bar n'est pas visible et une navigation de retour est disponible.
- Given je suis sur un écran de détail, When je veux changer d'espace, Then je dois d'abord remonter à un écran de premier niveau (le changement d'onglet n'est pas accessible depuis un détail).

### NAV-US2 — Revenir sans se perdre

En tant que propriétaire, je veux un retour prévisible depuis n'importe quel détail, afin de poursuivre ma navigation sans me perdre.

- Given un écran de détail ouvert, When je déclenche le retour, Then je remonte d'un cran dans la pile (vers l'écran qui l'a ouvert, liste de premier niveau ou autre détail).
- Given je reviens sur une liste de premier niveau précédemment scrollée, When elle se réaffiche, Then sa position de scroll est conservée.
- Given une donnée a changé pendant la consultation d'un détail (partie ajoutée ou supprimée, jeu supprimé, joueur archivé, renommage), When je reviens sur un écran de premier niveau, Then son contenu reflète l'état à jour (recalcul à la lecture).
- Given l'objet d'un détail a été supprimé ou archivé depuis ce détail (jeu supprimé, joueur archivé), When le retour s'exécute, Then je suis ramené à l'écran de premier niveau pertinent et l'objet n'y figure plus.

## 6. Flows principaux

**Lancement.** L'app s'ouvre sur la Collection, bottom bar visible, onglet Collection actif.

**Bascule d'onglet.** Depuis un écran de premier niveau, l'utilisateur tape l'autre entrée de la bottom bar ; l'espace correspondant s'affiche, l'onglet actif est mis à jour.

**Descente et retour.** Depuis une liste, l'utilisateur ouvre un détail (la bottom bar disparaît, une navigation de retour apparaît). Il peut descendre plus profond (par exemple fiche jeu puis fiche de partie). Le retour dépile un cran à la fois ; en atteignant un écran de premier niveau, la bottom bar réapparaît et le contenu est recalculé.

## 7. Cas limites et états d'erreur

- **Re-tap de l'onglet déjà actif** : remonter en haut de la liste de cet onglet (défaut retenu, voir question ouverte). Non destructif.
- **Retour depuis un détail dont l'objet n'existe plus** (jeu supprimé, joueur archivé) : retour à l'écran de premier niveau pertinent, sans tentative de réafficher l'objet disparu.
- **Détail ouvert depuis un autre détail** (fiche de partie ouverte depuis la fiche jeu ou la fiche joueur) : le retour revient à l'écran appelant, pas directement à la liste.
- **Geste système de retour (Android)** : mappé sur la même navigation de retour que le bouton de retour de l'écran.
- **Pile vide sur un écran de premier niveau** : le retour système ne descend pas sous le premier niveau (comportement natif de sortie d'app laissé au système).

## 8. Séparation UI et logique

- **Logique fonctionnelle** : modèle de pile de navigation, règle de présence de la bottom bar (premier niveau uniquement), recalcul à la lecture au retour, conservation de scroll. Indépendante du rendu.
- **Rendu visuel (indicatif, mobile-first)** : bottom bar à deux entrées icône + libellé, onglet actif mis en évidence sans reposer sur la couleur seule (libellé, forme ou poids), cibles tactiles d'au moins 44 px ; sur les détails, une navigation de retour explicite (flèche) en en-tête. Le style précis est laissé à la phase de design ; seules les contraintes d'accessibilité tactile et la hiérarchie de niveau sont normatives.

## 9. Contraintes techniques connues

- Mobile-first, cibles tactiles d'au moins 44 px.
- Mono-utilisateur, sans compte, fonctionnement hors-ligne, données locales à l'appareil.
- Statistiques et compteurs recalculés à la lecture, jamais stockés ; le retour sur une liste déclenche ce recalcul.
- La bottom bar n'est rendue que sur les écrans de premier niveau ; ce choix implique que le changement d'espace n'est pas possible depuis un détail.

## 10. Questions ouvertes

- [Design / UX] Comportement du re-tap sur l'onglet actif : défaut retenu = remontée en haut de liste. Alternative = aucun effet. Non bloquant.
- [Produit] Reprise de l'état de navigation après fermeture complète de l'app : défaut retenu = réouverture toujours sur la Collection. Alternative = reprendre le dernier onglet. Non bloquant.
- [Produit] Conservation des positions de scroll : retenue tant que l'app reste en mémoire ; comportement après mise en arrière-plan prolongée laissé à l'implémentation. Non bloquant.
- [Design] Indication visuelle de l'onglet actif (au-delà de la non-dépendance à la couleur seule) : à définir au design. Non bloquant.
