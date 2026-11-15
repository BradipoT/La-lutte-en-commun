let audioCtx = null;
let musiqueOn = true;
let seqTimer = null;
let prochaineNote = 0;
let stepSeq = 0;
let morceau = null;

const MORCEAUX = window.MUSIQUE_MORCEAUX;

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
    const off = morceau.accords ? 4 : 0;
    const idxB = (((stepSeq - off) % morceau.basse.length) + morceau.basse.length) % morceau.basse.length;
    const b = morceau.basse[idxB];
    if (b) jouerNote(b, prochaineNote, duree * 1.8, morceau.typeBass, morceau.volBass);
    if (morceau.accords && stepSeq % 8 === 4) {
      const accord = morceau.accords[Math.floor((stepSeq - 4) / 8) % morceau.accords.length];
      accord.forEach(n => jouerNote(n, prochaineNote, duree * 7.5, 'triangle', 0.07));
    }
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
  else if (nom === 'boom') {
    const tampon = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.45, audioCtx.sampleRate);
    const canal = tampon.getChannelData(0);
    for (let i = 0; i < canal.length; i++) canal[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / canal.length, 2);
    const src = audioCtx.createBufferSource(); src.buffer = tampon;
    const f = audioCtx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
    const g = audioCtx.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    src.connect(f); f.connect(g); g.connect(audioCtx.destination); src.start(t);
    sfxNote(130, 40, t, 0.4, 'sine', 0.4);
  }
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
