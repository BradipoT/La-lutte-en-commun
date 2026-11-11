// Données musicales partagées (jeu + page musique.html)
window.MUSIQUE_MORCEAUX = {
  sombre: {
    bpm: 90,
    typeMel: 'sawtooth', volMel: 0.07,
    typeBass: 'sawtooth', volBass: 0.08,
    melodie: [57, 0, 0, 60, 0, 0, 63, 0, 62, 0, 60, 0, 57, 0, 55, 0, 57, 0, 0, 60, 0, 63, 0, 65, 64, 0, 63, 60, 59, 0, 0, 0],
    basse: [33, 0, 0, 0, 33, 0, 0, 0, 32, 0, 0, 0, 31, 0, 0, 0]
  },
  espoir: {
    bpm: 140,
    typeMel: 'square', volMel: 0.13,
    typeBass: 'triangle', volBass: 0.14,
    melodie: [60, 64, 67, 72, 67, 64, 67, 72, 69, 72, 76, 79, 76, 74, 72, 69, 65, 69, 72, 77, 74, 72, 69, 67, 72, 0, 0, 0, 0, 0, 0, 0],
    basse: [36, 43, 36, 43, 36, 43, 36, 43, 33, 40, 33, 40, 33, 40, 33, 40, 29, 36, 29, 36, 29, 36, 29, 36, 31, 38, 31, 38, 31, 38, 31, 38],
    accords: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]]
  },
  combat: {
    bpm: 170,
    typeMel: 'square', volMel: 0.12,
    typeBass: 'sawtooth', volBass: 0.0,
    melodie: [64, 64, 64, 64, 62, 62, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 62, 64, 62, 60, 59, 57, 57, 57, 57, 57, 57, 57, 57, 57, 57, 57, 59, 60, 59, 57, 55, 53, 53, 53, 53, 53, 53, 53, 53, 53, 53, 53, 55, 57, 55, 53, 57, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55],
    basse: [48, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 45, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 41, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 43, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  marechal: {
    bpm: 170,
    typeMel: 'square', volMel: 0.15,
    typeBass: 'triangle', volBass: 0.0,
    melodie: [64, 64, 67, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 76, 76, 74, 72, 72, 72, 72, 72, 72, 72],
    basse: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  bella: {
    bpm: 140,
    typeMel: 'square', volMel: 0.12,
    typeBass: 'triangle', volBass: 0.16,
    melodie: [0, 64, 69, 71, 72, 69, 69, 69, 69, 64, 69, 71, 72, 69, 69, 69, 69, 64, 69, 71, 72, 72, 71, 69, 72, 72, 71, 69, 76, 76, 76, 76, 76, 76, 74, 76, 77, 77, 77, 77, 77, 77, 76, 74, 77, 76, 76, 76, 76, 76, 74, 72, 71, 71, 76, 76, 72, 72, 71, 71, 69, 69, 69, 69],
    basse: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    accords: [[57, 60, 64], [57, 60, 64], [57, 60, 64], [57, 61, 64], [50, 53, 57], [57, 60, 64], [52, 56, 59], [57, 60, 64]]
  }
};

window.createLecteurMusique = function () {
  let audioCtx = null, musiqueOn = true, seqTimer = null, prochaineNote = 0, stepSeq = 0, morceau = null;
  function freq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
  function jouerNote(midi, t, duree, type, vol) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq(midi);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duree);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + duree + 0.02);
  }
  function jouerHat(t) {
    const tampon = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.03, audioCtx.sampleRate);
    const canal = tampon.getChannelData(0);
    for (let i = 0; i < canal.length; i++) canal[i] = (Math.random() * 2 - 1) * (1 - i / canal.length);
    const src = audioCtx.createBufferSource(); src.buffer = tampon;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    const f = audioCtx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000;
    src.connect(f); f.connect(gain); gain.connect(audioCtx.destination); src.start(t);
  }
  function boucle() {
    if (!audioCtx || !musiqueOn || !morceau) return;
    const duree = 60 / morceau.bpm / 2;
    while (prochaineNote < audioCtx.currentTime + 0.15) {
      const m = morceau.melodie[stepSeq % morceau.melodie.length];
      if (m) jouerNote(m, prochaineNote, duree * 0.9, morceau.typeMel, morceau.volMel);
      const off = morceau.accords ? 4 : 0;
      const idxB = (((stepSeq - off) % morceau.basse.length) + morceau.basse.length) % morceau.basse.length;
      const b = morceau.basse[idxB];
      if (b) jouerNote(b, prochaineNote, duree * 1.8, morceau.typeBass, morceau.volBass);
      const accOff = morceau.accordOffset || 4;
      const accEvery = morceau.accordEvery || 8;
      const rel = ((stepSeq % accEvery) + accEvery) % accEvery;
      if (morceau.accords && (rel === accOff || (morceau.accordDouble && rel === (accOff + 2) % accEvery))) {
        const accord = morceau.accords[Math.floor((((stepSeq - accOff) % morceau.melodie.length) + morceau.melodie.length) % morceau.melodie.length / accEvery) % morceau.accords.length];
        accord.forEach(n => jouerNote(n, prochaineNote, duree * 1.8, 'triangle', 0.09));
      }
      if (morceau.bpm >= 120 && stepSeq % 2 === 1) jouerHat(prochaineNote);
      prochaineNote += duree;
      stepSeq++;
    }
  }
  return {
    demarrer(nom) {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        seqTimer = setInterval(boucle, 50);
      }
      this.setMorceau(nom);
      prochaineNote = audioCtx.currentTime + 0.1;
      if (audioCtx.state === 'suspended') audioCtx.resume();
    },
    setMorceau(nom) {
      morceau = window.MUSIQUE_MORCEAUX[nom];
      stepSeq = 0;
      if (audioCtx) prochaineNote = audioCtx.currentTime + 0.1;
    },
    basculer() {
      musiqueOn = !musiqueOn;
      if (audioCtx) { if (musiqueOn) audioCtx.resume(); else audioCtx.suspend(); }
      return musiqueOn;
    },
    get on() { return musiqueOn; }
  };
};
