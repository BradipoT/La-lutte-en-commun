// diagnostic : affiche les erreurs JS à l'écran (utile sur mobile)
window.addEventListener('error', e => {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#c0392b;color:#fff;padding:8px;z-index:9999;font:12px monospace;white-space:pre-wrap';
  d.textContent = 'Erreur JS: ' + e.message + ' (' + (e.filename || '').split('/').pop() + ':' + e.lineno + ')';
  document.body.appendChild(d);
});

const canvas = document.getElementById('jeu');
const ctx = canvas.getContext('2d');
const W = 960;
const H = 540;
const SOL = H - 70;
const GRAV = 1800;
const VITESSE_TIR = 460;
const VITESSE_TIR_BOSS = 400;
const data = window.GAME_DATA;
const VERSION = 124;

const POSES = ['debout', 'marche', 'marche2', 'pointe', 'pointeMarche', 'protege', 'brasCiel'];
const imagesPersos = {};

function chargerImages() {
  if (typeof Image === 'undefined') return;
  const imgF = new Image();
  imgF.src = 'assets/intro/fantome.png?v=' + VERSION;
  imagesPersos['fantome-debout'] = imgF;
  data.heroes.concat(data.boss).concat([data.fantome]).forEach(p => {
    POSES.forEach(pose => {
      const img = new Image();
      img.src = 'assets/personnages/' + p.id + '/' + pose + '.svg?v=' + VERSION;
      imagesPersos[p.id + '_' + pose] = img;
    });
  });
}

let etat = 'titre';
let indexBoss = 0;
let herosChoisi = 0;
let disponibles = [true, true, true, true];
let melenchonDebloque = false;

const NIVEAUX = {
  facile: { pv: 0.6, degats: 0.6, cadence: 1.5, reflexe: 0.5, pvJoueur: 150 },
  moyen: { pv: 0.8, degats: 0.8, cadence: 1.25, reflexe: 0.75, pvJoueur: 135 },
  dur: { pv: 1, degats: 1, cadence: 1, reflexe: 1, pvJoueur: 120 }
};
let niveau = 'dur';
let statsEnCours = 0;
let joueur = null;
let boss = null;
let projectiles = [];
let dernierTir = 0;
let dernierSpecial = 0;
let phraseJ = '', phraseJT = 0, phraseB = '', phraseBT = 0;
let prochainBulle = 0;
let prochainBracelet = 0;
let prochainSpeBoss = 0;
let prochainChargeBoss = 0;
let appuiTirDebut = 0;
let finEnAttente = null;
let combatFantome = false;
let prochainBombe = 0;
let explosions = [];
let seqFantome = null;
const LIGNES_FANTOME = ['Par bleu', 'Des forces obscures semblent être à l’œuvre', 'Vous avez réveillé…', 'LE FANTÔME DE JEAN MARIE'];
let sonLoup = null;
try { sonLoup = new Audio('assets/sons/loup.mp3?v=' + VERSION); } catch (e) {}
let ondes = [];
const PORTEE_ATTAQUE = 240;
let dernierSpeciale = 0;
const COOLDOWN_SPE = 8000;
const DUREE_CAST = 700;
const PORTEE_SPE = 480;
let annonce = null;
let shakeJusqua = 0;
const SHAKE_MAG = 4;
let prochainTirBoss = 0;
let messageJ = '', messageJT = 0, messageB = '', messageBT = 0;
const touches = { gauche: false, droite: false };

function element(id) {
  return document.getElementById(id);
}

function cacherTout() {
  ['ecran-titre', 'ecran-intro1', 'ecran-intro2', 'ecran-intro3', 'ecran-aide', 'ecran-heros', 'ecran-stats', 'ecran-arrivee', 'ecran-melenchon', 'ecran-fantome-intro', 'ecran-fantome-gagne', 'ecran-versus', 'ecran-recompense', 'ecran-defaite', 'ecran-perdu', 'ecran-victoire', 'ecran-pause', 'controles']
    .forEach(id => { const el = element(id); if (el) el.classList.add('cache'); });
}

function montrer(id) {
  cacherTout();
  const el = element(id);
  if (el) el.classList.remove('cache');
}

function creerCombattant(def, x, estBoss) {
  const echelle = def.echelle || 1;
  const f = NIVEAUX[niveau];
  const pv = estBoss ? Math.round(def.pv * f.pv) : (def.stats ? def.stats.pv : f.pvJoueur);
  return {
    def: def, stats: Object.assign({}, def.stats || {}), x: x, y: SOL, vy: 0,
    largeur: 46 * echelle, hauteur: 92 * echelle,
    hp: pv, maxHp: pv, onGround: true, echelle: echelle, estBoss: estBoss,
    phase: null, phaseJusqua: 0, action: null, actionT: 0, enMouvement: false,
    etourdiJusqua: 0, confusJusqua: 0, toucheJusqua: 0, tombeJusqua: 0, gagneJusqua: 0, cast: null, castCharge: 0, buffJusqua: 0, bloqueJusqua: 0, antiReflexeJusqua: 0, flameJusqua: 0
  };
}
