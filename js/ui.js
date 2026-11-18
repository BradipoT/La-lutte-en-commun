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
    if (!e.repeat) appuiTirDebut = performance.now();
  }
  if (e.code === 'ShiftLeft' || e.code === 'KeyE') special();
  if (e.code === 'KeyF') speciale();
});

window.addEventListener('keyup', e => {
  if (e.code === 'ArrowLeft') touches.gauche = false;
  if (e.code === 'ArrowRight') touches.droite = false;
  if (e.code === 'Space' && appuiTirDebut) {
    const d = performance.now() - appuiTirDebut;
    appuiTirDebut = 0;
    if (d >= 1000) tirCharge();
    else tir();
  }
});

const COULEURS_BARRES = ['#e74c3c', '#e67e22', '#f1c40f', '#82e0aa', '#1e8449'];

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
    if (i === data.heroes.length - 1 && !melenchonDebloque) return;
    const div = document.createElement('div');
    const verrouille = i === data.heroes.length - 1 && !melenchonDebloque;
    div.className = 'carte-heros' + (disponibles[i] ? '' : (verrouille ? ' verrouille' : ' tombe'));
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
      badge.textContent = (i === data.heroes.length - 1 && !melenchonDebloque) ? '🔒 À DÉBLOQUER' : 'Tombé.e au débat';
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
element('btn-i1').addEventListener('click', () => { setMorceau('bella'); montrer('ecran-intro2'); });
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
  if (avantLePen()) return;
  if (indexBoss >= data.boss.length) {
    etat = 'victoire';
    montrer('ecran-victoire');
  } else {
    etat = 'heros';
    construireHeros();
    montrer('ecran-heros');
  }
});
element('btn-continuer-fantome').addEventListener('click', () => {
  setMorceau('sombre');
  reprendreMusique();
  etat = 'fantome-intro';
  montrer('ecran-fantome-intro');
  let i = 0;
  element('texte-fantome').textContent = LIGNES_FANTOME[0];
  element('groupe-fantome').classList.add('cache');
  clearInterval(seqFantome);
  seqFantome = setInterval(() => {
    i++;
    if (i === 1 && sonLoup && musiqueOn) { sonLoup.currentTime = 0; sonLoup.play().catch(() => {}); }
    if (i < LIGNES_FANTOME.length) element('texte-fantome').textContent = LIGNES_FANTOME[i];
    else {
      clearInterval(seqFantome);
      element('groupe-fantome').classList.remove('cache');
      const g = element('ghost-fly');
      g.style.display = 'block';
      g.style.animation = 'none';
      void g.offsetWidth;
      g.style.animation = '';
    }
  }, 2000);
});
function lancerCombatFantome() {
  combatFantome = true;
  const b = data.fantome;
  element('vs-texte').textContent = data.heroes[herosChoisi].nom + ' affronte ' + b.nom;
  const av = element('vs-avertissement');
  av.textContent = b.avertissement || '';
  av.style.display = b.avertissement ? 'block' : 'none';
  etat = 'versus';
  montrer('ecran-versus');
}
element('btn-fantome-meme').addEventListener('click', lancerCombatFantome);
element('btn-fantome-changer').addEventListener('click', () => {
  etat = 'heros';
  construireHeros();
  montrer('ecran-heros');
});
element('btn-retour-menu').addEventListener('click', () => {
  combatFantome = false;
  setMorceau('sombre');
  resetPartie();
  etat = 'titre';
  montrer('ecran-titre');
});
function auClic(id, fn) { const el = element(id); if (el) el.addEventListener('click', fn); }
function auTap(id, fn) {
  const el = element(id);
  if (!el) return;
  let fait = false;
  const exec = e => { if (fait) return; fait = true; e.preventDefault(); fn(); };
  el.addEventListener('pointerdown', exec);
  el.addEventListener('touchstart', exec);
  el.addEventListener('click', exec);
}
let dernierTapPause = 0;
function pauseOuvrir() {
  const maintenant = performance.now();
  if (maintenant - dernierTapPause < 400) return;
  dernierTapPause = maintenant;
  if (etat !== 'combat') return;
  etat = 'pause';
  pauseMusique();
  montrer('ecran-pause');
}
function pauseReprendre() {
  const maintenant = performance.now();
  if (maintenant - dernierTapPause < 400) return;
  dernierTapPause = maintenant;
  etat = 'combat';
  reprendreMusique();
  cacherTout();
  const c = element('controles');
  if (c) c.classList.remove('cache');
}
function pauseRedemarrer() {
  const maintenant = performance.now();
  if (maintenant - dernierTapPause < 400) return;
  dernierTapPause = maintenant;
  reprendreMusique();
  commencerCombat();
}
window.pauseOuvrir = pauseOuvrir;
window.pauseReprendre = pauseReprendre;
window.pauseRedemarrer = pauseRedemarrer;
element('btn-arrivee-suite').addEventListener('click', () => montrer('ecran-melenchon'));
element('btn-melenchon-ok').addEventListener('click', () => {
  reprendreMusique();
  etat = 'heros';
  construireHeros();
  montrer('ecran-heros');
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
const btnTir = element('btn-tir');
btnTir.addEventListener('pointerdown', e => {
  e.preventDefault();
  appuiTirDebut = performance.now();
  if (etat === 'combat' && !joueur.castCharge && performance.now() >= joueur.toucheJusqua && performance.now() >= joueur.confusJusqua) {
    joueur.castCharge = appuiTirDebut;
  }
});
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btnTir.addEventListener(ev, () => {
  if (!appuiTirDebut) return;
  const d = performance.now() - appuiTirDebut;
  appuiTirDebut = 0;
  joueur.castCharge = 0;
  if (d >= 1000) tirCharge();
  else tir();
}));
lierBouton('btn-special', special);
lierBouton('btn-speciale', speciale);

chargerImages();
montrer('ecran-titre');
requestAnimationFrame(boucle);
