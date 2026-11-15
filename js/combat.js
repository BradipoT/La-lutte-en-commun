function commencerCombat() {
  setMorceau('combat');
  const f = NIVEAUX[niveau];
  const srcBoss = combatFantome ? data.fantome : data.boss[indexBoss];
  const defBoss = Object.assign({}, srcBoss, {
    pv: Math.round(srcBoss.pv * f.pv),
    degats: Math.max(1, Math.round(srcBoss.degats * f.degats)),
    cadence: Math.round(srcBoss.cadence * f.cadence),
    reflexe: srcBoss.reflexe * f.reflexe
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
  prochainChargeBoss = performance.now() + 6000;
  prochainBombe = performance.now() + 3000;
  explosions = [];
  finEnAttente = null;
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
  disponibles = data.heroes.map((h, i) => i < data.heroes.length - 1);
  melenchonDebloque = false;
}

function choisirHeros(i) {
  if (!disponibles[i]) return;
  herosChoisi = i;
  afficherVersus();
}

function jouerMotifMarechal() {
  if (!audioCtx || !musiqueOn) return;
  const notes = [64, 64, 67, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 76, 76, 74, 72, 72, 72, 72, 72, 72, 72];
  const d = 60 / 170 / 2;
  const t0 = audioCtx.currentTime + 0.15;
  notes.forEach((m, i) => jouerNote(m, t0 + i * d, d * 0.9, 'square', 0.15));
}

function afficherVersus() {
  if (data.boss[indexBoss].id === 'marechal') {
    setMorceau('');
    reprendreMusique();
    setTimeout(jouerMotifMarechal, 1000);
    const bc = element('btn-combat');
    bc.disabled = true;
    bc.textContent = 'Combattez ! (6 s)';
    let reste = 6;
    const compteur = setInterval(() => {
      reste--;
      if (reste > 0) bc.textContent = 'Combattez ! (' + reste + ' s)';
      else { clearInterval(compteur); bc.disabled = false; bc.textContent = 'Combattez !'; }
    }, 1000);
  } else {
    setMorceau('bella');
    reprendreMusique();
  }
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

function tirCharge() {
  if (etat !== 'combat') return;
  const t = performance.now();
  const argsJ = joueur.def.arguments;
  const argJ = argsJ[Math.floor(Math.random() * argsJ.length)];
  phraseJ = '🔥 ' + argJ;
  phraseJT = t;
  const dir = boss.x > joueur.x ? 1 : -1;
  projectiles.push({
    x: joueur.x + dir * 34, y: hauteurTir(joueur),
    vx: dir * 720, de: 'joueur', type: 'boule', portee: joueur.stats.portee, startX: joueur.x + dir * 34,
    degats: joueur.stats.degats * 2, phrase: '🔥 ' + argJ, r: 22, nonContree: true
  });
  joueur.action = 'tir';
  joueur.actionT = t;
  sfx('tir');
}

function tir() {
  if (etat !== 'combat') return;
  const t = performance.now();
  if (t - dernierTir < joueur.stats.cadenceTir || t < joueur.confusJusqua || t < joueur.toucheJusqua) return;
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
    vx: dir * VITESSE_TIR, de: 'joueur', portee: joueur.stats.portee, startX: joueur.x + dir * 30,
    degats: joueur.stats.degats, phrase: argJ, r: 14
  });
}

function saut() {
  if (etat === 'combat' && joueur.onGround && !joueur.cast && performance.now() >= joueur.etourdiJusqua && performance.now() >= joueur.toucheJusqua) {
    joueur.vy = -joueur.stats.saut;
    joueur.onGround = false;
    sfx('saut');
  }
}

function special() {
  if (etat !== 'combat') return;
  const t = performance.now();
  if (t - dernierSpecial < 1000 || t < joueur.confusJusqua || t < joueur.toucheJusqua) return;
  dernierSpecial = t;
  const cible = projectiles.find(p =>
    p.de === 'boss' && p.type !== 'bulle' && !p.nonContree && !p.renvoye &&
    Math.abs(p.x - joueur.x) < 200 &&
    Math.abs(p.y - hauteurTir(joueur)) < 70 &&
    Math.sign(p.vx) === Math.sign(joueur.x - p.x)
  );
  if (cible) {
    sfx('contre');
    cible.renvoye = true;
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
  boss.hp -= Math.round(joueur.stats.degats * 1.5);
  if (boss.hp <= 0) { boss.hp = 0; finCombat(true, t); return; }
  const nom = joueur.def.special.nom;
  joueur.flameJusqua = t + 800;
  joueur.action = 'pointe';
  joueur.actionT = t;
  const touche = type === 'soin' || type === 'gigantisme' || Math.abs(boss.x - joueur.x) <= PORTEE_SPE;
  const consequences = {
    bloqueAttaque: 'L’adversaire ne peut plus attaquer pendant 10 s.',
    confus: 'L’adversaire est confus 6 s : il ne fait plus rien.',
    soin: 'Le camarade récupère 20 % de PV.',
    antiReflexe: 'L’adversaire ne peut plus couper la parole pendant 12 s.',
    grosseBoule: 'Grosse boule de feu : 40 dégâts !',
    gigantisme: 'Il grandit : toutes ses stats sont améliorées pendant 15 s !'
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
  } else if (type === 'gigantisme') {
    joueur.buffJusqua = t + 15000;
    joueur.echelle = (joueur.def.echelle || 1) * 1.6;
    joueur.stats = Object.assign({}, joueur.def.stats, {
      degats: Math.round(joueur.def.stats.degats * 1.5),
      cadenceTir: Math.round(joueur.def.stats.cadenceTir * 0.7),
      vitesse: Math.round(joueur.def.stats.vitesse * 1.25),
      saut: Math.round(joueur.def.stats.saut * 1.2),
      portee: Math.round(joueur.def.stats.portee * 1.5)
    });
    messageJ = '📢 LA RÉPUBLIQUE C’EST MOI ! Je grandis 15 s !';
    messageJT = t + 2000;
  }
}

function speciale() {
  if (etat !== 'combat') return;
  const t = performance.now();
  if (t - dernierSpeciale < joueur.stats.cooldownSpe || joueur.cast || t < joueur.confusJusqua || t < joueur.toucheJusqua) return;
  dernierSpeciale = t;
  joueur.cast = { t0: t, type: joueur.def.special.type };
  joueur.action = 'protege';
  joueur.actionT = t;
  messageJ = '⭐ ' + joueur.def.special.nom + '… préparation 2,5 s !';
  messageJT = t + DUREE_CAST;
}

function finCombat(gagne, t) {
  sfx(gagne ? 'victoire' : 'tombe');
  if (combatFantome && gagne) {
    explosions.push({ x: boss.x, y: boss.y - boss.hauteur / 2, r: 10, maxR: 260, t0: t, touche: true });
    sfx('boom');
    shakeJusqua = t + 600;
  }
  setTimeout(pauseMusique, 1400);
  if (gagne) { boss.tombeJusqua = t + 1500; joueur.gagneJusqua = t + 1500; }
  else { joueur.tombeJusqua = t + 1500; boss.gagneJusqua = t + 1500; }
  finEnAttente = { gagne: gagne, t0: t };
}

function afficherFin(gagne) {
  if (combatFantome && gagne) {
    combatFantome = false;
    etat = 'fantome-gagne';
    montrer('ecran-fantome-gagne');
    return;
  }
  if (gagne) {
    etat = 'recompense';
    element('texte-recompense').textContent = data.recompenses[indexBoss];
    element('btn-changer').style.display = (indexBoss >= data.boss.length - 1) ? 'none' : '';
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

function avantLePen() {
  if (indexBoss === data.boss.length - 1 && !melenchonDebloque) {
    melenchonDebloque = true;
    disponibles[disponibles.length - 1] = true;
    setMorceau('espoir');
    reprendreMusique();
    etat = 'arrivee';
    montrer('ecran-arrivee');
    return true;
  }
  return false;
}

function suivant() {
  indexBoss++;
  if (avantLePen()) return;
  if (indexBoss >= data.boss.length) {
    etat = 'victoire';
    element('btn-rejouer').style.display = 'none';
    pauseMusique();
    montrer('ecran-victoire');
  } else {
    afficherVersus();
  }
}

function update(dt, t) {
  if (etat !== 'combat') return;
  if (finEnAttente) {
    if (t - finEnAttente.t0 >= 1500) {
      const g = finEnAttente.gagne;
      finEnAttente = null;
      afficherFin(g);
    }
    return;
  }

  const etourdi = t < joueur.etourdiJusqua || t < joueur.toucheJusqua;
  if (joueur.cast && t - joueur.cast.t0 >= DUREE_CAST) {
    appliquerSpeciale(joueur.cast.type, t);
    joueur.cast = null;
  }
  if (joueur.buffJusqua && t >= joueur.buffJusqua) {
    joueur.buffJusqua = 0;
    joueur.echelle = joueur.def.echelle || 1;
    joueur.stats = Object.assign({}, joueur.def.stats);
    messageJ = 'Taille normale retrouvée.';
    messageJT = t + 1500;
  }
  if (joueur.castCharge && t - joueur.castCharge >= 1000) {
    joueur.castCharge = 0;
    tirCharge();
  }
  const dir = (etourdi || joueur.cast || joueur.castCharge) ? 0 : (touches.droite ? 1 : 0) - (touches.gauche ? 1 : 0);
  joueur.enMouvement = dir !== 0 || !joueur.onGround;
  joueur.x += dir * joueur.stats.vitesse * dt;
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
  if (bossDef.vole) {
    boss.y = SOL - boss.hauteur - 100 - 100 * Math.sin(t / 650);
    boss.onGround = false;
    boss.vy = 0;
  }
  const bossConfus = t < boss.confusJusqua || t < boss.toucheJusqua || !!boss.cast;
  const bossBloque = t < boss.bloqueJusqua;
  const speBoss = bossDef.special;
  if (speBoss && !boss.cast && !bossBloque && !bossConfus && t > prochainSpeBoss) {
    boss.cast = { t0: t, type: bossDef.vole ? 'oas' : 'boss' };
  }
  if (bossDef.charge && !boss.cast && !bossConfus && !bossBloque && t > prochainChargeBoss && Math.abs(dx) > 150) {
    boss.cast = { t0: t, type: 'charge' };
    prochainChargeBoss = t + 9000;
  }
  if (boss.cast && boss.cast.type === 'charge' && t - boss.cast.t0 >= 1000) {
    const dirB3 = Math.sign(dx) || 1;
    projectiles.push({
      x: boss.x + dirB3 * 30 * boss.echelle, y: hauteurTir(boss),
      vx: dirB3 * 560, de: 'boss', type: 'boule', portee: bossDef.portee, startX: boss.x,
      degats: bossDef.degats * 2, phrase: '🔥 Attaque chargée !', r: 22, nonContree: true
    });
    sfx('tir');
    boss.cast = null;
    prochainChargeBoss = t + 9000;
  }
  if (boss.cast && boss.cast.type === 'oas' && t - boss.cast.t0 >= DUREE_CAST) {
    projectiles.push({ x: W + 40, y: SOL - 78, vx: -380, de: 'boss', type: 'esprit', r: 26, degats: 10, nonContree: true, fantome: true });
    projectiles.push({ x: W + 420, y: SOL - 78, vx: -380, de: 'boss', type: 'esprit', r: 26, degats: 10, nonContree: true, fantome: true });
    annonce = { l1: boss.def.nom + ' lance ' + speBoss.nom + ' !', l2: 'Deux esprits traversent le plateau : esquivez ou détruisez-les !', t0: t };
    sfx('speciale');
    boss.cast = null;
    prochainSpeBoss = t + speBoss.delai;
  }
  if (boss.cast && boss.cast.type !== 'charge' && boss.cast.type !== 'oas' && t - boss.cast.t0 >= DUREE_CAST) {
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

  if (!bossBloque && !bossConfus && !bossDef.pasDeBoules && t > prochainTirBoss) {
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

  if (!bossBloque && !bossConfus && bossDef.bombes && t > prochainBombe) {
    prochainBombe = t + bossDef.bombes.cadence;
    const dirB4 = Math.sign(dx) || 1;
    projectiles.push({
      x: boss.x + dirB4 * 30 * boss.echelle, y: boss.y - boss.hauteur * 0.5,
      vx: dirB4 * 260, vy: 60, de: 'boss', type: 'bombe', portee: bossDef.portee, startX: boss.x,
      degats: bossDef.bombes.degats, rayon: bossDef.bombes.rayon, nonContree: true, r: 12, phrase: '💣'
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
      if (joueur.hp <= 0) finCombat(false, t);
    }
    if (o.r > o.maxR) ondes.splice(i, 1);
  }

  for (let i = explosions.length - 1; i >= 0; i--) {
    const e = explosions[i];
    if (!e.touche && Math.abs(joueur.x - e.x) < e.maxR + joueur.largeur / 2 && joueur.y > SOL - 160) {
      e.touche = true;
      joueur.hp -= bossDef.bombes ? bossDef.bombes.degats : 10;
      joueur.toucheJusqua = t + 500;
      shakeJusqua = t + 250;
      sfx('touche');
      messageJ = '💥 Explosé !';
      messageJT = t + 1200;
      if (joueur.hp <= 0) finCombat(false, t);
    }
    if (t - e.t0 > 500) explosions.splice(i, 1);
  }

  const chJ = hauteurTir(joueur);
  const chB = hauteurTir(boss);

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt;
    if (p.type === 'esprit' && p.x < -60) {
      projectiles.splice(i, 1);
      continue;
    }
    if (p.portee && Math.abs(p.x - p.startX) > p.portee) {
      if (p.type === 'bombe') { explosions.push({ x: p.x, y: SOL - 10, r: 8, maxR: p.rayon, t0: t }); sfx('boom'); }
      projectiles.splice(i, 1);
      continue;
    }
    if (p.type === 'bombe') {
      p.vy += 1400 * dt;
      p.y += p.vy * dt;
      if (p.y >= SOL - 10) {
        p.y = SOL - 10;
        explosions.push({ x: p.x, y: SOL - 10, r: 8, maxR: p.rayon, t0: t });
        sfx('boom');
        projectiles.splice(i, 1);
        continue;
      }
    }
    if (p.type === 'bulle') p.y = p.baseY + Math.sin(p.x * 0.025) * 48;
    if (p.x < -40 || p.x > W + 40) {
      projectiles.splice(i, 1);
      continue;
    }
    if (p.de === 'joueur') {
      if (Math.abs(p.x - boss.x) < boss.largeur / 2 + p.r && Math.abs(p.y - chB) < boss.hauteur / 2 + p.r) {
        boss.hp -= p.degats;
        boss.toucheJusqua = t + 500;
        shakeJusqua = t + 160;
        sfx('touche');
        projectiles.splice(i, 1);
        if (boss.cast) {
          boss.cast = null;
          messageB = '❌ Préparation interrompue !';
          messageBT = t + 1500;
        }
        if (boss.hp <= 0) {
          boss.hp = 0;
          finCombat(true, t);
        }
        continue;
      }
      if (p.type !== 'bulle' && !p.nonContree && !p.renvoye && !p.reflexeTeste && t >= boss.antiReflexeJusqua && Math.abs(p.x - boss.x) < 150 && Math.abs(p.y - chB) < 70) {
        p.reflexeTeste = true;
        if (Math.random() < (bossDef.reflexe || 0)) {
          sfx('contre');
          p.renvoye = true;
          p.de = 'boss';
          p.vx = -p.vx;
          boss.action = 'ironie';
          boss.actionT = t;
          messageB = 'On lui coupe la parole !';
          messageBT = t + 1500;
        }
      }
    } else {
      if (p.type === 'esprit' && Math.abs(p.x - joueur.x) < joueur.largeur / 2 + p.r && Math.abs(p.y - chJ) < joueur.hauteur / 2 + p.r) {
        joueur.hp -= p.degats;
        joueur.toucheJusqua = t + 500;
        shakeJusqua = t + 200;
        sfx('touche');
        messageJ = '👻 Touché par un esprit ! -' + p.degats + ' PV';
        messageJT = t + 1200;
        projectiles.splice(i, 1);
        if (joueur.hp <= 0) finCombat(false, t);
        continue;
      }
      if (Math.abs(p.x - joueur.x) < joueur.largeur / 2 + p.r && Math.abs(p.y - chJ) < joueur.hauteur / 2 + p.r) {
        joueur.hp -= p.degats * ((joueur.cast || joueur.castCharge) ? 2 : 1);
        joueur.toucheJusqua = t + 500;
        shakeJusqua = t + 160;
        sfx('touche');
        projectiles.splice(i, 1);
        if (joueur.cast) {
          joueur.cast = null;
          messageJ = '❌ Préparation interrompue !';
          messageJT = t + 1500;
        }
        if (joueur.castCharge) {
          joueur.castCharge = 0;
          messageJ = '❌ Charge interrompue !';
          messageJT = t + 1500;
        }
        if (joueur.hp <= 0) {
          joueur.hp = 0;
          finCombat(false, t);
        }
        continue;
      }
    }
  }
}

function dessinerParallaxStudio(t) {
  for (let i = 0; i < 6; i++) {
    const sx = 60 + i * 160;
    const sway = Math.sin(t / 900 + i * 1.7) * 14;
    ctx.strokeStyle = 'rgba(120,120,160,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx + sway, 70);
    ctx.stroke();
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.arc(sx + sway, 74, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 220, 120, 0.10)';
    ctx.beginPath();
    ctx.moveTo(sx + sway, 78);
    ctx.lineTo(sx + sway - 40, SOL);
    ctx.lineTo(sx + sway + 40, SOL);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(10, 10, 30, 0.55)';
  for (let i = 0; i < 24; i++) {
    const ax = 20 + i * 41 + (i % 3) * 7;
    const bob = Math.sin(t / 350 + i * 0.9) * 3;
    ctx.beginPath();
    ctx.arc(ax, SOL + 34 + bob, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(ax - 12, SOL + 40 + bob, 24, 18);
  }
}

function dessinerOmbre(c) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(c.x, SOL + 8, c.largeur * 0.55, 7, 0, 0, Math.PI * 2);
  ctx.fill();
}

function dessinerFond(t) {
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
    dessinerParallaxStudio(t);
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
  if (t < (c.gagneJusqua || 0) || c.castCharge) pose = 'brasCiel';
  else if (c.cast) {
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

  const img = c.def.fantome ? imagesPersos['fantome-debout'] : imagesPersos[c.def.id + '_' + pose];
  if (img && img.complete && img.naturalWidth > 0) {
    const ih = 175 * c.echelle;
    const iw = ih * 0.6;
    ctx.save();
    if (c.def.fantome) ctx.globalAlpha = 0.75;
    ctx.translate(c.x, c.y);
    if (t < (c.tombeJusqua || 0)) ctx.rotate(-1.45 * face);
    else if (t < (c.toucheJusqua || 0)) ctx.rotate(-0.14 * face);
    ctx.scale(face, 1);
    ctx.drawImage(img, -iw / 2, -ih, iw, ih);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(c.x, c.y);
  if (t < (c.tombeJusqua || 0)) ctx.rotate(-1.45 * face);
  else if (t < (c.toucheJusqua || 0)) ctx.rotate(-0.14 * face);
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
  ctx.font = 'bold 18px sans-serif';
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

function dessinerExplosions(t) {
  explosions.forEach(e => {
    const k = Math.min(1, (t - e.t0) / 500);
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r + (e.maxR - e.r) * k, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, ' + Math.round(200 - 150 * k) + ', 30, ' + (0.75 * (1 - k)) + ')';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 240, 150, ' + (1 - k) + ')';
    ctx.lineWidth = 4;
    ctx.stroke();
  });
}

function dessinerProjectiles(t) {
  projectiles.forEach(p => {
    const dir = Math.sign(p.vx) || 1;
    for (let k = 3; k >= 1; k--) {
      const tx = p.x - dir * k * 12;
      ctx.beginPath();
      ctx.arc(tx, p.y, p.r * 1.5 * (1 - k / 4), 0, Math.PI * 2);
      ctx.fillStyle = p.type === 'bulle'
        ? 'rgba(140, 190, 255, ' + (0.10 * (4 - k)) + ')'
        : p.type === 'bombe' ? 'rgba(60, 60, 70, ' + (0.15 * (4 - k)) + ')'
        : 'rgba(255, 150, 40, ' + (0.12 * (4 - k)) + ')';
      ctx.fill();
    }
  });
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
    if (p.type === 'esprit') {
      ctx.save();
      ctx.globalAlpha = 0.85;
      const img = imagesPersos['fantome-debout'];
      if (img && img.complete) {
        ctx.drawImage(img, p.x - 26, p.y - 66, 52, 87);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 200, 255, 0.6)';
        ctx.fill();
      }
      ctx.restore();
      return;
    }
    if (p.type === 'bulle') {
      g.addColorStop(0, 'rgba(230,245,255,0.95)');
      g.addColorStop(0.75, 'rgba(160,210,255,0.9)');
      g.addColorStop(1, 'rgba(120,180,255,0.9)');
    } else if (p.de === 'joueur') {
      if (p.de === 'joueur') {
        for (let j = projectiles.length - 1; j >= 0; j--) {
          const q = projectiles[j];
          if (q.type === 'esprit' && Math.abs(p.x - q.x) < p.r + q.r && Math.abs(p.y - q.y) < p.r + q.r) {
            projectiles.splice(j, 1);
            messageJ = '👻 Esprit détruit !';
            messageJT = t + 1000;
          }
        }
      }

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
    if (p.type === 'esprit') {
      ctx.save();
      ctx.globalAlpha = 0.85;
      const img = imagesPersos['fantome-debout'];
      if (img && img.complete) {
        ctx.drawImage(img, p.x - 26, p.y - 66, 52, 87);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 200, 255, 0.6)';
        ctx.fill();
      }
      ctx.restore();
      return;
    }
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
  ctx.save();
  if (t < shakeJusqua) {
    ctx.translate((Math.random() - 0.5) * SHAKE_MAG * 2, (Math.random() - 0.5) * SHAKE_MAG * 2);
  }
  dessinerFond(t);
  if (joueur && etat !== 'titre' && etat !== 'heros') {
    dessinerOmbre(boss);
    dessinerOmbre(joueur);
    dessinerCombattant(boss, t);
    dessinerCombattant(joueur, t);
    if (joueur.cast || joueur.castCharge) dessinerEclairs(joueur, t);
    if (boss.cast) dessinerEclairs(boss, t);
    if (t < joueur.flameJusqua) dessinerAura(joueur, t);
    dessinerSignesConfusion(boss, t, Math.max(boss.confusJusqua, boss.bloqueJusqua, boss.antiReflexeJusqua));
    dessinerSignesConfusion(joueur, t, Math.max(joueur.confusJusqua, joueur.etourdiJusqua));
    dessinerOndes();
    dessinerExplosions(t);
    dessinerProjectiles(t);
    dessinerAnnonce(t);
  }
  ctx.restore();
  if (joueur && etat !== 'titre' && etat !== 'heros') {
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
    const ratioS = Math.max(0, Math.min(1, (t - dernierSpeciale) / joueur.stats.cooldownSpe));
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(20, 55, 150, 7);
    ctx.fillStyle = ratioS >= 1 ? '#c39bd3' : '#777';
    ctx.fillRect(20, 55, 150 * ratioS, 7);
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🛡 ironie', 176, 51);
    ctx.fillText('⭐ spé', 176, 62);
    dessinerBoiteTexte(20, 78, 440, t - messageJT < 3000 ? messageJ : (t - phraseJT < 2500 ? phraseJ : ''));
    dessinerBoiteTexte(W - 460, 78, 440, t - messageBT < 3000 ? messageB : (t - phraseBT < 2500 ? phraseB : ''));

  }
}

let dernier = performance.now();
function boucle(t) {
  const bp = element('btn-pause');
  if (bp) bp.classList.toggle('cache', etat !== 'combat');
  const dt = Math.min((t - dernier) / 1000, 0.05);
  dernier = t;
  update(dt, t);
  draw(t);
  requestAnimationFrame(boucle);
}
