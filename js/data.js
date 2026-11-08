window.GAME_DATA = {
  heroes: [
    { id: 'guette', nom: 'Clémence Guetté', couleur: '#e74c3c', vitesse: 270, degats: 14,
      arguments: [
        'La précarité n’est pas un choix de vie.',
        'Taxez les riches, pas les pauvres.',
        'Un SMIC à 1 700 €, c’est possible.'
      ] },
    { id: 'panot', nom: 'Mathilde Panot', couleur: '#9b59b6', vitesse: 255, degats: 15,
      arguments: [
        'La VIe République, c’est maintenant.',
        'Le peuple d’abord, les profits ensuite.',
        'Le 49.3, vous connaissez ?'
      ] },
    { id: 'balayoko', nom: 'Bally Bagayoko', couleur: '#3498db', vitesse: 290, degats: 13,
      arguments: [
        'Les services publics ne sont pas un coût, ce sont des droits.',
        'Un hôpital fermé, ce sont des vies en danger.',
        'Chaque quartier mérite son école publique.'
      ] },
    { id: 'melenchon', nom: 'Jean-Luc Mélenchon', couleur: '#e67e22', vitesse: 245, degats: 17,
      arguments: [
        'Si vous n’augmentez pas les salaires, vous aurez la récession.',
        'L’argent magique existe… pour les riches.',
        'La planète n’a pas de plan B.'
      ] }
  ],

  boss: [
    { id: 'glucksmann', nom: 'Raphaël Glucksmann', pv: 80, degats: 7, couleur: '#7f8c8d', vitesse: 130, cadence: 2800, reflexe: 0.08,
      arguments: [ { t: 'Il faut relancer la croissance !', r: 'Vos « arguments » tiennent plus du communiqué de presse que du débat.' },
        { t: 'L’Europe, c’est trop bureaucratique !', r: 'Oui, et la paperasse fiscale adore les paradis fiscaux.' },
        { t: 'Il faut taxer les multinationales !', r: 'Évidemment… après les avoir subventionnées, bien sûr.' } ] },
    { id: 'valet', nom: 'Matthieu Valet', pv: 120, degats: 10, couleur: '#5d6d7e', vitesse: 145, cadence: 2200, reflexe: 0.15,
      bulles: { cadence: 2200, degats: 5 },
      avertissement: 'Attention ! Il a mangé du shampoing et peut cracher des bulles.',
      arguments: [ { t: 'Fake news !', r: 'D’accord, mais avouez que votre dernière intox était plus fake que news.' },
        { t: 'Les journalistes sont tous de gauche !', r: 'Tous ? Même ceux qui vous servent de micro ?' },
        { t: 'Il faut moins d’impôts pour les entreprises !', r: 'Surtout pour celles qui délocalisent, bien vu.' } ] },
    { id: 'praud', nom: 'Pascal Praud', pv: 135, degats: 11, couleur: '#8e44ad', vitesse: 160, cadence: 2000, reflexe: 0.20,
      arguments: [ { t: 'Il y a trop d’assistés en France !', r: 'Un stéréotype ? Dommage, la réalité fait déjà le travail gratuitement.' },
        { t: 'On ne peut plus rien dire !', r: 'Si, si : vous le faites très bien, justement.' },
        { t: 'La France va mal à cause des immigrés !', r: 'Ah bon ? Et pas à cause de l’évasion fiscale ?' } ] },
    { id: 'philippe', nom: 'Édouard Philippe', pv: 150, degats: 13, couleur: '#2e86c1', vitesse: 175, cadence: 1900, reflexe: 0.25,
      arguments: [ { t: 'Il faut réformer le pays en profondeur !', r: 'Tellement injuste qu’elle a surtout… majoritairement des opposants.' },
        { t: 'Il faut travailler plus !', r: 'Oui, surtout ceux qui ont déjà trois emplois.' },
        { t: 'Les 35h, c’est fini !', r: 'Les 35h… et les cadeaux fiscaux, aussi ?' } ] },
    { id: 'retailleau', nom: 'Bruno Retailleau', pv: 170, degats: 14, couleur: '#1a5276', vitesse: 190, cadence: 1800, reflexe: 0.30,
      arguments: [ { t: 'La France vit dans l’insécurité permanente !', r: 'Sécuritaire, oui… contre les pauvres surtout.' },
        { t: 'Il faut expulser les délinquants étrangers !', r: 'Et les délinquants en col blanc, on les garde ?' },
        { t: 'L’écologie, c’est du bobo-écolo !', r: 'Le bobo-écolo… comme les canicules ?' } ] },
    { id: 'saintcricq', nom: 'Nathalie Saint-Cricq', pv: 185, degats: 15, couleur: '#117864', vitesse: 205, cadence: 1700, reflexe: 0.35,
      arguments: [ { t: 'Vous êtes dans la posture, avouez !', r: 'Orienté, peut-être, mais au moins il vise dans le bon sens.' },
        { t: 'Vous n’êtes pas crédible !', r: 'Crédible, non : juste pas audible chez vous.' },
        { t: 'Ça manque de chiffres !', r: 'Des chiffres truqués, ce serait mieux ?' } ] },
    { id: 'attal', nom: 'Gabriel Attal', pv: 200, degats: 16, couleur: '#b9770e', vitesse: 220, cadence: 1600, reflexe: 0.40,
      arguments: [ { t: 'Vous êtes déconnecté de la réalité !', r: 'Déconnecté, non : juste pas branché sur vos combines.' },
        { t: 'Vous êtes vieux !', r: 'Vieux, mais avec une retraite assurée, contrairement à d’autres.' },
        { t: 'La jeunesse d’abord !', r: 'La jeunesse d’abord… pour les dividendes ?' } ] },
    { id: 'zemmour', nom: 'Éric Zemmour', pv: 210, degats: 15, couleur: '#2c3e50', vitesse: 235, cadence: 1700, reflexe: 0.42,
      arguments: [ { t: '« La ville des noires » !', r: 'Ça rend sourd… comme disait l’autre.' },
        { t: 'Le grand remplacement est en cours !', r: 'Ah, donc c’est pour ça que tout le monde part en vacances ?' },
        { t: 'Il faut défendre nos valeurs chrétiennes !', r: 'Comme l’accueil de l’étranger, donc.' } ] },
    { id: 'bardella', nom: 'Jordan Bardella', pv: 215, degats: 16, couleur: '#1f618d', vitesse: 245, cadence: 1650, reflexe: 0.43,
      arguments: [ { t: 'Mais où trouve-t-il toute cette énergie ?', r: 'J’aurais bien une réponse mais ce serait vulgaire.' },
        { t: 'L’Europe nous vole notre souveraineté !', r: 'Sans l’Europe, on l’aurait retrouvée… où déjà ?' },
        { t: 'Il faut arrêter les éoliennes !', r: 'Oui, le nucléaire… ah non, aussi ?' } ] },
    { id: 'lepen', nom: 'Marine Le Pen', pv: 220, degats: 14, couleur: '#922b21', vitesse: 240, cadence: 1700, reflexe: 0.40, echelle: 1.25, bossFinal: true,
      bracelet: { delai: 4000, portee: 320, vitesse: 650, etourdissement: 4000 },
      avertissement: '⚠️ Attention : son bracelet électronique à la cheville peut sonner ! Une onde rapide peut vous étourdir 4 secondes si elle vous touche.',
      arguments: [ { t: 'On n’en peut plus des délinquants !', r: 'Le bracelet ne serre pas trop la cheville, Marine ?' },
        { t: 'L’insécurité partout !', r: 'Partout, sauf dans les meetings bien protégés.' },
        { t: 'Il faut sortir de l’Europe !', r: 'Pratique pour les paradis fiscaux, en effet.' } ] }
  ],

  recompenses: [
    'Vous avez gagné : le SMIC à 1 700 € net !',
    'Vous avez gagné : la retraite à 60 ans !',
    'Vous avez gagné : le blocage des prix des produits de première nécessité !',
    'Vous avez gagné : la planification écologique !',
    'Vous avez gagné : la 6ème semaine de congés payés !',
    'Vous avez gagné : l’augmentation générale des salaires !',
    'Vous avez gagné : le revenu étudiant à 1 200 € !',
    'Vous avez gagné : le grand service public de la santé et de l’éducation !',
    'Vous avez gagné : le référendum d’initiative citoyenne (RIC) !',
    'Vous avez gagné : la sortie des énergies fossiles !'
  ]
};
