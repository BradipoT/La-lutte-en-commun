window.GAME_DATA = {
  heroes: [
    { id: 'guette', nom: 'Clémence Guetté', couleur: '#e74c3c', vitesse: 270, degats: 14,
      arguments: [
        'Si vous n’augmentez pas les salaires, vous aurez la récession.',
        'La précarité n’est pas un choix de vie.',
        'Taxez les riches, pas les pauvres.'
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
        'Un hôpital fermé, ce sont des vies en danger.'
      ] },
    { id: 'melenchon', nom: 'Jean-Luc Mélenchon', couleur: '#e67e22', vitesse: 245, degats: 17,
      arguments: [
        'L’argent magique existe… pour les riches.',
        'Travailler plus pour gagner moins ? Non merci.',
        'La planète n’a pas de plan B.'
      ] }
  ],

  boss: [
    { id: 'glucksmann', nom: 'Raphaël Glucksmann', pv: 80, degats: 7, couleur: '#7f8c8d', vitesse: 130, cadence: 2800, reflexe: 0.08,
      arguments: [
        { t: 'Argument factice !', r: 'Vos « arguments » tiennent plus du communiqué de presse que du débat.' },
        { t: 'Il faut moins d’État !', r: 'Ah oui, moins d’État… sauf quand il s’agit de sauver les banques.' }
      ] },
    { id: 'valet', nom: 'Matthieu Valet', pv: 120, degats: 10, couleur: '#5d6d7e', vitesse: 145, cadence: 2200, reflexe: 0.15,
      bulles: { cadence: 2200, degats: 5 },
      avertissement: 'Attention ! Il a mangé du shampoing et peut cracher des bulles.',
      arguments: [
        { t: 'Fake news !', r: 'D’accord, mais avouez que votre dernière intox était plus fake que news.' },
        { t: 'La gauche dépense trop !', r: 'Oui, surtout en cadeaux fiscaux pour les plus riches.' }
      ] },
    { id: 'praud', nom: 'Pascal Praud', pv: 135, degats: 11, couleur: '#8e44ad', vitesse: 160, cadence: 2000, reflexe: 0.20,
      arguments: [
        { t: 'Stéréotype raciste !', r: 'Un stéréotype ? Dommage, la réalité fait déjà le travail gratuitement.' },
        { t: 'Il faut plus de sécurité !', r: 'Plus de sécurité, c’est surtout plus de ras-le-bol social sous le tapis.' }
      ] },
    { id: 'philippe', nom: 'Édouard Philippe', pv: 150, degats: 13, couleur: '#2e86c1', vitesse: 175, cadence: 1900, reflexe: 0.25,
      arguments: [
        { t: 'Réforme injuste !', r: 'Tellement injuste qu’elle a surtout… majoritairement des opposants.' },
        { t: 'Il faut réformer les retraites !', r: 'Réformer les retraites des autres, manifestement.' }
      ] },
    { id: 'retailleau', nom: 'Bruno Retailleau', pv: 170, degats: 14, couleur: '#1a5276', vitesse: 190, cadence: 1800, reflexe: 0.30,
      arguments: [
        { t: 'Discours sécuritaire !', r: 'Sécuritaire, oui… contre les pauvres surtout.' },
        { t: 'L’ordre avant tout !', r: 'L’ordre avant tout, sauf quand il s’agit d’ordonner les dividendes.' }
      ] },
    { id: 'saintcricq', nom: 'Nathalie Saint-Cricq', pv: 185, degats: 15, couleur: '#117864', vitesse: 205, cadence: 1700, reflexe: 0.35,
      arguments: [
        { t: 'Commentaire orienté !', r: 'Orienté, peut-être, mais au moins il vise dans le bon sens.' },
        { t: 'Vous dramatisez !', r: 'Dramatiser la crise climatique ? On verra ce qu’en pensent les sinistrés.' }
      ] },
    { id: 'attal', nom: 'Gabriel Attal', pv: 200, degats: 16, couleur: '#b9770e', vitesse: 220, cadence: 1600, reflexe: 0.40,
      arguments: [
        { t: 'Jeune et déconnecté !', r: 'Déconnecté, non : juste pas branché sur vos combines.' },
        { t: 'Il faut baisser les impôts !', r: 'Baisser les impôts des autres, évidemment.' }
      ] },
    { id: 'lepen', nom: 'Marine Le Pen', pv: 220, degats: 14, couleur: '#922b21', vitesse: 240, cadence: 1700, reflexe: 0.40, echelle: 1.25, bossFinal: true,
      arguments: [
        { t: 'Discours de haine !', r: 'La haine, c’est surtout celle que vous semez contre les étrangers.' },
        { t: 'Priorité aux Français !', r: 'Priorité aux Français… sauf pour la fraude fiscale à l’étranger.' }
      ] }
  ],

  recompenses: [
    'Vous avez gagné : le SMIC à 1 700 € net !',
    'Vous avez gagné : la retraite à 60 ans !',
    'Vous avez gagné : le blocage des prix des produits de première nécessité !',
    'Vous avez gagné : la planification écologique !',
    'Vous avez gagné : la 6ème semaine de congés payés !',
    'Vous avez gagné : l’augmentation générale des salaires !',
    'Vous avez gagné : le revenu étudiant à 1 200 € !',
    'Vous avez gagné : le grand service public de la santé et de l’éducation !'
  ]
};
