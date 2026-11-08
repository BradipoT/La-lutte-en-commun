window.GAME_DATA = {
  heroes: [
    { id: 'guette', nom: 'Clémence Guetté', couleur: '#e74c3c', vitesse: 270, degats: 14, phrase: 'Point programmatique !' },
    { id: 'panot', nom: 'Mathilde Panot', couleur: '#9b59b6', vitesse: 255, degats: 15, phrase: 'Assemblée citoyenne !' },
    { id: 'balayoko', nom: 'Badi Balayoko', couleur: '#3498db', vitesse: 290, degats: 13, phrase: 'Service public !' },
    { id: 'melenchon', nom: 'Jean-Luc Mélenchon', couleur: '#e67e22', vitesse: 245, degats: 17, phrase: 'Le programme en action !' }
  ],

  boss: [
    { nom: 'Raphaël Glucksmann', pv: 70, degats: 6, phrase: 'Argument factice !', couleur: '#7f8c8d', vitesse: 130, cadence: 3000, reflexe: 0.06 },
    { nom: 'Matthieu Valet', pv: 80, degats: 7, phrase: 'Fake news !', couleur: '#5d6d7e', vitesse: 145, cadence: 2800, reflexe: 0.08 },
    { nom: 'Pascal Praud', pv: 95, degats: 8, phrase: 'Stéréotype raciste !', couleur: '#8e44ad', vitesse: 160, cadence: 2600, reflexe: 0.12 },
    { nom: 'Édouard Philippe', pv: 110, degats: 9, phrase: 'Réforme injuste !', couleur: '#2e86c1', vitesse: 175, cadence: 2400, reflexe: 0.16 },
    { nom: 'Bruno Retailleau', pv: 125, degats: 10, phrase: 'Discours sécuritaire !', couleur: '#1a5276', vitesse: 190, cadence: 2300, reflexe: 0.20 },
    { nom: 'Nathalie Saint-Cricq', pv: 140, degats: 10, phrase: 'Commentaire orienté !', couleur: '#117864', vitesse: 205, cadence: 2200, reflexe: 0.25 },
    { nom: 'Gabriel Attal', pv: 150, degats: 11, phrase: 'Jeune et déconnecté !', couleur: '#b9770e', vitesse: 220, cadence: 2200, reflexe: 0.30 },
    { nom: 'Marine Le Pen', pv: 240, degats: 15, phrase: 'Discours de haine !', couleur: '#922b21', vitesse: 240, cadence: 1600, reflexe: 0.45, echelle: 1.25, bossFinal: true }
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
