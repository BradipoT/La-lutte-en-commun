const fs = require('fs');
const path = require('path');

global.window = {};
require(path.join(__dirname, '..', 'js', 'data.js'));
const data = global.window.GAME_DATA;

const POSES = ['debout', 'marche', 'pointe', 'pointeMarche', 'protege'];

const TRAITS = {
  guette:      { sexe: 'f', cheveux: '#4e342e', longueur: 'longs',  lunettes: false, barbe: false },
  panot:       { sexe: 'f', cheveux: '#2e1a12', longueur: 'mi-longs', lunettes: false, barbe: false },
  balayoko:    { sexe: 'h', cheveux: '#1a1a1a', longueur: 'courts',  lunettes: false, barbe: true },
  melenchon:   { sexe: 'h', cheveux: '#cfcfcf', longueur: 'courts',  lunettes: false, barbe: true },
  glucksmann:  { sexe: 'h', cheveux: '#6d4c2f', longueur: 'courts',  lunettes: true,  barbe: false },
  valet:       { sexe: 'h', cheveux: '#3e2723', longueur: 'courts',  lunettes: false, barbe: false },
  praud:       { sexe: 'h', cheveux: '#9e9e9e', longueur: 'courts',  lunettes: true,  barbe: false },
  philippe:    { sexe: 'h', cheveux: '#8d8d8d', longueur: 'courts',  lunettes: false, barbe: true },
  retailleau:  { sexe: 'h', cheveux: '#e0e0e0', longueur: 'courts',  lunettes: false, barbe: false },
  saintcricq:  { sexe: 'f', cheveux: '#c8a24a', longueur: 'mi-longs', lunettes: false, barbe: false },
  attal:       { sexe: 'h', cheveux: '#4e342e', longueur: 'courts',  lunettes: false, barbe: false },
  lepen:       { sexe: 'f', cheveux: '#e8c96a', longueur: 'mi-longs', lunettes: false, barbe: false }
};

function jambes(pose) {
  if (pose === 'marche' || pose === 'pointeMarche') {
    return 'M55 92 L80 152 M55 92 L36 155';
  }
  return 'M55 92 L64 155 M55 92 L48 155';
}

function bras(pose) {
  if (pose === 'pointe' || pose === 'pointeMarche') {
    return 'M54 46 L92 42 L106 42';
  }
  if (pose === 'protege') {
    return 'M46 52 L74 72 M46 72 L74 52';
  }
  if (pose === 'marche') {
    return 'M54 46 L72 72';
  }
  return 'M54 46 L61 88';
}

function cheveux(t) {
  if (t.longueur === 'longs') {
    return '<path d="M44 6 Q60 -6 78 8 L82 60 Q60 70 40 58 Z" fill="' + t.cheveux + '"/>';
  }
  if (t.longueur === 'mi-longs') {
    return '<path d="M46 8 Q60 -4 76 10 L78 44 Q60 52 44 42 Z" fill="' + t.cheveux + '"/>';
  }
  return '<path d="M47 10 Q60 -4 75 12 L74 20 Q60 12 48 18 Z" fill="' + t.cheveux + '"/>';
}

function lunettes() {
  return '<g stroke="#222" stroke-width="2.5" fill="none">'
    + '<circle cx="55" cy="18" r="6"/><circle cx="67" cy="18" r="6"/>'
    + '<path d="M61 18 L63 18 M49 17 L44 15 M73 17 L78 15"/></g>';
}

function barbe() {
  return '<path d="M50 26 Q60 38 72 26 Q70 34 60 36 Q52 34 50 26 Z" fill="#9e9e9e"/>';
}

function svgPerso(couleur, pose, traits) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" width="120" height="160">'
    + cheveux(traits)
    + '<g stroke="' + couleur + '" stroke-width="9" stroke-linecap="round" fill="none">'
    + '<path d="' + jambes(pose) + '"/>'
    + '<path d="' + bras(pose) + '"/>'
    + '</g>'
    + '<rect x="46" y="32" width="24" height="62" rx="9" fill="' + couleur + '"/>'
    + '<circle cx="60" cy="18" r="14" fill="' + couleur + '"/>'
    + '<path d="M72 13 L84 19 L72 25 Z" fill="' + couleur + '"/>'
    + (traits.lunettes ? lunettes() : '')
    + (traits.barbe ? barbe() : '')
    + '</svg>\n';
}

const persos = data.heroes.concat(data.boss);
persos.forEach(p => {
  const traits = TRAITS[p.id] || { sexe: 'h', cheveux: '#333', longueur: 'courts', lunettes: false, barbe: false };
  const dir = path.join(__dirname, '..', 'assets', 'personnages', p.id);
  fs.mkdirSync(dir, { recursive: true });
  POSES.forEach(pose => {
    fs.writeFileSync(path.join(dir, pose + '.svg'), svgPerso(p.couleur, pose, traits));
  });
});

console.log('Assets générés : ' + persos.length + ' personnages x ' + POSES.length + ' poses = ' + (persos.length * POSES.length) + ' fichiers');
