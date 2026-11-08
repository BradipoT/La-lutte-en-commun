const canvas = document.getElementById('jeu');
const ctx = canvas.getContext('2d');
const W = 960;
const H = 540;
const SOL = H - 70;
const GRAV = 1800;
const VITESSE_TIR = 460;
const VITESSE_TIR_BOSS = 400;
const DISTANCE_BOSS = 300;
const data = window.GAME_DATA;

let etat = 'titre';
let indexBoss = 0;
let herosChoisi = 0;
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
  ['ecran-titre', 'ecran-heros', 'ecran-recompense', 'ecran-defaite', 'ecran-victoire', 'controles']
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
    hp: pv, maxHp: pv, onGround: true, echelle: echelle, estBoss: estBoss
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

function choisirHeros(i) {
  herosChoisi = i;
  indexBoss = 0;
  commencerCombat();
}

function hauteurTorse(c) {
  return c.y - c.hauteur * 0.55;
}

function tir() {
  if (etat !== 'combat') return;
  const t = performance.now();
  if (t - dernierTir < 420) return;
  dernierTir = t;
  const dir = boss.x > joueur.x ? 1 : -1;
  projectiles.push({
    x: joueur.x + dir * 30, y: hauteurTorse(joueur),
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
    Math.abs(p.y - hauteurTorse(joueur)) < 70 &&
    Math.sign(p.vx) === Math.sign(joueur.x - p.x)
  );
  if (cible) {
    cible.de = 'joueur';
    cible.vx = -cible.vx;
    cible.degats = Math.round(cible.degats * 1.5);
    cible.r = 17;
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
    etat = 'defaite';
    montrer('ecran-defaite');
  }
}

function suivant() {
  indexBoss++;
  if (indexBoss >= data.boss.length) {
    etat = 'victoire';
    element('liste-mesures').innerHTML = data.recompenses.map(r => '<li>' + r + '</li>').join('');
    montrer('ecran-victoire');
  } else {
    commencerCombat();
  }
}

function update(dt, t) {
  if (etat !== 'combat') return;

  const dir = (touches.droite ? 1 : 0) - (touches.gauche ? 1 : 0);
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
  if (Math.abs(dx) > DISTANCE_BOSS + 40) {
    boss.x += Math.sign(dx) * bossDef.vitesse * dt;
  } else if (Math.abs(dx) < DISTANCE_BOSS - 60) {
    boss.x -= Math.sign(dx) * bossDef.vitesse * 0.8 * dt;
  } else if (Math.random() < dt * 0.4) {
    boss.x += (Math.random() < 0.5 ? -1 : 1) * bossDef.vitesse * 0.5 * dt;
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

  if (t > prochainTirBoss) {
    prochainTirBoss = t + bossDef.cadence;
    if (Math.abs(dx) > 120) {
      const dirB = Math.sign(dx);
      projectiles.push({
        x: boss.x + dirB * 30 * boss.echelle, y: hauteurTorse(boss),
        vx: dirB * VITESSE_TIR_BOSS, de: 'boss',
        degats: bossDef.degats, phrase: bossDef.phrase, r: 14
      });
    }
  }

  const chJ = hauteurTorse(joueur);
  const chB = hauteurTorse(boss);

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

function dessinerCombattant(c) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.fillStyle = c.def.couleur;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-c.largeur / 2, -c.hauteur, c.largeur, c.hauteur, 10);
  } else {
    ctx.rect(-c.largeur / 2, -c.hauteur, c.largeur, c.hauteur);
  }
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -c.hauteur - 14 * c.echelle, 16 * c.echelle, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(c.def.nom, c.x, c.y - c.hauteur - 36 * c.echelle);
}

function dessinerProjectiles() {
  projectiles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.de === 'joueur' ? '#ffd23f' : '#ff5252';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.phrase, p.x, p.y - p.r - 6);
  });
}

function dessinerBarre(x, y, w, ratio, couleur, nom, inverse) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x - 2, y - 2, w + 4, 26);
  ctx.fillStyle = '#444';
  ctx.fillRect(x, y, w, 18);
  ctx.fillStyle = couleur;
  ctx.fillRect(inverse ? x + w * (1 - ratio) : x, y, w * ratio, 18);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = inverse ? 'right' : 'left';
  ctx.fillText(nom, inverse ? x + w : x, y - 6);
}

function draw(t) {
  dessinerFond();
  if (joueur && etat !== 'titre' && etat !== 'heros') {
    dessinerCombattant(boss);
    dessinerCombattant(joueur);
    dessinerProjectiles();
    dessinerBarre(20, 34, 340, Math.max(0, joueur.hp) / joueur.maxHp, '#2ecc71', joueur.def.nom, false);
    dessinerBarre(W - 360, 34, 340, Math.max(0, boss.hp) / boss.maxHp, '#e74c3c', boss.def.nom, true);
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
    div.className = 'carte-heros';
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
    div.addEventListener('click', () => choisirHeros(i));
    liste.appendChild(div);
  });
}

element('btn-jouer').addEventListener('click', () => {
  etat = 'heros';
  construireHeros();
  montrer('ecran-heros');
});
element('btn-suivant').addEventListener('click', suivant);
element('btn-reessayer').addEventListener('click', () => commencerCombat());
element('btn-rejouer').addEventListener('click', () => {
  indexBoss = 0;
  etat = 'titre';
  montrer('ecran-titre');
});

lierBouton('btn-gauche', () => { touches.gauche = true; }, () => { touches.gauche = false; });
lierBouton('btn-droite', () => { touches.droite = true; }, () => { touches.droite = false; });
lierBouton('btn-saut', saut);
lierBouton('btn-tir', tir);
lierBouton('btn-special', special);

montrer('ecran-titre');
requestAnimationFrame(boucle);
