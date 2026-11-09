const canvas = document.getElementById('jeu');
const ctx = canvas.getContext('2d');
const W = 960;
const H = 540;
const SOL = H - 70;
const GRAV = 1800;
const VITESSE_TIR = 460;
const VITESSE_TIR_BOSS = 400;
const data = window.GAME_DATA;
const VERSION = 49;

const POSES = ['debout', 'marche', 'marche2', 'pointe', 'pointeMarche', 'protege', 'brasCiel'];
const imagesPersos = {};

function chargerImages() {
  if (typeof Image === 'undefined') return;
  data.heroes.concat(data.boss).forEach(p => {
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
let ondes = [];
const PORTEE_ATTAQUE = 240;
let dernierSpeciale = 0;
const COOLDOWN_SPE = 8000;
const DUREE_CAST = 1400;
const PORTEE_SPE = 480;
let annonce = null;
let prochainTirBoss = 0;
let messageJ = '', messageJT = 0, messageB = '', messageBT = 0;
const touches = { gauche: false, droite: false };

function element(id) {
  return document.getElementById(id);
}

function cacherTout() {
  ['ecran-titre', 'ecran-intro1', 'ecran-intro2', 'ecran-intro3', 'ecran-aide', 'ecran-heros', 'ecran-stats', 'ecran-versus', 'ecran-recompense', 'ecran-defaite', 'ecran-perdu', 'ecran-victoire', 'controles']
    .forEach(id => element(id).classList.add('cache'));
}

function montrer(id) {
  cacherTout();
  element(id).classList.remove('cache');
}

function creerCombattant(def, x, estBoss) {
  const echelle = def.echelle || 1;
  const f = NIVEAUX[niveau];
  const pv = estBoss ? Math.round(def.pv * f.pv) : (def.stats ? def.stats.pv : f.pvJoueur);
  return {
    def: def, x: x, y: SOL, vy: 0,
    largeur: 46 * echelle, hauteur: 92 * echelle,
    hp: pv, maxHp: pv, onGround: true, echelle: echelle, estBoss: estBoss,
    phase: null, phaseJusqua: 0, action: null, actionT: 0, enMouvement: false,
    etourdiJusqua: 0, confusJusqua: 0, cast: null, bloqueJusqua: 0, antiReflexeJusqua: 0, flameJusqua: 0
  };
}

function commencerCombat() {
  const f = NIVEAUX[niveau];
  const defBoss = Object.assign({}, data.boss[indexBoss], {
    pv: Math.round(data.boss[indexBoss].pv * f.pv),
    degats: Math.max(1, Math.round(data.boss[indexBoss].degats * f.degats)),
    cadence: Math.round(data.boss[indexBoss].cadence * f.cadence),
    reflexe: data.boss[indexBoss].reflexe * f.reflexe
  });
  joueur = creerCombattant(data.heroes[herosChoisi], 160, false);
  boss = creerCombattant(defBoss, W - 200, true);
  projectiles = [];
  dernierTir = 0;
  dernierSpecial = 0;
  prochainTirBoss = performance.now() + 1200;
  prochainBulle = performance.now() + 2500;
  prochainBracelet = performance.now() + 3000;
  prochainSpeBoss = performance.now() + 4000;
  ondes = [];
  reprendreMusique();
  messageJ = '';
  messageB = '';
  etat = 'combat';
  cacherTout();
  element('controles').classList.remove('cache');
}

function resetPartie() {
  indexBoss = 0;
  herosChoisi = 0;
  disponibles = data.heroes.map(() => true);
}

function choisirHeros(i) {
  if (!disponibles[i]) return;
  herosChoisi = i;
  afficherVersus();
}

function afficherVersus() {
  etat = 'versus';
  element('vs-texte').textContent = data.heroes[herosChoisi].nom + ' affronte ' + data.boss[indexBoss].nom;
  const av = element('vs-avertissement');
  av.textContent = data.boss[indexBoss].avertissement || '';
  av.style.display = data.boss[indexBoss].avertissement ? 'block' : 'none';
  montrer('ecran-versus');
}

function hauteurTir(c) {
  return c.y - c.hauteur * 1.05;
}

function tir() {
  if (etat !== 'combat') return;
  const t = performance.now();
  if (t - dernierTir < joueur.def.stats.cadenceTir || t < joueur.confusJusqua) return;
  dernierTir = t;
  sfx('tir');
  joueur.action = 'tir';
  joueur.actionT = t;
  const argsJ = joueur.def.arguments;
  const argJ = argsJ[Math.floor(Math.random() * argsJ.length)];
  phraseJ = argJ;
  phraseJT = t;
  const dir = boss.x > joueur.x ? 1 : -1;
  projectiles.push({
    x: joueur.x + dir * 30, y: hauteurTir(joueur),
    vx: dir * VITESSE_TIR, de: 'joueur', portee: joueur.def.stats.portee, startX: joueur.x + dir * 30,
    degats: joueur.def.stats.degats, phrase: argJ, r: 14
  });
}

function saut() {
  if (etat === 'combat' && joueur.onGround && !joueur.cast && performance.now() >= joueur.etourdiJusqua) {
    joueur.vy = -joueur.def.stats.saut;
    joueur.onGround = false;
    sfx('saut');
  }
}

function special() {
  if (etat !== 'combat') return;
  const t = performance.now();
  if (t - dernierSpecial < 1000 || t < joueur.confusJusqua) return;
  dernierSpecial = t;
  const cible = projectiles.find(p =>
    p.de === 'boss' && p.type !== 'bulle' &&
    Math.abs(p.x - joueur.x) < 200 &&
    Math.abs(p.y - hauteurTir(joueur)) < 70 &&
    Math.sign(p.vx) === Math.sign(joueur.x - p.x)
  );
  if (cible) {
    sfx('contre');
    cible.de = 'joueur';
    cible.vx = -cible.vx;
    cible.degats = Math.round(cible.degats * 1.5);
    cible.r = 17;
    joueur.action = 'ironie';
    joueur.actionT = t;
    messageJ = cible.reponse ? '🛡 ' + cible.reponse : 'Ironie ! La boule est renvoyée !';
    messageJT = t + 2500;
  } else {
    messageJ = 'Rien à renvoyer pour le moment…';
    messageJT = t + 900;
  }
}

function appliquerSpeciale(type, t) {
  sfx('speciale');
  const nom = joueur.def.special.nom;
  joueur.flameJusqua = t + 800;
  joueur.action = 'pointe';
  joueur.actionT = t;
  const touche = type === 'soin' || Math.abs(boss.x - joueur.x) <= PORTEE_SPE;
  const consequences = {
    bloqueAttaque: 'L’adversaire ne peut plus attaquer pendant 10 s.',
    confus: 'L’adversaire est confus 6 s : il ne fait plus rien.',
    soin: 'Le camarade récupère 20 % de PV.',
    antiReflexe: 'L’adversaire ne peut plus couper la parole pendant 12 s.',
    grosseBoule: 'Grosse boule de feu : 40 dégâts !'
  };
  annonce = {
    l1: joueur.def.nom + ' lance ' + nom + ' !',
    l2: touche ? (consequences[type] || '') : 'L’attaque n’a pas atteint ' + boss.def.nom + ' !',
    t0: t
  };
  ondes.push({ x: joueur.x, r: 10, maxR: PORTEE_SPE, vitesse: 1100, touche: true, visuel: true });
  if (!touche && type !== 'soin') return;
  if (type === 'bloqueAttaque') {
    boss.bloqueJusqua = t + 10000;
    messageJ = '✨ Aura ! L’adversaire ne peut plus attaquer pendant 10 s !';
    messageJT = t + 2500;
  } else if (type === 'confus') {
    boss.confusJusqua = t + 6000;
    messageJ = '👑 La ville des rois !';
    messageJT = t + 2000;
    messageB = '« Attends, il a dit quoi là ? »';
    messageBT = t + 3000;
  } else if (type === 'soin') {
    joueur.hp = Math.min(joueur.maxHp, joueur.hp + Math.round(joueur.maxHp * 0.2));
    messageJ = '💚 Résilience ! +20 % de PV !';
    messageJT = t + 2000;
  } else if (type === 'antiReflexe') {
    boss.antiReflexeJusqua = t + 12000;
    messageJ = '🧮 Calculs de maths…';
    messageJT = t + 2000;
    messageB = '« Il ne peut plus couper la parole pendant 12 s ! »';
    messageBT = t + 3000;
  } else if (type === 'grosseBoule') {
    const dir = boss.x > joueur.x ? 1 : -1;
    projectiles.push({
      x: joueur.x + dir * 34, y: hauteurTir(joueur),
      vx: dir * 560, de: 'joueur', type: 'boule', portee: joueur.def.stats.portee, startX: joueur.x + dir * 34,
      degats: 40, phrase: '📢 LA RÉPUBLIQUE C’EST MOI !', r: 30
    });
    messageJ = '📢 LA RÉPUBLIQUE C’EST MOI !';
    messageJT = t + 2000;
  }
}

function speciale() {
  if (etat !== 'combat') return;
  const t = performance.now();
  if (t - dernierSpeciale < joueur.def.stats.cooldownSpe || joueur.cast || t < joueur.confusJusqua) return;
  dernierSpeciale = t;
  joueur.cast = { t0: t, type: joueur.def.special.type };
  joueur.action = 'protege';
  joueur.actionT = t;
  messageJ = '⭐ ' + joueur.def.special.nom + '… préparation 2,5 s !';
  messageJT = t + DUREE_CAST;
}

function finCombat(gagne) {
  sfx(gagne ? 'victoire' : 'tombe');
  setTimeout(pauseMusique, 1400);
  if (gagne) {
    etat = 'recompense';
    element('texte-recompense').textContent = data.recompenses[indexBoss];
    montrer('ecran-recompense');
  } else {
    disponibles[herosChoisi] = false;
    if (disponibles.some(d => d)) {
      etat = 'defaite';
      element('texte-defaite').textContent = 'Un autre ramasse le flambeau et marche vers la victoire.';
      montrer('ecran-defaite');
    } else {
      etat = 'perdu';
      montrer('ecran-perdu');
    }
  }
}

function suivant() {
  indexBoss++;
  if (indexBoss >= data.boss.length) {
    etat = 'victoire';
    pauseMusique();
    element('liste-mesures').innerHTML = data.recompenses.map(r => '<li>' + r + '</li>').join('');
    montrer('ecran-victoire');
  } else {
    afficherVersus();
  }
}

function update(dt, t) {
  if (etat !== 'combat') return;

  const etourdi = t < joueur.etourdiJusqua;
  if (joueur.cast && t - joueur.cast.t0 >= DUREE_CAST) {
    appliquerSpeciale(joueur.cast.type, t);
    joueur.cast = null;
  }
  const dir = (etourdi || joueur.cast) ? 0 : (touches.droite ? 1 : 0) - (touches.gauche ? 1 : 0);
  joueur.enMouvement = dir !== 0 || !joueur.onGround;
  joueur.x += dir * joueur.def.stats.vitesse * dt;
  joueur.x = Math.max(40, Math.min(W - 220, joueur.x));
  joueur.vy += GRAV * dt;
  joueur.y += joueur.vy * dt;
  if (joueur.y >= SOL) {
    joueur.y = SOL;
    joueur.vy = 0;
    joueur.onGround = true;
  }

  const bossDef = boss.def;
  const dx = joueur.x - boss.x;
  if (Math.abs(dx) > 430) {
    boss.phase = 'avance';
  } else if (Math.abs(dx) < 260) {
    boss.phase = 'recule';
  } else if (!boss.phase || t > boss.phaseJusqua) {
    boss.phase = Math.random() < 0.5 ? 'avance' : 'recule';
    boss.phaseJusqua = t + 1000 + Math.random() * 2000;
  }
  const bossConfus = t < boss.confusJusqua || !!boss.cast;
  const bossBloque = t < boss.bloqueJusqua;
  const speBoss = bossDef.special;
  if (speBoss && !boss.cast && !bossBloque && !bossConfus && t > prochainSpeBoss) {
    boss.cast = { t0: t, type: 'boss' };
  }
  if (boss.cast && t - boss.cast.t0 >= DUREE_CAST) {
    const touche = Math.abs(joueur.x - boss.x) <= PORTEE_SPE;
    annonce = {
      l1: boss.def.nom + ' lance ' + speBoss.nom + ' !',
      l2: touche ? 'Vous êtes confus ' + (speBoss.confusion / 1000) + ' s : vous ne pouvez plus attaquer !' : 'L’attaque n’a pas atteint ' + joueur.def.nom + ' !',
      t0: t
    };
    if (touche) {
      sfx('speciale');
      joueur.confusJusqua = t + speBoss.confusion;
      messageJ = '🤯 Vous êtes confus ' + (speBoss.confusion / 1000) + ' s !';
      messageJT = t + 2500;
    }
    boss.cast = null;
    prochainSpeBoss = t + speBoss.delai;
  }
  if (!bossConfus) {
    const sens = boss.phase === 'avance' ? Math.sign(dx) : -Math.sign(dx);
    const coef = boss.phase === 'avance' ? 1 : 0.85;
    boss.enMouvement = true;
    boss.x += sens * bossDef.vitesse * coef * dt;
  } else {
    boss.enMouvement = false;
  }
  boss.x = Math.max(40, Math.min(W - 40, boss.x));
  if (boss.onGround && Math.random() < dt * 0.25) {
    boss.vy = -700;
    boss.onGround = false;
  }
  boss.vy += GRAV * dt;
  boss.y += boss.vy * dt;
  if (boss.y >= SOL) {
    boss.y = SOL;
    boss.vy = 0;
    boss.onGround = true;
  }

  const separation = (joueur.largeur + boss.largeur) / 2 + 6;
  const ecart = boss.x - joueur.x;
  if (Math.abs(ecart) < separation) {
    const poussee = (separation - Math.abs(ecart)) / 2;
    const dirSep = ecart >= 0 ? 1 : -1;
    joueur.x -= dirSep * poussee;
    boss.x += dirSep * poussee;
    joueur.x = Math.max(40, Math.min(W - 40, joueur.x));
    boss.x = Math.max(40, Math.min(W - 40, boss.x));
  }

  if (!bossBloque && !bossConfus && t > prochainTirBoss) {
    prochainTirBoss = t + bossDef.cadence;
    if (Math.abs(dx) > 100) {
      const dirB = Math.sign(dx);
      boss.action = 'tir';
      boss.actionT = t;
      sfx('tir');
      const argsB = bossDef.arguments;
      const argB = argsB[Math.floor(Math.random() * argsB.length)];
      phraseB = argB.t;
      phraseBT = t;
      projectiles.push({
        x: boss.x + dirB * 30 * boss.echelle, y: hauteurTir(boss),
        vx: dirB * VITESSE_TIR_BOSS, de: 'boss', portee: bossDef.portee, startX: boss.x + dirB * 30 * boss.echelle,
        degats: bossDef.degats, phrase: argB.t, reponse: argB.r, r: 14
      });
    }
  }

  if (!bossBloque && !bossConfus && bossDef.bulles && t > prochainBulle) {
    prochainBulle = t + bossDef.bulles.cadence;
    const dirB2 = Math.sign(dx) || 1;
    const boucheY = boss.y - boss.hauteur * 0.95;
    projectiles.push({
      x: boss.x + dirB2 * 30 * boss.echelle, y: boucheY, baseY: boucheY,
      vx: dirB2 * (VITESSE_TIR_BOSS * 0.7), de: 'boss', type: 'bulle',
      degats: bossDef.bulles.degats, phrase: '🫧 Bulle de shampoing !', r: 12
    });
  }

  if (!bossBloque && !bossConfus && bossDef.bracelet && t > prochainBracelet) {
    prochainBracelet = t + bossDef.bracelet.delai;
    ondes.push({ x: boss.x, r: 12, maxR: bossDef.bracelet.portee, vitesse: bossDef.bracelet.vitesse, touche: false });
    messageB = '🔔 Le bracelet sonne !';
    messageBT = t + 1000;
  }
  for (let i = ondes.length - 1; i >= 0; i--) {
    const o = ondes[i];
    o.r += o.vitesse * dt;
    if (!o.touche && Math.abs(joueur.x - o.x) <= o.r + joueur.largeur / 2 && joueur.y > SOL - 140) {
      o.touche = true;
      joueur.hp = Math.max(0, joueur.hp - (bossDef.bracelet.degats || 0));
      joueur.etourdiJusqua = t + bossDef.bracelet.etourdissement;
      joueur.confusJusqua = t + (bossDef.bracelet.confusion || 0);
      messageJ = '💫 Bracelet : -' + (bossDef.bracelet.degats || 0) + ' PV, sonné 4 s, confus 5 s !';
      messageJT = t + 2500;
      if (joueur.hp <= 0) finCombat(false);
    }
    if (o.r > o.maxR) ondes.splice(i, 1);
  }

  const chJ = hauteurTir(joueur);
  const chB = hauteurTir(boss);

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt;
    if (p.portee && Math.abs(p.x - p.startX) > p.portee) {
      projectiles.splice(i, 1);
      continue;
    }
    if (p.type === 'bulle') p.y = p.baseY + Math.sin(p.x * 0.025) * 48;
    if (p.x < -40 || p.x > W + 40) {
      projectiles.splice(i, 1);
      continue;
    }
    if (p.de === 'joueur') {
      if (Math.abs(p.x - boss.x) < boss.largeur / 2 + p.r && Math.abs(p.y - chB) < boss.hauteur / 2 + p.r) {
        boss.hp -= p.degats;
        sfx('touche');
        projectiles.splice(i, 1);
        if (boss.cast) {
          boss.cast = null;
          messageB = '❌ Préparation interrompue !';
          messageBT = t + 1500;
        }
        if (boss.hp <= 0) {
          boss.hp = 0;
          finCombat(true);
        }
        continue;
      }
      if (p.type !== 'bulle' && !p.reflexeTeste && t >= boss.antiReflexeJusqua && Math.abs(p.x - boss.x) < 150 && Math.abs(p.y - chB) < 70) {
        p.reflexeTeste = true;
        if (Math.random() < (bossDef.reflexe || 0)) {
          sfx('contre');
          p.de = 'boss';
          p.vx = -p.vx;
          boss.action = 'ironie';
          boss.actionT = t;
          messageB = 'On lui coupe la parole !';
          messageBT = t + 1500;
        }
      }
    } else {
      if (Math.abs(p.x - joueur.x) < joueur.largeur / 2 + p.r && Math.abs(p.y - chJ) < joueur.hauteur / 2 + p.r) {
        joueur.hp -= p.degats * (joueur.cast ? 2 : 1);
        sfx('touche');
        projectiles.splice(i, 1);
        if (joueur.cast) {
          joueur.cast = null;
          messageJ = '❌ Préparation interrompue !';
          messageJT = t + 1500;
        }
        if (joueur.hp <= 0) {
          joueur.hp = 0;
          finCombat(false);
        }
        continue;
      }
    }
  }
}

function dessinerFond() {
  if (etat === 'combat') {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a0a2e');
    g.addColorStop(1, '#232358');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255, 240, 180, 0.08)';
    ctx.beginPath();
    ctx.moveTo(60, 0); ctx.lineTo(300, SOL); ctx.lineTo(420, SOL); ctx.lineTo(180, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(W - 60, 0); ctx.lineTo(W - 180, 0); ctx.lineTo(W - 420, SOL); ctx.lineTo(W - 300, SOL);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(W / 2 - 270, 36, 540, 150);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 4;
    ctx.strokeRect(W / 2 - 270, 36, 540, 150);
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DÉBAT 📺', W / 2, 100);
    ctx.fillStyle = '#ff5252';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('● EN DIRECT', W / 2, 140);
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(W / 2 - 340, SOL - 24, 680, 24);
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(W / 2 - 340, SOL - 24, 680, 8);
    ctx.fillStyle = '#1a1a33';
    ctx.fillRect(0, SOL, W, H - SOL);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a1a40');
    g.addColorStop(1, '#3b1f5e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2c2c54';
    ctx.fillRect(0, SOL, W, H - SOL);
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.arc(W - 120, 90, 34, 0, Math.PI * 2);
    ctx.fill();
  }
}

function dessinerCombattant(c, t) {
  let pose = 'debout';
  if (c.cast) {
    pose = 'brasCiel';
  } else if (t < (c.flameJusqua || 0)) {
    pose = 'pointe';
  } else if (c.action && t - c.actionT < 350) {
    pose = c.action === 'tir' ? 'pointe' : 'protege';
  } else if (!c.onGround) {
    pose = 'marche';
  } else if (c.enMouvement) {
    pose = Math.floor(t / 180) % 2 === 0 ? 'marche' : 'marche2';
  }
  if (pose === 'pointe' && (c.enMouvement || !c.onGround)) pose = 'pointeMarche';

  const autre = c.estBoss ? joueur : boss;
  const face = autre && autre.x >= c.x ? 1 : -1;
  const h = c.hauteur;

  const img = imagesPersos[c.def.id + '_' + pose];
  if (img && img.complete && img.naturalWidth > 0) {
    const ih = 175 * c.echelle;
    const iw = ih * 0.6;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(face, 1);
    ctx.drawImage(img, -iw / 2, -ih, iw, ih);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(face * c.echelle, c.echelle);
  ctx.strokeStyle = c.def.couleur;
  ctx.fillStyle = c.def.couleur;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';

  const hipY = -h * 0.45;
  const epauleY = -h * 0.82;

  ctx.beginPath();
  if (pose === 'marche' || pose === 'pointeMarche') {
    ctx.moveTo(0, hipY); ctx.lineTo(16, 0);
    ctx.moveTo(0, hipY); ctx.lineTo(-12, 0);
  } else {
    ctx.moveTo(0, hipY); ctx.lineTo(6, 0);
    ctx.moveTo(0, hipY); ctx.lineTo(-6, 0);
  }
  ctx.stroke();

  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-8, -h, 18, h * 0.58, 6);
  } else {
    ctx.rect(-8, -h, 18, h * 0.58);
  }
  ctx.fill();

  ctx.beginPath();
  ctx.arc(4, -h - 10, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(13, -h - 13);
  ctx.lineTo(21, -h - 9);
  ctx.lineTo(13, -h - 5);
  ctx.fill();

  ctx.beginPath();
  if (pose === 'pointe' || pose === 'pointeMarche') {
    ctx.moveTo(2, epauleY);
    ctx.lineTo(26, epauleY + 2);
    ctx.lineTo(33, epauleY + 2);
  } else if (pose === 'protege') {
    ctx.moveTo(-6, epauleY + 6); ctx.lineTo(14, epauleY + 18);
    ctx.moveTo(-6, epauleY + 18); ctx.lineTo(14, epauleY + 6);
  } else {
    ctx.moveTo(2, epauleY); ctx.lineTo(8, -h * 0.5);
  }
  ctx.stroke();

  ctx.restore();

}

function dessinerEclairs(c, t) {
  ctx.strokeStyle = '#ffe066';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const a = t / 90 + i * 2.1;
    const bx = c.x + Math.cos(a) * (c.largeur + 18);
    const by = c.y - c.hauteur * (0.4 + 0.5 * ((i + 1) / 3)) + Math.sin(a * 1.7) * 10;
    ctx.beginPath();
    ctx.moveTo(bx, by - 16);
    ctx.lineTo(bx + 6, by - 6);
    ctx.lineTo(bx - 4, by + 2);
    ctx.lineTo(bx + 5, by + 14);
    ctx.stroke();
  }
}

function dessinerAura(c, t) {
  const reste = (c.flameJusqua - t) / 800;
  const r = 80 * (1.2 - reste * 0.4);
  const g = ctx.createRadialGradient(c.x, c.y - c.hauteur / 2, 10, c.x, c.y - c.hauteur / 2, r);
  const bleue = c.def.special && c.def.special.type === 'soin';
  if (bleue) {
    g.addColorStop(0, 'rgba(200, 235, 255, ' + (0.9 * reste) + ')');
    g.addColorStop(0.5, 'rgba(80, 170, 255, ' + (0.65 * reste) + ')');
    g.addColorStop(1, 'rgba(0, 90, 255, 0)');
  } else {
    g.addColorStop(0, 'rgba(255, 240, 150, ' + (0.85 * reste) + ')');
    g.addColorStop(0.5, 'rgba(255, 140, 0, ' + (0.6 * reste) + ')');
    g.addColorStop(1, 'rgba(255, 60, 0, 0)');
  }
  ctx.beginPath();
  ctx.arc(c.x, c.y - c.hauteur / 2, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
}

function dessinerSignesConfusion(c, t, jusqua) {
  if (t >= jusqua) return;
  const signes = ['?', '!', '?', '!'];
  const couleurs = ['#ffd23f', '#ff5252', '#ffd23f', '#ff5252'];
  signes.forEach((s, i) => {
    const a = t / 280 + i * (Math.PI / 2);
    const x = c.x + Math.cos(a) * (c.largeur + 44);
    const y = c.y - c.hauteur - 30 + Math.sin(a) * 18;
    ctx.font = 'bold 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#111';
    ctx.strokeText(s, x, y);
    ctx.fillStyle = couleurs[i];
    ctx.fillText(s, x, y);
  });
}

function dessinerAnnonce(t) {
  if (!annonce || t - annonce.t0 > 3000) return;
  const alpha = Math.min(1, (3000 - (t - annonce.t0)) / 500);
  ctx.font = 'bold 24px sans-serif';
  const w1 = ctx.measureText(annonce.l1).width;
  ctx.font = '15px sans-serif';
  const w2 = ctx.measureText(annonce.l2).width;
  const w = Math.max(w1, w2) + 50;
  const h = 78;
  const x = W / 2 - w / 2;
  const y = H / 2 - h / 2 - 40;
  ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(180,180,180,' + alpha + ')';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(20,20,40,' + alpha + ')';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(annonce.l1, W / 2, y + 34);
  ctx.font = '15px sans-serif';
  ctx.fillText(annonce.l2, W / 2, y + 60);
}

function dessinerBoiteTexte(x, y, w, texte) {
  if (!texte) return;
  ctx.font = 'bold 17px sans-serif';
  const mots = texte.split(' ');
  const lignes = [];
  let ligne = '';
  mots.forEach(m => {
    const test = ligne ? ligne + ' ' + m : m;
    if (ctx.measureText(test).width > w - 20 && ligne) {
      lignes.push(ligne);
      ligne = m;
    } else {
      ligne = test;
    }
  });
  if (ligne) lignes.push(ligne);
  const h = 20 + lignes.length * 21;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#bbbbbb';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#111111';
  ctx.textAlign = 'left';
  lignes.forEach((l, i) => ctx.fillText(l, x + 10, y + 28 + i * 21));
}

function dessinerOndes() {
  ondes.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x, SOL - 8, o.r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(142, 68, 173, ' + Math.max(0.15, 1 - o.r / o.maxR) + ')';
    ctx.lineWidth = 7;
    ctx.stroke();
  });
}

function dessinerProjectiles(t) {
  projectiles.forEach(p => {
    const flick = 1 + 0.18 * Math.sin(t / 40 + p.x * 0.05);
    const r = p.r * flick;
    const dirX = Math.sign(p.vx);
    if (p.type !== 'bulle') {
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(p.x - dirX * i * r * 1.1, p.y + Math.sin(t / 60 + i) * 2, r * (0.7 - i * 0.18), 0, Math.PI * 2);
        ctx.fillStyle = p.de === 'joueur' ? 'rgba(255, 150, 40, 0.35)' : 'rgba(255, 60, 60, 0.35)';
        ctx.fill();
      }
    }
    const g = ctx.createRadialGradient(p.x, p.y, r * 0.15, p.x, p.y, r * 1.5);
    if (p.type === 'bulle') {
      g.addColorStop(0, 'rgba(230,245,255,0.95)');
      g.addColorStop(0.75, 'rgba(160,210,255,0.9)');
      g.addColorStop(1, 'rgba(120,180,255,0.9)');
    } else if (p.de === 'joueur') {
      g.addColorStop(0, '#fff8dc');
      g.addColorStop(0.4, '#ffd23f');
      g.addColorStop(1, 'rgba(255, 80, 0, 0)');
    } else {
      g.addColorStop(0, '#ffe0e0');
      g.addColorStop(0.4, '#ff5252');
      g.addColorStop(1, 'rgba(180, 0, 0, 0)');
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    if (p.type === 'bulle') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = '#2e6fb8';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x - r * 0.4, p.y - r * 0.4, r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = '#fff8dc';
      ctx.fill();
    }
  });
}

function dessinerBarre(x, y, w, ratio, couleur, nom, inverse) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x - 2, y - 2, w + 4, 26);
  ctx.fillStyle = '#444';
  ctx.fillRect(x, y, w, 18);
  ctx.fillStyle = couleur;
  ctx.fillRect(inverse ? x + w * (1 - ratio) : x, y, w * ratio, 18);
}

function draw(t) {
  dessinerFond();
  if (joueur && etat !== 'titre' && etat !== 'heros') {
    dessinerCombattant(boss, t);
    dessinerCombattant(joueur, t);
    if (joueur.cast) dessinerEclairs(joueur, t);
    if (boss.cast) dessinerEclairs(boss, t);
    if (t < joueur.flameJusqua) dessinerAura(joueur, t);
    dessinerSignesConfusion(boss, t, Math.max(boss.confusJusqua, boss.bloqueJusqua, boss.antiReflexeJusqua));
    dessinerSignesConfusion(joueur, t, Math.max(joueur.confusJusqua, joueur.etourdiJusqua));
    dessinerOndes();
    dessinerProjectiles(t);
    dessinerAnnonce(t);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(joueur.def.nom, 20, 18);
    ctx.textAlign = 'right';
    ctx.fillText(boss.def.nom, W - 20, 18);
    dessinerBarre(20, 24, 340, Math.max(0, joueur.hp) / joueur.maxHp, '#2ecc71', joueur.def.nom, false);
    dessinerBarre(W - 360, 24, 340, Math.max(0, boss.hp) / boss.maxHp, '#e74c3c', boss.def.nom, true);
    const ratioI = Math.max(0, Math.min(1, (t - dernierSpecial) / 1000));
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(20, 44, 150, 7);
    ctx.fillStyle = ratioI >= 1 ? '#ffd23f' : '#777';
    ctx.fillRect(20, 44, 150 * ratioI, 7);
    const ratioS = Math.max(0, Math.min(1, (t - dernierSpeciale) / joueur.def.stats.cooldownSpe));
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(20, 55, 150, 7);
    ctx.fillStyle = ratioS >= 1 ? '#c39bd3' : '#777';
    ctx.fillRect(20, 55, 150 * ratioS, 7);
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🛡 ironie', 176, 51);
    ctx.fillText('⭐ spé', 176, 62);
    dessinerBoiteTexte(20, 68, 440, t - messageJT < 3000 ? messageJ : (t - phraseJT < 2500 ? phraseJ : ''));
    dessinerBoiteTexte(W - 460, 68, 440, t - messageBT < 3000 ? messageB : (t - phraseBT < 2500 ? phraseB : ''));

  }
}

let dernier = performance.now();
function boucle(t) {
  const dt = Math.min((t - dernier) / 1000, 0.05);
  dernier = t;
  update(dt, t);
  draw(t);
  requestAnimationFrame(boucle);
}

function lierBouton(id, down, up) {
  const el = element(id);
  el.addEventListener('pointerdown', e => {
    e.preventDefault();
    down();
  });
  if (up) {
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => el.addEventListener(ev, up));
  }
}

window.addEventListener('keydown', e => {
  if (e.code === 'ArrowLeft') touches.gauche = true;
  if (e.code === 'ArrowRight') touches.droite = true;
  if (e.code === 'ArrowUp') saut();
  if (e.code === 'Space') {
    e.preventDefault();
    tir();
  }
  if (e.code === 'ShiftLeft' || e.code === 'KeyE') special();
  if (e.code === 'KeyF') speciale();
});

window.addEventListener('keyup', e => {
  if (e.code === 'ArrowLeft') touches.gauche = false;
  if (e.code === 'ArrowRight') touches.droite = false;
});

const COULEURS_BARRES = ['#e74c3c', '#e67e22', '#f1c40f', '#82e0aa', '#1e8449'];

let audioCtx = null;
let musiqueOn = true;
let seqTimer = null;
let prochaineNote = 0;
let stepSeq = 0;
let morceau = null;

const MORCEAUX = {
  sombre: {
    bpm: 90,
    typeMel: 'sawtooth', volMel: 0.07,
    typeBass: 'sawtooth', volBass: 0.08,
    melodie: [57, 0, 0, 60, 0, 0, 63, 0, 62, 0, 60, 0, 57, 0, 55, 0, 57, 0, 0, 60, 0, 63, 0, 65, 64, 0, 63, 60, 59, 0, 0, 0],
    basse: [33, 0, 0, 0, 33, 0, 0, 0, 32, 0, 0, 0, 31, 0, 0, 0]
  },
  bella: {
    bpm: 140,
    typeMel: 'square', volMel: 0.12,
    typeBass: 'triangle', volBass: 0.16,
    melodie: [69, 69, 71, 72, 71, 69, 71, 72, 69, 69, 71, 72, 74, 72, 71, 69, 68, 69, 0, 0, 72, 72, 74, 75, 74, 72, 74, 75, 77, 75, 74, 72, 68, 69, 0, 0],
    basse: [45, 0, 52, 0, 45, 0, 52, 0, 45, 0, 52, 0, 45, 52, 45, 0]
  }
};

function freq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function jouerNote(midi, t, duree, type, vol) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq(midi);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duree);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + duree + 0.02);
}

function jouerHat(t) {
  const tampon = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.03, audioCtx.sampleRate);
  const canal = tampon.getChannelData(0);
  for (let i = 0; i < canal.length; i++) canal[i] = (Math.random() * 2 - 1) * (1 - i / canal.length);
  const src = audioCtx.createBufferSource();
  src.buffer = tampon;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.08, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  const filtre = audioCtx.createBiquadFilter();
  filtre.type = 'highpass';
  filtre.frequency.value = 6000;
  src.connect(filtre);
  filtre.connect(gain);
  gain.connect(audioCtx.destination);
  src.start(t);
}

function boucleSequence() {
  if (!audioCtx || !musiqueOn || !morceau) return;
  const duree = 60 / morceau.bpm / 2;
  while (prochaineNote < audioCtx.currentTime + 0.15) {
    const m = morceau.melodie[stepSeq % morceau.melodie.length];
    if (m) jouerNote(m, prochaineNote, duree * 0.9, morceau.typeMel, morceau.volMel);
    const b = morceau.basse[stepSeq % morceau.basse.length];
    if (b) jouerNote(b, prochaineNote, duree * 1.8, morceau.typeBass, morceau.volBass);
    if (morceau.bpm >= 120 && stepSeq % 2 === 1) jouerHat(prochaineNote);
    prochaineNote += duree;
    stepSeq++;
  }
}

function setMorceau(nom) {
  morceau = MORCEAUX[nom];
  stepSeq = 0;
  if (audioCtx) prochaineNote = audioCtx.currentTime + 0.1;
}

function sfxNote(freqDepart, freqArrivee, t, duree, type, vol) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqDepart, t);
  if (freqArrivee) osc.frequency.exponentialRampToValueAtTime(freqArrivee, t + duree);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duree);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + duree + 0.02);
}

function sfx(nom) {
  if (!audioCtx || !musiqueOn) return;
  const t = audioCtx.currentTime + 0.01;
  if (nom === 'saut') sfxNote(500, 950, t, 0.12, 'square', 0.12);
  else if (nom === 'tir') sfxNote(850, 250, t, 0.15, 'square', 0.12);
  else if (nom === 'touche') sfxNote(160, 90, t, 0.18, 'square', 0.2);
  else if (nom === 'contre') { sfxNote(660, 660, t, 0.09, 'square', 0.14); sfxNote(880, 880, t + 0.09, 0.12, 'square', 0.14); }
  else if (nom === 'speciale') sfxNote(180, 1400, t, 0.55, 'sawtooth', 0.16);
  else if (nom === 'victoire') [72, 76, 79, 84].forEach((m, i) => sfxNote(freq(m), freq(m), t + i * 0.16, 0.22, 'square', 0.16));
  else if (nom === 'tombe') [64, 62, 59, 57].forEach((m, i) => sfxNote(freq(m), freq(m) * 0.9, t + i * 0.18, 0.25, 'triangle', 0.18));
}

function pauseMusique() {
  if (audioCtx && musiqueOn && audioCtx.state === 'running') audioCtx.suspend();
}

function reprendreMusique() {
  if (audioCtx && musiqueOn && audioCtx.state === 'suspended') audioCtx.resume();
}

function demarrerMusique() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    seqTimer = setInterval(boucleSequence, 50);
  }
  if (!morceau) setMorceau('sombre');
  prochaineNote = audioCtx.currentTime + 0.1;
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function basculerMusique() {
  musiqueOn = !musiqueOn;
  element('btn-musique').textContent = musiqueOn ? '🔊' : '🔇';
  if (audioCtx) {
    if (musiqueOn) audioCtx.resume();
    else audioCtx.suspend();
  }
}

function barreStats(valeur, min, max, inverse) {
  const v = inverse ? -valeur : valeur;
  const vMin = inverse ? -max : min;
  const vMax = inverse ? -min : max;
  let n = vMax === vMin ? 5 : Math.round(1 + 4 * (v - vMin) / (vMax - vMin));
  n = Math.max(1, Math.min(5, n));
  let html = '<div class="barres">';
  for (let k = 1; k <= 5; k++) {
    html += '<span class="barre' + (k <= n ? ' rempli c' + k : '') + '"' + (k <= n ? ' style="background:' + COULEURS_BARRES[k - 1] + ';"' : '') + '></span>';
  }
  return html + '</div>';
}

function ligneStat(label, cle, valeur, min, max, inverse, unite) {
  return '<div class="stat-ligne"><span class="stat-label">' + label + '</span>'
    + barreStats(valeur, min, max, inverse)
    + '<b>' + valeur + unite + '</b></div>';
}

function ouvrirStats(i) {
  statsEnCours = i;
  const h = data.heroes[i];
  const s = h.stats;
  const mins = {}, maxs = {};
  ['degats', 'cadenceTir', 'vitesse', 'cooldownSpe', 'pv', 'portee'].forEach(k => {
    mins[k] = Math.min.apply(null, data.heroes.map(x => x.stats[k]));
    maxs[k] = Math.max.apply(null, data.heroes.map(x => x.stats[k]));
  });
  element('stats-contenu').innerHTML =
    '<h2 style="color:' + h.couleur + '">' + h.nom + '</h2>'
    + '<img class="icone-heros" style="width:96px;height:128px" src="assets/personnages/' + h.id + '/debout.svg?v=' + VERSION + '" alt="' + h.nom + '">'
    + '<div class="stats-bloc">'
    + ligneStat('💪 Force', 'degats', s.degats, mins.degats, maxs.degats, false, ' dégâts')
    + ligneStat('🔥 Punch lines', 'cadenceTir', s.cadenceTir, mins.cadenceTir, maxs.cadenceTir, true, ' ms')
    + ligneStat('🌀 Agilité', 'vitesse', s.vitesse, mins.vitesse, maxs.vitesse, false, ' (saut ' + s.saut + ')')
    + ligneStat('⭐ Pouvoir', 'cooldownSpe', s.cooldownSpe, mins.cooldownSpe, maxs.cooldownSpe, true, ' ms')
    + ligneStat('❤️ PV', 'pv', s.pv, mins.pv, maxs.pv, false, ' PV')
    + ligneStat('🎯 Portée', 'portee', s.portee, mins.portee, maxs.portee, false, ' px')
    + '</div>'
    + '<p class="stats-pouvoir"><strong>Pouvoir spécial ' + h.special.nom + '</strong><br>' + h.special.desc + '</p>';
  montrer('ecran-stats');
}

function construireHeros() {
  const liste = element('liste-heros');
  liste.innerHTML = '';
  data.heroes.forEach((h, i) => {
    const div = document.createElement('div');
    div.className = 'carte-heros' + (disponibles[i] ? '' : ' tombe');
    div.style.borderColor = h.couleur;
    const pastille = document.createElement('img');
    pastille.className = 'icone-heros';
    pastille.src = 'assets/personnages/' + h.id + '/debout.svg?v=' + VERSION;
    pastille.alt = h.nom;
    const nom = document.createElement('div');
    nom.textContent = h.nom;
    div.appendChild(pastille);
    div.appendChild(nom);
    if (disponibles[i]) {
      div.addEventListener('click', () => ouvrirStats(i));
    } else {
      const badge = document.createElement('div');
      badge.className = 'badge-tombe';
      badge.textContent = 'Tombé.e au débat';
      div.appendChild(badge);
    }
    liste.appendChild(div);
  });
}

function demanderPleinEcran() {
  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}

function majBoutonPleinEcran() {
  const b = element('btn-plein-ecran');
  if (b) b.textContent = document.fullscreenElement ? '⛶ Quitter le plein écran' : '⛶ Plein écran (cache la barre d’URL)';
}

document.addEventListener('fullscreenchange', majBoutonPleinEcran);

element('btn-plein-ecran').addEventListener('click', () => {
  if (document.fullscreenElement) {
    if (document.exitFullscreen) document.exitFullscreen();
  } else {
    demanderPleinEcran();
  }
});

function choisirNiveau(n) {
  niveau = n;
  demanderPleinEcran();
  demarrerMusique();
  resetPartie();
  etat = 'intro';
  montrer('ecran-intro1');
}

['facile', 'moyen', 'dur'].forEach(n => {
  element('btn-niv-' + n).addEventListener('click', () => choisirNiveau(n));
});
element('btn-i1').addEventListener('click', () => montrer('ecran-intro2'));
element('btn-i2').addEventListener('click', () => montrer('ecran-intro3'));
element('btn-i3').addEventListener('click', () => {
  setMorceau('bella');
  etat = 'aide';
  montrer('ecran-aide');
});
element('btn-aide-suivant').addEventListener('click', () => {
  etat = 'heros';
  construireHeros();
  montrer('ecran-heros');
});
element('btn-suivant').addEventListener('click', suivant);
element('btn-changer').addEventListener('click', () => {
  indexBoss++;
  if (indexBoss >= data.boss.length) {
    etat = 'victoire';
    element('liste-mesures').innerHTML = data.recompenses.map(r => '<li>' + r + '</li>').join('');
    montrer('ecran-victoire');
  } else {
    etat = 'heros';
    construireHeros();
    montrer('ecran-heros');
  }
});
element('btn-combat').addEventListener('click', () => commencerCombat());
element('btn-musique').addEventListener('click', basculerMusique);
element('btn-choisir-stats').addEventListener('click', () => choisirHeros(statsEnCours));
element('btn-retour-stats').addEventListener('click', () => {
  construireHeros();
  montrer('ecran-heros');
});
element('btn-relais').addEventListener('click', () => {
  etat = 'heros';
  construireHeros();
  montrer('ecran-heros');
});
element('btn-recommencer').addEventListener('click', () => {
  resetPartie();
  etat = 'heros';
  construireHeros();
  montrer('ecran-heros');
});
element('btn-rejouer').addEventListener('click', () => {
  resetPartie();
  etat = 'titre';
  montrer('ecran-titre');
});

lierBouton('btn-gauche', () => { touches.gauche = true; }, () => { touches.gauche = false; });
lierBouton('btn-droite', () => { touches.droite = true; }, () => { touches.droite = false; });
lierBouton('btn-saut', saut);
lierBouton('btn-tir', tir);
lierBouton('btn-special', special);
lierBouton('btn-speciale', speciale);

chargerImages();
montrer('ecran-titre');
requestAnimationFrame(boucle);
