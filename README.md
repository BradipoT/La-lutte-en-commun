# ⚔️ La Marche vers l'Élysée

Petit jeu de combat 2D jouable sur smartphone (navigateur) : choisissez un héros LFI et battez les candidats de droite un par un, du moins au plus fort, en gagnant une grande mesure du programme à chaque victoire.

## Lancer le jeu

- Ouvrir `index.html` directement dans un navigateur, ou
- lancer un serveur local : `python3 -m http.server` puis ouvrir http://localhost:8000
- Activer **GitHub Pages** (Settings → Pages → branche `main`, dossier `/`) pour obtenir un lien jouable sur smartphone.

## Contrôles

- ◀ ▶ : se déplacer
- ⬆ : sauter (esquive les boules de feu)
- 🔥 : lancer sa boule de feu (« point programmatique »)
- 🛡 : pouvoir « ironie » — renvoie la boule de feu ennemie (dégâts ×1,5)

Clavier : flèches + Espace (tir) + Maj (pouvoir).

## Mécanique des camarades

Chaque héros n'a qu'une vie : si vous perdez un combat, votre camarade « tombe au combat » (grisé au choix suivant) et un autre héros reprend le flambeau au même boss. Si les 4 camarades tombent, c'est perdu — on revient au début.

## Modifier le contenu du jeu

Toutes les données (héros, boss, mesures gagnées, phrases, statistiques) sont dans `js/data.js` — un seul fichier à éditer, sans toucher au moteur du jeu (`js/game.js`).
