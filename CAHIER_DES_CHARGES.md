# Family Quiz : cahier des charges

> Version 0.1, 25 novembre 2026. Document de travail à valider.

## 0. En une phrase

Un **jeu télévisé familial** sur **une seule tablette**. Chaque membre de la famille remplit d'abord en privé un questionnaire sur lui-même. Ensuite, on pose la tablette au milieu de la table et, **chacun son tour**, on répond à des questions sur les autres. Le tout dans une ambiance de plateau télé, avec présentateur, chrono, jingles, animations et podium.

---

## 1. Objectifs et périmètre

### 1.1 Objectifs
- Faire rire et se découvrir en famille : « Tu savais que Léo rêvait d'avoir un serpent ? »
- Un jeu jouable par toute la famille, **dès 6 ans**, adultes compris.
- Une vraie ambiance d'émission : animations, sons, voix, mise en scène.
- Un jeu qui **s'enrichit d'une partie à l'autre** : profils et réponses mémorisés, nouvelles questions à chaque partie.

### 1.2 Contraintes
- **Application web installable sur Android (PWA)**, qui tourne entièrement dans le navigateur.
- **Un seul appareil** : une tablette récente de 7 pouces, utilisée **en portrait**.
- **Aucun serveur, aucun compte, aucune IA, aucune publicité, aucun achat.**
- **Fonctionne hors ligne** une fois installée.
- **Toutes les données restent sur la tablette.** Si le navigateur est nettoyé, elles sont perdues : c'est accepté, il n'y a pas de sauvegarde.
- **Langue : français uniquement.**

### 1.3 Hors périmètre (pour l'instant)
- Diffusion sur la TV (Chromecast) ou jeu sur plusieurs appareils.
- Génération de questions par IA.
- Export ou import des données.
- Questions rédigées par la famille (piste d'évolution, voir § 13).

---

## 2. Les joueurs

### 2.1 Fiche joueur
| Champ | Détail |
|---|---|
| Nom | Texte libre, par exemple « Papa », « Emma ». Il est affiché et lu tel quel. |
| Avatar | Un emoji choisi dans une galerie d'environ 60 emojis (animaux, visages, personnages, objets). |
| Âge | Saisi en années. L'application enregistre l'**année de naissance** pour que la tranche d'âge évolue toute seule avec le temps. |
| Rôle | `papa`, `maman`, `fille`, `garçon`. |
| Couleur | Attribuée automatiquement et modifiable. Elle sert à repérer le joueur dans les écrans de jeu. |

### 2.2 Ce que le rôle permet
- **Les accords en français** : papa et garçon → masculin, maman et fille → féminin (« Où Emma aimerait-**elle** partir ? »).
- **Les équipes automatiques** : enfants contre parents, filles contre garçons.
- **Le filtrage des questions** : certaines questions sont réservées aux parents ou aux enfants.

### 2.3 Tranches d'âge
| Tranche | Âges | Questionnaire | Pendant le quiz |
|---|---|---|---|
| `6-8` | 6 à 8 ans | **QCM uniquement**, avec un emoji sur chaque choix. Jamais de saisie de texte. | Tout se joue en touchant l'écran, avec du temps en plus. |
| `9-12` | 9 à 12 ans | QCM, plus un choix « Autre… » en texte libre. Quelques questions entièrement libres. | Normal |
| `13-17` | 13 à 17 ans | Comme `9-12`, avec des questions plus « ados ». | Normal |
| `adulte` | 18 ans et plus | Comme `9-12`, avec des questions plus nostalgiques (enfance, souvenirs, travail). | Normal |

Il n'y a pas de joueur de moins de 6 ans : la saisie de l'âge est limitée à 6 ans minimum.

---

## 3. Déroulé général

```
Accueil
  ├─ Joueurs (créer / modifier / supprimer)
  └─ Nouvelle partie
       ① Qui joue ?        joueurs présents, mode individuel ou équipes, durée
       ② Questionnaire     chacun son tour, en privé
                           · première fois : environ 20 questions (≈ 5 min)
                           · ensuite : 3 à 5 questions inédites (≈ 1 min)
       ③ L'émission        générique → candidats → 4 manches → podium
```

---

## 4. Le questionnaire (phase privée)

### 4.1 Passage de relais
1. L'écran « 🙈 Passe la tablette à **Emma** ! » s'affiche, avec son avatar en grand, puis un bouton « C'est moi ! ».
2. Le présentateur souhaite la bienvenue au candidat et explique en une phrase : « Réponds sincèrement, personne ne regarde ! »
3. Les questions s'enchaînent, une par écran, avec une barre de progression et une transition animée.
4. Un bouton « Je préfère passer » est toujours disponible. Une question passée pourra revenir plus tard.
5. Écran de fin : « Merci Emma ! » avec une animation, puis on passe au joueur suivant. **Aucune réponse ne reste visible.**

### 4.2 Formats de réponse
- **Choix (QCM)** : 6 à 8 choix illustrés d'un emoji, affichés en grille. Un seul choix possible.
  - Dès 9 ans, un choix « Autre… » en plus ouvre un champ texte court de 40 caractères maximum.
- **Duel** : deux grandes cartes, « plutôt ceci ou cela ».
- **Membre** : on choisit un joueur de la famille. Les avatars sont affichés.
- **Libre** : un champ texte court, réservé aux 9 ans et plus. Un exemple de réponse est affiché en gris.

Les questions peuvent être **lues à voix haute** (réglage activé par défaut).

### 4.3 Quelles questions pour qui (règles de sélection)
- On ne propose que les questions qui correspondent à la **tranche d'âge** et au **rôle** du joueur.
- **Première partie** : environ 20 questions par joueur.
  - Au moins 60 % de ces questions sont **posées aussi aux autres joueurs**. C'est indispensable pour fabriquer les mauvaises réponses des QCM et pour la manche « Qui a répondu ça ? ».
  - On répartit sur un maximum de catégories.
- **Parties suivantes** : 3 à 5 questions inédites par joueur. On choisit de préférence des questions auxquelles d'autres membres ont déjà répondu.
- **Mise à jour** : si une réponse a plus de 6 mois, on peut la reproposer avec « C'est toujours vrai ? » (Oui / Non, je change). Au plus une par joueur et par partie.
- **Contrôle avant l'émission** : s'il n'y a pas assez de matière pour la durée choisie (§ 5.6), l'application ajoute quelques questions au questionnaire.

---

## 5. L'émission (tablette au milieu de la table)

### 5.1 Modes
- **Chacun pour soi** : au moins 2 joueurs.
- **Équipes** : enfants contre parents, ou filles contre garçons. Il faut au moins 1 joueur par équipe. Les équipes sont formées automatiquement grâce aux rôles.

### 5.2 Le tour de table
- **Un seul joueur répond à la fois.** C'est le **joueur actif**, et la tablette lui est passée.
- Chaque question porte sur un autre joueur, appelé **la personne visée** :
  - en mode équipes, la personne visée est **toujours dans l'équipe adverse** ;
  - en mode individuel, ce peut être n'importe quel autre joueur.
- Écran d'annonce : « 🎤 Au tour de **Emma** ! Question sur… 🥁 **Papa** 👨 », avec un roulement de tambour et un tirage animé de la personne visée.
- **Équilibre** : chaque joueur est visé à peu près autant de fois que les autres. Les équipes jouent en alternance, et à l'intérieur d'une équipe les joueurs se succèdent à tour de rôle.
- On ne pose jamais à un joueur une question sur lui-même.

### 5.3 Répondre et valider
- **QCM, duel ou membre** : le joueur actif touche sa réponse et la correction est automatique.
- **Question libre**, ou réponse « Autre… » donnée au questionnaire :
  1. La question s'affiche, sans proposition de réponse.
  2. Le joueur actif répond **à voix haute** puis touche « J'ai répondu ».
  3. L'écran « 👉 Tends la tablette à **Papa** » s'affiche.
  4. La personne visée voit **sa réponse d'origine** et touche **✔ Bonne réponse** ou **✘ Raté**.
- **Chrono** : 20 secondes par défaut, 30 secondes si le joueur actif a de 6 à 8 ans. Ne pas répondre à temps compte comme une erreur. Pour une question libre, le chrono s'arrête quand on touche « J'ai répondu ».
- **Révélation** : un temps de suspense (environ 1,5 s), puis la bonne réponse s'illumine et on joue l'animation et le son de réussite ou d'échec. Le présentateur réagit avec une phrase tirée au hasard dans une liste.

### 5.4 Les manches
| # | Manche | Principe | Questions utilisées | Points |
|---|---|---|---|---|
| 1 | **Quiz classique** | « Quel est le dessert préféré de Papa ? » 4 propositions, ou réponse libre validée | choix, duel, membre, libre | 100 |
| 2 | **Vrai ou faux** | « Emma rêve d'avoir un serpent. » Vrai ou Faux ? | choix, duel, membre (champ `affirmation`) | 50 |
| 3 | **Qui a répondu ça ?** | « Qui a répondu “les lasagnes de mamie” à : Quel est ton plat préféré ? » Choix parmi les avatars | choix, libre (champ `qui`) | 100 |
| 4 | **Rafale finale** | Chacun son tour, 30 secondes pour enchaîner un maximum de questions | choix, duel, membre (pas de libre) | **×2** |
| 5 | **Podium** | Classement, confettis, titres amusants | — | — |

Détails :
- **Manche 1, les 4 propositions** : la bonne réponse, plus 3 mauvaises tirées **en priorité parmi les réponses des autres joueurs** à la même question, puis complétées dans la liste des choix. L'ordre est mélangé. Un duel affiche ses 2 options, une question « membre » affiche les avatars.
- **Manche 2, l'affirmation** : elle est vraie une fois sur deux. Pour une affirmation fausse, on remplace la réponse par une autre, prise de préférence parmi les réponses des autres joueurs.
- **Manche 3, les réponses utilisées** :
  - En mode équipes, ce sont des réponses de l'équipe adverse, et les propositions sont tous les joueurs sauf le joueur actif.
  - On n'utilise que des réponses **uniques**, données par un seul joueur.
  - Les réponses libres sont les plus amusantes ici.
- **Manche 4** :
  - Questions courtes, sans écran d'annonce.
  - Les personnes visées changent à chaque question, toujours selon la règle d'équipe.
  - Bonne réponse : points doublés (200 pour un QCM, 100 pour un vrai/faux). Erreur : on passe à la suivante.
  - Un compteur géant et une musique qui accélère.
- **Bonus complicité** (mode individuel seulement) : la personne visée gagne 25 points quand on la devine bien. En mode équipes, il n'y en a pas, puisque la personne visée est un adversaire.

### 5.5 Scores
- Score par joueur et, en mode équipes, total de l'équipe.
- Entre deux manches, un écran des scores animé : les barres montent et les positions s'échangent.
- **Titres au podium**, calculés sur la partie, par exemple :
  - « Celui ou celle qui connaît le mieux Papa » ;
  - « Roi ou reine de la rafale » ;
  - « Le plus mystérieux » (la personne la moins devinée).

### 5.6 Durée
| Durée | Manche 1 | Manche 2 | Manche 3 | Manche 4 | ≈ temps (4 joueurs) |
|---|---|---|---|---|---|
| Courte | 1 tour de table | 1 tour | 1 tour | 20 s par joueur | 10 min |
| **Normale** (par défaut) | 2 tours | 1 tour (2 affirmations par joueur) | 1 tour | 30 s par joueur | 15 à 20 min |
| Longue | 3 tours | 2 tours | 2 tours | 45 s par joueur | 25 à 30 min |

Un tour de table = une question par joueur.

### 5.7 Pas de répétition
- L'application retient chaque question posée : question, personne visée, date.
- Une même paire question et personne visée n'est pas reposée pendant les **3 parties suivantes**, sauf si la matière manque.

---

## 6. Écrans

| Écran | Contenu principal |
|---|---|
| **Accueil** | Logo animé, mascotte, boutons « Nouvelle partie » et « Joueurs », réglages |
| **Joueurs** | Liste des fiches (avatar, nom, âge, rôle), ajout, modification, suppression avec confirmation, nombre de réponses déjà données |
| **Fiche joueur** | Nom, galerie d'emojis, âge (molette ou boutons + et –), rôle (4 grosses cartes) |
| **Nouvelle partie** | Joueurs présents à cocher, mode (individuel, enfants/parents, filles/garçons) avec aperçu des équipes, durée |
| **Passage de relais** | « Passe la tablette à… », grand avatar, « C'est moi ! » |
| **Questionnaire** | Question, choix en grille d'emojis, cartes de duel ou champ texte, progression, « Je préfère passer » |
| **Générique** | Logo, jingle, la mascotte entre en scène |
| **Présentation des candidats** | Chaque avatar arrive l'un après l'autre avec son nom (et son équipe) |
| **Titre de manche** | Grand titre animé, règle en une phrase lue par la mascotte |
| **Annonce du tour** | Joueur actif et tirage de la personne visée |
| **Question** | Question, chrono circulaire, propositions |
| **Validation** | « Tends la tablette à… », réponse d'origine, ✔ ou ✘ |
| **Révélation** | Suspense, bonne réponse, points gagnés qui s'envolent vers le score |
| **Scores** | Classement animé entre les manches |
| **Podium** | 3 marches, confettis, titres amusants, « Rejouer » ou « Accueil » |
| **Réglages** | Son, musique, voix (activée ou non), vitesse de lecture, durée par défaut, « Tout effacer » (double confirmation) |

Règles d'ergonomie :
- Écran en portrait.
- Zones tactiles d'au moins 56 px.
- Au plus 4 propositions de réponse pendant le quiz (sauf le choix d'un joueur parmi les avatars).
- Textes larges et lisibles par un enfant de 7 ans.
- Bouton « Pause » toujours accessible pendant l'émission, avec « Reprendre » ou « Quitter ». La partie en cours est sauvegardée pour pouvoir la reprendre si l'application se ferme.

---

## 7. Ambiance plateau télé

- **Mascotte présentatrice** : un personnage **original**, illustré en SVG et animé, avec plusieurs expressions (content, surpris, déçu, suspense). Elle parle dans une bulle, et son texte est aussi lu par la voix de synthèse. Son nom est à choisir.
- **Animations à chaque étape** :
  - entrées et sorties d'écran ;
  - cartes qui se retournent ;
  - chrono qui pulse dans les 5 dernières secondes ;
  - points qui volent vers le score ;
  - confettis ;
  - avatars qui sautillent quand ils gagnent.
- **Sons** :
  - générique, jingle de manche, roulement de tambour ;
  - bonne et mauvaise réponse, tic-tac, applaudissements, musique de la rafale.
  - Uniquement des fichiers libres de droits (CC0) ou des sons générés par le navigateur.
- **Voix** : lecture des questions et des répliques de la mascotte par la synthèse vocale du navigateur, en français. Elle peut être désactivée.
- **Vibrations** : bonne réponse, erreur, fin du chrono.
- **Illustrations** : emojis pour les choix et les avatars, décors SVG (projecteurs, rideau, rampes de lumière) pour l'effet plateau.
- **Écran toujours allumé** pendant une partie.

---

## 8. La banque de questions

### 8.1 Objectif
**1000 questions** livrées avec l'application, classées en **12 catégories**, couvrant toutes les tranches d'âge. Chaque catégorie a son fichier dans [src/data/banque/](src/data/banque/), avec une question par ligne. La commande `npm run verifier` contrôle le format de toute la banque.

### 8.2 Catégories
| id | Libellé | Emoji |
|---|---|---|
| `gourmandises` | Gourmandises | 🍰 |
| `loisirs` | Loisirs | 🎮 |
| `animaux` | Animaux | 🐾 |
| `voyages` | Voyages et rêves | ✈️ |
| `ecole-travail` | École et travail | 🏫 |
| `ecrans` | Films, séries et musique | 🎬 |
| `peurs` | Peurs et manies | 😱 |
| `et-si` | Et si… ? | 🤔 |
| `duels` | Plutôt ceci ou cela ? | ⚖️ |
| `famille` | Famille et souvenirs | 👨‍👩‍👧‍👦 |
| `personnalite` | Personnalité | 💭 |
| `futur` | Futur | 🚀 |

### 8.3 Format d'une question
```jsonc
{
  "id": "gourmandises-001",          // unique : <catégorie>-<numéro sur 3 chiffres>
  "categorie": "gourmandises",
  "type": "choix",                   // choix | duel | membre | libre
  "ages": ["6-8", "9-12", "13-17", "adulte"],
  "roles": ["papa", "maman"],        // facultatif : absent = tous les rôles
  "questionnaire": "Quel est ton dessert préféré ?",           // posée au joueur (« tu »)
  "quiz": "Quel est le dessert préféré {de_nom} ?",            // posée pendant le quiz (« il/elle »)
  "affirmation": "Le dessert préféré {de_nom}, c'est {reponse}.", // vrai ou faux (facultatif)
  "qui": "Qui craque pour {reponse} au dessert ?",              // qui a répondu ça (facultatif)
  "autre": true,                     // choix « Autre… » proposé dès 9 ans (type choix uniquement)
  "inclureSoi": false,               // type membre : le joueur peut-il se choisir lui-même ?
  "exemple": "les crêpes de mamie",  // type libre : exemple affiché en gris
  "choix": [                         // types choix et duel (6 à 8 pour choix, exactement 2 pour duel)
    { "id": "chocolat", "label": "le gâteau au chocolat", "emoji": "🍫" }
  ]
}
```

### 8.4 Les quatre types
| Type | Questionnaire | Quiz | Vrai/faux | Qui a répondu ça ? | Rafale |
|---|---|---|---|---|---|
| `choix` | Grille de 6 à 8 choix illustrés (+ « Autre… » dès 9 ans si `autre`) | 4 propositions (ou validation orale si « Autre… ») | ✔ | ✔ (réponses uniques) | ✔ |
| `duel` | 2 cartes | 2 propositions | ✔ | ✘ | ✔ |
| `membre` | Choix d'un membre de la famille | Avatars | ✔ | ✘ | ✔ |
| `libre` | Champ texte (dès 9 ans uniquement) | Réponse orale, validée par la personne visée | ✘ | ✔ | ✘ |

Une question `membre` n'est proposée que s'il y a au moins 3 joueurs enregistrés.

### 8.5 Repères à remplacer dans les phrases
Dans `quiz` et `affirmation`, les repères désignent **la personne visée**. Dans `questionnaire`, ils désignent **le joueur qui répond**.

| Repère | Masculin | Féminin | Remarque |
|---|---|---|---|
| `{nom}` | Paul | Emma | Le nom tel que saisi |
| `{de_nom}` | de Paul | de Chloé / **d'**Emma | Élision devant une voyelle ou un h |
| `{a_nom}` | à Paul | à Chloé | |
| `{il}` / `{Il}` | il / Il | elle / Elle | |
| `{s_il}` | s'il | si elle | |
| `{e}` | *(rien)* | e | Accords : « petit{e} » |
| `{reponse}` | | | Le libellé de la réponse, ou le texte libre |

**Règle importante :** dans `qui`, la personne est justement à deviner. Le champ ne contient donc **que `{reponse}`** : ni nom, ni pronom, ni accord.

### 8.6 Règles de rédaction
1. **Les libellés de choix s'intègrent dans une phrase.** On les écrit en minuscules, avec leur article, pour que `affirmation` et `qui` se lisent naturellement (« les crêpes », « un chien », « voler »). Sur les boutons, la première lettre est mise en majuscule automatiquement.
2. **Les libellés sont neutres** : pas de « je » ni de « mon », pas de forme masculine ou féminine (préférer « vétérinaire », « artiste » à « pompier » ou « danseuse »).
3. **Les questions des 6–8 ans** sont en phrases courtes, avec un vocabulaire simple et un emoji parlant pour chaque choix.
4. **Le ton** est complice et drôle, jamais gênant ni moqueur. Pas de sujets sensibles : poids, argent du foyer, conflits, santé.
5. Chaque phrase `quiz` est **correcte à voix haute**, car elle sera lue par la synthèse vocale.
6. Les choix d'une même question sont **plausibles pour tous les âges ciblés**, pour que les mauvaises réponses restent crédibles.

---

## 9. Données enregistrées sur la tablette

La banque de questions est un fichier JSON livré avec l'application, en lecture seule. Le reste est stocké dans le navigateur (IndexedDB).

| Table | Champs principaux |
|---|---|
| `joueurs` | id, nom, emoji, anneeNaissance, role, couleur, creeLe |
| `reponses` | id, joueurId, questionId, choixId *ou* texte *ou* membreId, date, passee (oui/non) |
| `historique` | id, partieId, questionId, sujetId, joueurActifId, manche, correct, date |
| `parties` | id, date, joueurs[], mode, equipes, duree, scores, terminee, etatEnCours (pour reprendre) |
| `reglages` | son, musique, voix, vitesseVoix, dureeParDefaut |

---

## 10. Exigences techniques

- **PWA** : manifeste (nom, icônes, plein écran, **portrait**) et service worker qui met tout en cache (application, banque de questions, sons, polices) pour un fonctionnement **100 % hors ligne**.
- **Hébergement statique** en HTTPS (GitHub Pages ou Netlify, gratuits), uniquement pour l'installation et les mises à jour.
- **Pile technique proposée** : Svelte et Vite.
  - Svelte intègre des transitions et animations très adaptées à l'ambiance plateau.
  - vite-plugin-pwa génère la partie hors ligne.
  - Dexie (ou idb) gère le stockage local.
  - canvas-confetti pour les confettis.
  - Web Audio pour les sons, Web Speech pour la voix.
- **API du navigateur utilisées** : écran toujours allumé (Wake Lock), plein écran, vibrations, synthèse vocale en français, stockage persistant (demandé au premier lancement).
- **Fluidité** : animations limitées aux déplacements, changements de taille et transparence, pour viser 60 images par seconde.
- **Vie privée** : aucune donnée ne quitte la tablette, aucune statistique d'usage, aucun service tiers une fois l'application installée.

---

## 11. Critères d'acceptation (extraits)

- Un enfant de 7 ans remplit son questionnaire seul, sans rien avoir à écrire.
- Une partie normale à 4 joueurs dure entre 15 et 20 minutes.
- En mode équipes, aucune question ne porte sur un coéquipier.
- Une réponse libre est toujours validée par la personne visée, jamais automatiquement.
- La tablette en mode avion permet de jouer une partie complète.
- Si l'application se ferme en pleine partie, on peut la reprendre au même endroit.
- Aucune paire question et personne visée n'est reposée lors des 3 parties suivantes, si la matière suffit.

---

## 12. Découpage en lots

| Lot | Contenu |
|---|---|
| **1 · Socle** | Projet PWA, installation, hors ligne, joueurs (fiches et galerie), stockage, chargement de la banque, réglages |
| **2 · Questionnaire** | Passage de relais, 4 formats de réponse, règles de sélection, mises à jour « toujours vrai ? » |
| **3 · Émission, partie 1** | Nouvelle partie, modes et équipes, tour de table, manches 1 et 2, validation orale, scores |
| **4 · Émission, partie 2** | Manches 3 et 4, podium et titres, pause et reprise |
| **5 · Ambiance** | Mascotte, générique, transitions, sons, voix, vibrations, décors |
| **6 · Contenu** | Banque complète d'environ 1000 questions (après validation de l'échantillon) |

---

## 13. Points ouverts et évolutions possibles

- **Nom de la mascotte** et son style visuel.
- **Nom définitif du jeu** (« Family Quiz » pour l'instant).
- **Réponse « Autre… » dans un QCM** : proposée en validation orale, pour que la réponse libre ne se repère pas au milieu des choix types. Cette décision peut changer.
- **Bonus complicité** : faut-il le garder ? Avec combien de points ?
- **Évolutions possibles** :
  - rôles `papi` et `mamie` ;
  - équipes composées à la main ;
  - questions rédigées par la famille ;
  - statistiques « qui connaît le mieux qui » sur plusieurs parties.
