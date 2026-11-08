const fs = require('fs');
const path = require('path');

global.window = {};
require(path.join(__dirname, '..', 'js', 'data.js'));
const data = global.window.GAME_DATA;

const POSES = ['debout', 'marche', 'marche2', 'pointe', 'pointeMarche', 'protege', 'brasCiel'];

const TRAITS = {
  guette:      { sexe: 'f', cheveux: '#4e342e', longueur: 'longs',    teint: '#f0c8aa', lunettes: false, barbe: null },
  panot:       { sexe: 'f', cheveux: '#e8c96a', longueur: 'mi-longs', teint: '#e8b48c', lunettes: false, barbe: null },
  balayoko:    { sexe: 'h', cheveux: '#1a1a1a', longueur: 'courts',  teint: '#6b4226', lunettes: false, barbe: '#1a1a1a' },
  bompard:     { sexe: 'h', cheveux: '#3e2723', longueur: 'courts',  teint: '#e8b48c', lunettes: false, barbe: '#3e2723' },
  melenchon:   { sexe: 'h', cheveux: '#cfcfcf', longueur: 'courts',  teint: '#f0c8aa', lunettes: false, barbe: '#cfcfcf' },
  glucksmann:  { sexe: 'h', cheveux: '#6d4c2f', longueur: 'courts',  teint: '#f0c8aa', lunettes: true,  barbe: null },
  valet:       { sexe: 'h', cheveux: '#3e2723', longueur: 'courts',  teint: '#d9a066', lunettes: false, barbe: null },
  praud:       { sexe: 'h', cheveux: '#9e9e9e', longueur: 'courts',  teint: '#f0c8aa', lunettes: true,  barbe: null },
  philippe:    { sexe: 'h', cheveux: '#8d8d8d', longueur: 'courts',  teint: '#f0c8aa', lunettes: false, barbe: '#8d8d8d' },
  retailleau:  { sexe: 'h', cheveux: '#e0e0e0', longueur: 'courts',  teint: '#f0c8aa', lunettes: false, barbe: null },
  saintcricq:  { sexe: 'f', cheveux: '#c8a24a', longueur: 'mi-longs', teint: '#f5d0b0', lunettes: false, barbe: null },
  attal:       { sexe: 'h', cheveux: '#4e342e', longueur: 'courts',  teint: '#f0c8aa', lunettes: false, barbe: null },
  lepen:       { sexe: 'f', cheveux: '#e8c96a', longueur: 'mi-longs', teint: '#f5d0b0', lunettes: false, barbe: null, bracelet: true }
};

const PANTS = '#282846';
const SHIRT = '#f5f5f5';
const EYE = '#1e1e1e';

function jambes(pose) {
  if (pose === 'marche' || pose === 'pointeMarche') {
    return 'M60 100 L85 182 M60 100 L38 182';
  }
  return 'M60 100 L68 182 M60 100 L52 182';
}

function braceletElectronique() {
  return '<ellipse cx="68" cy="176" rx="7" ry="4" fill="#8e44ad" stroke="#5b2c6f" stroke-width="2"/>'
    + '<circle cx="68" cy="176" r="1.6" fill="#ff5252"/>';
}

function bras(pose) {
  if (pose === 'pointe' || pose === 'pointeMarche') return { path: 'M56 52 L95 48 M95 48 L108 48', hand: [107, 48] };
  if (pose === 'protege') return { path: 'M50 56 L76 74 M50 74 L76 56', hand: null };
  if (pose === 'marche') return { path: 'M56 52 L74 76', hand: null };
  if (pose === 'marche2') return { path: 'M56 52 L40 78', hand: null };
  if (pose === 'brasCiel') return { path: 'M56 52 L44 18 M56 52 L74 20', hand: null };
  return { path: 'M56 52 L62 92', hand: [62, 94] };
}

function cheveuxDessus(t) {
  if (t.longueur === 'longs') return 'M50 18 L63 8 L78 20 L76 26 L63 18 L52 26 Z';
  if (t.longueur === 'mi-longs') return 'M49 16 L63 7 L79 18 L77 28 L63 20 L51 28 Z';
  return 'M49.1 24 A14 14 0 0 1 76.9 24 Z';
}

function cheveuxDerriere(t) {
  if (t.longueur === 'longs') return 'M42 22 Q60 8 80 20 L86 70 Q78 95 60 88 L44 80 Z';
  if (t.longueur === 'mi-longs') return 'M44 22 Q60 9 78 21 L82 48 Q72 60 60 56 L46 50 Z';
  return null;
}

function lunettes() {
  return '<g stroke="#222" stroke-width="2.5" fill="none">'
    + '<circle cx="55" cy="18" r="6"/><circle cx="67" cy="18" r="6"/>'
    + '<path d="M61 18 L63 18 M49 17 L44 15 M73 17 L78 15"/></g>';
}

function barbe(couleur) {
  return '<path d="M47 25 Q60 46 75 25 Q73 40 60 42 Q49 40 47 25 Z" fill="' + couleur + '"/>';
}

function svgPerso(couleur, pose, t) {
  const b = bras(pose);
  const derriere = cheveuxDerriere(t);
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 200" width="120" height="200">'
    + (derriere ? '<path d="' + derriere + '" fill="' + t.cheveux + '"/>' : '')
    + '<g stroke="' + PANTS + '" stroke-width="7" stroke-linecap="round" fill="none"><path d="' + jambes(pose) + '"/></g>'
    + '<path d="M48 42 L74 42 L78 102 L44 102 Z" fill="' + couleur + '"/>'
    + '<path d="M58 42 L66 42 L62 66 Z" fill="' + SHIRT + '"/>'
    + '<g stroke="' + couleur + '" stroke-width="6" stroke-linecap="round" fill="none"><path d="' + b.path + '"/></g>'
    + (b.hand ? '<circle cx="' + b.hand[0] + '" cy="' + b.hand[1] + '" r="3" fill="' + t.teint + '"/>' : '')
    + '<circle cx="63" cy="26" r="14" fill="' + t.teint + '"/>'
    + '<path d="M75 24 L84 29 L75 33 Z" fill="' + t.teint + '"/>'
    + '<path d="' + cheveuxDessus(t) + '" fill="' + t.cheveux + '"/>'
    + '<circle cx="68" cy="25" r="1.8" fill="' + EYE + '"/>'
    + (t.lunettes ? lunettes() : '')
    + (t.barbe ? barbe(t.barbe) : '')
    + (t.bracelet ? braceletElectronique() : '')
    + '</svg>\n';
}

const persos = data.heroes.concat(data.boss);
persos.forEach(p => {
  const t = TRAITS[p.id] || { sexe: 'h', cheveux: '#333', longueur: 'courts', teint: '#f0c8aa', lunettes: false, barbe: null };
  const dir = path.join(__dirname, '..', 'assets', 'personnages', p.id);
  fs.mkdirSync(dir, { recursive: true });
  POSES.forEach(pose => {
    fs.writeFileSync(path.join(dir, pose + '.svg'), svgPerso(p.couleur, pose, t));
  });
});

console.log('Assets générés : ' + persos.length + ' personnages x ' + POSES.length + ' poses = ' + (persos.length * POSES.length) + ' fichiers');
