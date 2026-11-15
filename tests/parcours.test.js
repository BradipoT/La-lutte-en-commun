// Test automatisé du parcours joueur : titre -> niveau -> intro -> aide -> héros -> stats -> versus -> combat
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const racine = path.join(__dirname, '..');

const html = fs.readFileSync(path.join(racine, 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://localhost/' });
const w = dom.window;

w.Image = class { set src(v) { this.complete = true; this.naturalWidth = 1; } };
w.AudioContext = class {
  constructor() { this.currentTime = 0; this.destination = {}; }
  resume() {} suspend() {}
  createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
  createOscillator() { return { frequency: {}, type: '', connect() {}, start() {}, stop() {} }; }
  createBuffer() { return { getChannelData() { return new Float32Array(8); } }; }
  createBufferSource() { return { buffer: {}, connect() {}, start() {} }; }
  createBiquadFilter() { return { type: '', frequency: {}, connect() {} }; }
};
w.requestAnimationFrame = () => {};
w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: (t, p) => p === 'canvas' ? {} : () => new Proxy({}, { get: () => () => {} }) });

// comme dans le navigateur : tous les scripts partagent le même scope global
const sources = ['js/data.js', 'js/musique.js', 'js/core.js', 'js/sfx.js', 'js/combat.js', 'js/ui.js']
  .map(f => fs.readFileSync(path.join(racine, f), 'utf8')).join('\n;\n');
const erreurs = [];
try { w.eval(sources); } catch (e) { erreurs.push(e.message); }

function assert(cond, msg) { if (!cond) { console.error('ÉCHEC:', msg); process.exitCode = 1; } else console.log('OK:', msg); }

assert(erreurs.length === 0, 'chargement des 6 scripts sans erreur' + (erreurs.length ? ' -> ' + erreurs.join(' | ') : ''));

const clic = id => w.document.getElementById(id).click();
const visible = id => !w.document.getElementById(id).classList.contains('cache');

clic('btn-niv-dur');
clic('btn-i1'); clic('btn-i2'); clic('btn-i3'); clic('btn-aide-suivant');
assert(w.document.querySelectorAll('.carte-heros').length >= 4, 'au moins 4 cartes de camarades');
w.document.querySelectorAll('.carte-heros')[0].click();
assert(visible('ecran-stats'), 'fiche du camarade affichée');
clic('btn-choisir-stats');
assert(visible('ecran-versus'), 'écran versus affiché : ' + w.document.getElementById('vs-texte').textContent);
clic('btn-combat');
assert(visible('ecran-versus') === false, 'combat lancé (versus masqué)');
console.log(process.exitCode ? 'TEST ÉCHOUÉ' : 'TEST RÉUSSI');
