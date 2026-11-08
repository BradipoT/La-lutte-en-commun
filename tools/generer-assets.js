const fs = require('fs');
const path = require('path');

global.window = {};
require(path.join(__dirname, '..', 'js', 'data.js'));
const data = global.window.GAME_DATA;

const POSES = ['debout', 'marche', 'pointe', 'pointeMarche', 'protege'];
const ACCENTS = ['#222', '#5d4037', '#37474f', '#4a148c', '#004d40', '#bf360c', '#1a237e', '#3e2723'];

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

function svgPerso(couleur, pose, accent) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" width="120" height="160">'
    + '<g stroke="' + couleur + '" stroke-width="9" stroke-linecap="round" fill="none">'
    + '<path d="' + jambes(pose) + '"/>'
    + '<path d="' + bras(pose) + '"/>'
    + '</g>'
    + '<rect x="46" y="32" width="24" height="62" rx="9" fill="' + couleur + '"/>'
    + '<circle cx="60" cy="18" r="14" fill="' + couleur + '"/>'
    + '<path d="M72 13 L84 19 L72 25 Z" fill="' + couleur + '"/>'
    + '<path d="M47 10 Q60 -4 76 12" stroke="' + accent + '" stroke-width="6" stroke-linecap="round" fill="none"/>'
    + '</svg>\n';
}

const persos = data.heroes.concat(data.boss);
persos.forEach((p, idx) => {
  const dir = path.join(__dirname, '..', 'assets', 'personnages', p.id);
  fs.mkdirSync(dir, { recursive: true });
  POSES.forEach(pose => {
    fs.writeFileSync(path.join(dir, pose + '.svg'), svgPerso(p.couleur, pose, ACCENTS[idx % ACCENTS.length]));
  });
});

console.log('Assets générés : ' + persos.length + ' personnages x ' + POSES.length + ' poses = ' + (persos.length * POSES.length) + ' fichiers');
