window.GAME_DATA = {
  heroes: [
    { id: 'guette', nom: 'Clémence Guetté', couleur: '#e74c3c', vitesse: 270, degats: 14, phrase: 'Point programmatique !' },
    { id: 'panot', nom: 'Mathilde Panot', couleur: '#9b59b6', vitesse: 255, degats: 15, phrase: 'Assemblée citoyenne !' },
    { id: 'balayoko', nom: 'Bally Bagayoko', couleur: '#3498db', vitesse: 290, degats: 13, phrase: 'Service public !' },
    { id: 'melenchon', nom: 'Jean-Luc Mélenchon', couleur: '#e67e22', vitesse: 245, degats: 17, phrase: 'Le programme en action !' }
  ],

  boss: [
    { id: 'glucksmann', nom: 'Raphaël Glucksmann', pv: 80, degats: 7, phrase: 'Argument factice !', couleur: '#7f8c8d', vitesse: 130, cadence: 2800, reflexe: 0.08 },
    { id: 'valet', nom: 'Matthieu Valet', pv: 120, degats: 10, phrase: 'Fake news !', couleur: '#5d6d7e', vitesse: 145, cadence: 2200, reflexe: 0.15, bulles: { cadence: 2200, degats: 5 }, avertissement: 'Attention ! Il a mangé du shampoing et peut cracher des bulles.' },
    { id: 'praud', nom: 'Pascal Praud', pv: 135, degats: 11, phrase: 'Stéréotype raciste !', couleur: '#8e44ad', vitesse: 160, cadence: 2000, reflexe: 0.20 },
    { id: 'philippe', nom: 'Édouard Philippe', pv: 150, degats: 13, phrase: 'Réforme injuste !', couleur: '#2e86c1', vitesse: 175, cadence: 1900, reflexe: 0.25 },
    { id: 'retailleau', nom: 'Bruno Retailleau', pv: 170, degats: 14, phrase: 'Discours sécuritaire !', couleur: '#1a5276', vitesse: 190, cadence: 1800, reflexe: 0.30 },
    { id: 'saintcricq', nom: 'Nathalie Saint-Cricq', pv: 185, degats: 15, phrase: 'Commentaire orienté !', couleur: '#117864', vitesse: 205, cadence: 1700, reflexe: 0.35 },
    { id: 'attal', nom: 'Gabriel Attal', pv: 200, degats: 16, phrase: 'Jeune et déconnecté !', couleur: '#b9770e', vitesse: 220, cadence: 1600, reflexe: 0.40 },
    { id: 'lepen', nom: 'Marine Le Pen', pv: 220, degats: 14, phrase: 'Discours de haine !', couleur: '#922b21', vitesse: 240, cadence: 1700, reflexe: 0.40, echelle: 1.25, bossFinal: true }
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
