# Family Quiz

Le jeu télévisé de la famille, sur une tablette. Application web installable (PWA), 100 % hors ligne, sans compte ni serveur.
Le détail des règles et des choix est dans [CAHIER_DES_CHARGES.md](CAHIER_DES_CHARGES.md).

## Lancer le jeu sur l'ordinateur

Il faut [Node.js](https://nodejs.org) (version 20 ou plus).

```powershell
npm install
npm run dev
```

Le jeu s'ouvre sur `http://localhost:5173`. Grâce à l'option `--host`, il est aussi accessible depuis la tablette sur le même Wi-Fi, à l'adresse « Network » affichée dans le terminal (le mode hors ligne et l'installation ne fonctionnent alors pas : ils exigent le HTTPS).

## Installer le jeu sur la tablette

Le jeu est publié sur GitHub Pages : **https://drenaud1986.github.io/family-quiz/**

1. Sur la tablette, ouvrir cette adresse dans Chrome, puis menu ⋮ › **Installer l'application** (ou « Ajouter à l'écran d'accueil »).
2. Ouvrir le jeu une première fois avec Internet : ensuite, il fonctionne en mode avion.

### Publier une mise à jour

```powershell
npm run deployer
```

Cette commande vérifie la banque, compile le jeu et l'envoie sur la branche `gh-pages`. Le site est à jour une minute plus tard. La tablette récupère la nouvelle version toute seule à la prochaine ouverture avec Internet.

## La banque de questions

- 1000 questions, une catégorie par fichier dans `src/data/banque/`, une question par ligne.
- Le format est décrit au § 8 du cahier des charges.
- Après toute modification, vérifier la banque :
  ```powershell
  npm run verifier
  ```

## Organisation du code

| Dossier | Contenu |
|---|---|
| `src/ecrans/` | Les écrans : accueil, candidats, nouvelle partie, questionnaire, émission, réglages |
| `src/composants/` | Les pièces réutilisées : mascotte, plateau, chrono, grille de réponses, podium… |
| `src/lib/` | La logique : stockage (IndexedDB), sélection des questions, moteur de jeu, sons, voix |
| `src/styles/theme.css` | Toutes les couleurs, tailles et espacements |
| `src/data/` | Catégories et banque de questions |
| `scripts/` | Vérification de la banque |
