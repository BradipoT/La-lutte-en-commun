const canvas = document.getElementById('jeu');
const ctx = canvas.getContext('2d');
const W = 960;
const H = 540;
const SOL = H - 70;
const GRAV = 1800;
const VITESSE_TIR = 460;
const VITESSE_TIR_BOSS = 400;
const data = window.GAME_DATA;

const POSES = ['debout', 'marche', 'pointe', 'pointeMarche', 'protege'];
const imagesPersos = {};

function chargerImages() {
  if (typeof Image === 'undefined') return;
  data.heroes.concat(data.boss).forEach(p => {
    POSES.forEach(pose => {
      const img = new Image();
      img.src = 'assets/personnages/' + p.id + '/' + pose + '.svg';
      imagesPersos[p.id + '_' + pose] = img;
    });
  });
}

let etat = 'titre';
let indexBoss = 0;
let herosChoisi = 0;
let disponibles = [true, true, true, true];
let joueur = null;
let boss = null;
let projectiles = [];
let dernierTir = 0;
let dernierSpecial = 0;
let prochainTirBoss = 0;
let message = '';
let messageJusqua = 0;
const touches = { gauche: false, droite: false };

function element(id) {
  return document.getElementById(id);
}

function cacherTout() {
  ['ecran-titre', 'ecran-heros', 'ecran-versus', 'ecran-recompense', 'ecran-defaite', 'ecran-perdu', 'ecran-victoire', 'controles']
    .forEach(id => element(id).classList.add('cache'));
}

function montrer(id) {
  cacherTout();
  element(id).classList.remove('cache');
}

function creerCombattant(def, x, estBoss) {
  const echelle = def.echelle || 1;
  const pv = estBoss ? def.pv : 120;
  return {
    def: def, x: x, y: SOL, vy: 0,
    largeur: 46 * echelle, hauteur: 92 * echelle,
    hp: pv, maxHp: pv, onGround: true, echelle: echelle, estBoss: estBoss,
    phase: null, phaseJusqua: 0, action: null, actionT: 0, enMouvement: false
  };
}

function commencerCombat() {
  joueur = creerCombattant(data.heroes[herosChoisi], 160, false);
  boss = creerCombattant(data.boss[indexBoss], W - 200, true);
  projectiles = [];
  dernierTir = 0;
  dernierSpecial = 0;
  prochainTirBoss = performance.now() + 1200;
  message = '';
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
  montrer('ecran-versus');
}

function hauteurTir(c) {
  return c.y - c.hauteur * 0.82;
}

function tir() {
  if (etat !== 'combat') return;
  const t = performance.now();
  if (t - dernierTir < 700) return;
  dernierTir = t;
  joueur.action = 'tir';
  joueur.actionT = t;
  const dir = boss.x > joueur.x ? 1 : -1;
  projectiles.push({
    x: joueur.x + dir * 30, y: hauteurTir(joueur),
    vx: dir * VITESSE_TIR, de: 'joueur',
    degats: joueur.def.degats, phrase: joueur.def.phrase, r: 14
  });
}

function saut() {
  if (etat === 'combat' && joueur.onGround) {
    joueur.vy = -780;
    joueur.onGround = false;
  }
}

function special() {
  if (etat !== 'combat') return;
  const t = performance.now();
  if (t - dernierSpecial < 1000) return;
  dernierSpecial = t;
  const cible = projectiles.find(p =>
    p.de === 'boss' &&
    Math.abs(p.x - joueur.x) < 200 &&
    Math.abs(p.y - hauteurTir(joueur)) < 70 &&
    Math.sign(p.vx) === Math.sign(joueur.x - p.x)
  );
  if (cible) {
    cible.de = 'joueur';
    cible.vx = -cible.vx;
    cible.degats = Math.round(cible.degats * 1.5);
    cible.r = 17;
    joueur.action = 'ironie';
    joueur.actionT = t;
    message = 'Ironie ! La boule est renvoyée !';
    messageJusqua = t + 1200;
  } else {
    message = 'Rien à renvoyer pour le moment…';
    messageJusqua = t + 900;
  }
}

function finCombat(gagne) {
  if (gagne) {
    etat = 'recompense';
    element('texte-recompense').textContent = data.recompenses[indexBoss];
    montrer('ecran-recompense');
  } else {
    disponibles[herosChoisi] = false;
    if (disponibles.some(d => d)) {
      etat = 'defaite';
      element('texte-defaite').textContent = 'Un camarade est tombé. Un autre ramasse le flambeau et marche vers la victoire.';
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
    element('liste-mesures').innerHTML = data.recompenses.map(r => '<li>' + r + '</li>').join('');
    montrer('ecran-victoire');
  } else {
    afficherVersus();
  }
}

function update(dt, t) {
  if (etat !== 'combat') return;

  const dir = (touches.droite ? 1 : 0) - (touches.gauche ? 1 : 0);
  joueur.enMouvement = dir !== 0 || !joueur.onGround;
  joueur.x += dir * joueur.def.vitesse * dt;
  joueur.x = Math.max(40, Math.min(W - 40, joueur.x));
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
  const sens = boss.phase === 'avance' ? Math.sign(dx) : -Math.sign(dx);
  const coef = boss.phase === 'avance' ? 1 : 0.85;
  boss.enMouvement = true;
  boss.x += sens * bossDef.vitesse * coef * dt;
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

  if (t > prochainTirBoss) {
    prochainTirBoss = t + bossDef.cadence;
    if (Math.abs(dx) > 120) {
      const dirB = Math.sign(dx);
      boss.action = 'tir';
      boss.actionT = t;
      projectiles.push({
        x: boss.x + dirB * 30 * boss.echelle, y: hauteurTir(boss),
        vx: dirB * VITESSE_TIR_BOSS, de: 'boss',
        degats: bossDef.degats, phrase: bossDef.phrase, r: 14
      });
    }
  }

  const chJ = hauteurTir(joueur);
  const chB = hauteurTir(boss);

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt;
    if (p.x < -40 || p.x > W + 40) {
      projectiles.splice(i, 1);
      continue;
    }
    if (p.de === 'joueur') {
      if (Math.abs(p.x - boss.x) < boss.largeur / 2 + p.r && Math.abs(p.y - chB) < boss.hauteur / 2 + p.r) {
        boss.hp -= p.degats;
        projectiles.splice(i, 1);
        if (boss.hp <= 0) {
          boss.hp = 0;
          finCombat(true);
        }
        continue;
      }
      if (!p.reflexeTeste && Math.abs(p.x - boss.x) < 150 && Math.abs(p.y - chB) < 70) {
        p.reflexeTeste = true;
        if (Math.random() < (bossDef.reflexe || 0)) {
          p.de = 'boss';
          p.vx = -p.vx;
          boss.action = 'ironie';
          boss.actionT = t;
          message = boss.def.nom + ' coupe la parole !';
          messageJusqua = t + 1000;
        }
      }
    } else {
      if (Math.abs(p.x - joueur.x) < joueur.largeur / 2 + p.r && Math.abs(p.y - chJ) < joueur.hauteur / 2 + p.r) {
        joueur.hp -= p.degats;
        projectiles.splice(i, 1);
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

function dessinerCombattant(c, t) {
  let pose = 'debout';
  if (c.action && t - c.actionT < 350) {
    pose = c.action === 'tir' ? 'pointe' : 'protege';
  } else if (!c.onGround || c.enMouvement) {
    pose = 'marche';
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

function dessinerProjectiles(t) {
  projectiles.forEach(p => {
    const flick = 1 + 0.18 * Math.sin(t / 40 + p.x * 0.05);
    const r = p.r * flick;
    const dirX = Math.sign(p.vx);
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(p.x - dirX * i * r * 1.1, p.y + Math.sin(t / 60 + i) * 2, r * (0.7 - i * 0.18), 0, Math.PI * 2);
      ctx.fillStyle = p.de === 'joueur' ? 'rgba(255, 150, 40, 0.35)' : 'rgba(255, 60, 60, 0.35)';
      ctx.fill();
    }
    const g = ctx.createRadialGradient(p.x, p.y, r * 0.15, p.x, p.y, r * 1.5);
    if (p.de === 'joueur') {
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
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#fff8dc';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.phrase, p.x, p.y - r - 12);
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
    dessinerProjectiles(t);
    dessinerBarre(20, 34, 340, Math.max(0, joueur.hp) / joueur.maxHp, '#2ecc71', joueur.def.nom, false);
    dessinerBarre(W - 360, 34, 340, Math.max(0, boss.hp) / boss.maxHp, '#e74c3c', boss.def.nom, true);
    const ratioI = Math.max(0, Math.min(1, (t - dernierSpecial) / 1000));
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(20, 58, 150, 9);
    ctx.fillStyle = ratioI >= 1 ? '#ffd23f' : '#777';
    ctx.fillRect(20, 58, 150 * ratioI, 9);
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🛡 ironie', 176, 66);
    if (t < messageJusqua && message) {
      ctx.fillStyle = '#ffd23f';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(message, W / 2, 110);
    }
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
});

window.addEventListener('keyup', e => {
  if (e.code === 'ArrowLeft') touches.gauche = false;
  if (e.code === 'ArrowRight') touches.droite = false;
});

function construireHeros() {
  const liste = element('liste-heros');
  liste.innerHTML = '';
  data.heroes.forEach((h, i) => {
    const div = document.createElement('div');
    div.className = 'carte-heros' + (disponibles[i] ? '' : ' tombe');
    div.style.borderColor = h.couleur;
    const pastille = document.createElement('div');
    pastille.className = 'pastille';
    pastille.style.background = h.couleur;
    const nom = document.createElement('div');
    nom.textContent = h.nom;
    const phrase = document.createElement('div');
    phrase.className = 'phrase';
    phrase.textContent = '🔥 ' + h.phrase;
    div.appendChild(pastille);
    div.appendChild(nom);
    div.appendChild(phrase);
    if (disponibles[i]) {
      div.addEventListener('click', () => choisirHeros(i));
    } else {
      const badge = document.createElement('div');
      badge.className = 'badge-tombe';
      badge.textContent = '✊ tombé au combat';
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

element('btn-jouer').addEventListener('click', () => {
  demanderPleinEcran();
  resetPartie();
  etat = 'heros';
  construireHeros();
  montrer('ecran-heros');
});
element('btn-suivant').addEventListener('click', suivant);
element('btn-changer').addEventListener('click', () => {
  etat = 'heros';
  construireHeros();
  montrer('ecran-heros');
});
element('btn-combat').addEventListener('click', () => commencerCombat());
element('btn-relais').addEventListener('click', () => {
  etat = 'heros';
  construireHeros();
  montrer('ecran-heros');
});
element('btn-recommencer').addEventListener('click', () => {
  resetPartie();
  etat = 'titre';
  montrer('ecran-titre');
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

chargerImages();
montrer('ecran-titre');
requestAnimationFrame(boucle);
