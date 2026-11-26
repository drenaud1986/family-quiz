// Effets sonores générés par le navigateur (Web Audio) : aucun fichier, aucun droit d'auteur.

let ctx = null;
let maitre = null;
let actif = true;
let musiqueActive = true;
let boucleMusique = null;

export function configurerAudio({ son, musique }) {
  actif = son;
  musiqueActive = musique;
  if (!musique) arreterMusique();
}

/** À appeler lors d'un geste de l'utilisateur pour débloquer le son. */
export function debloquerAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    maitre = ctx.createGain();
    maitre.gain.value = 0.5;
    maitre.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function pret() {
  if (!actif || !ctx) return false;
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}

function note(freq, debut, duree, { type = 'triangle', volume = 0.3, glisse = null, sortie = maitre } = {}) {
  const t = ctx.currentTime + debut;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (glisse) osc.frequency.exponentialRampToValueAtTime(glisse, t + duree);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volume, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  osc.connect(g).connect(sortie);
  osc.start(t);
  osc.stop(t + duree + 0.05);
}

function bruit(debut, duree, { volume = 0.2, filtre = 1200, q = 0.8, typeFiltre = 'bandpass', montee = 0.01 } = {}) {
  const t = ctx.currentTime + debut;
  const taille = Math.max(1, Math.floor(ctx.sampleRate * duree));
  const buffer = ctx.createBuffer(1, taille, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < taille; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const f = ctx.createBiquadFilter();
  f.type = typeFiltre;
  f.frequency.value = filtre;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volume, t + montee);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  src.connect(f).connect(g).connect(maitre);
  src.start(t);
}

const N = { do: 523.25, re: 587.33, mi: 659.25, fa: 698.46, sol: 783.99, la: 880, si: 987.77, do2: 1046.5, mi2: 1318.5, sol2: 1568 };

export const sons = {
  clic() {
    if (!pret()) return;
    note(880, 0, 0.06, { type: 'sine', volume: 0.15 });
  },
  pop() {
    if (!pret()) return;
    note(500, 0, 0.12, { type: 'sine', volume: 0.25, glisse: 900 });
  },
  whoosh() {
    if (!pret()) return;
    bruit(0, 0.35, { volume: 0.18, filtre: 600, q: 0.6, montee: 0.15 });
  },
  generique() {
    if (!pret()) return;
    const m = [N.do, N.mi, N.sol, N.do2, N.sol, N.do2, N.mi2, N.sol2];
    m.forEach((f, i) => note(f, i * 0.11, 0.25, { type: 'square', volume: 0.12 }));
    [N.do, N.mi, N.sol].forEach((f) => note(f, 0.95, 0.9, { type: 'triangle', volume: 0.2 }));
    note(N.do2, 0.95, 0.9, { type: 'triangle', volume: 0.2 });
    cymbale(0.95);
  },
  jingle() {
    if (!pret()) return;
    [N.sol, N.la, N.si, N.do2].forEach((f, i) => note(f, i * 0.09, 0.2, { type: 'square', volume: 0.12 }));
    [N.do, N.mi, N.sol, N.do2].forEach((f) => note(f, 0.4, 0.6, { type: 'triangle', volume: 0.16 }));
  },
  bonne() {
    if (!pret()) return;
    note(N.mi, 0, 0.15, { type: 'triangle', volume: 0.3 });
    note(N.do2, 0.12, 0.4, { type: 'triangle', volume: 0.3 });
    note(N.sol2, 0.12, 0.4, { type: 'sine', volume: 0.12 });
  },
  mauvaise() {
    if (!pret()) return;
    note(220, 0, 0.25, { type: 'sawtooth', volume: 0.15, glisse: 180 });
    note(160, 0.25, 0.5, { type: 'sawtooth', volume: 0.15, glisse: 110 });
  },
  tic(urgent = false) {
    if (!pret()) return;
    note(urgent ? 1400 : 1000, 0, 0.04, { type: 'square', volume: urgent ? 0.12 : 0.06 });
  },
  finChrono() {
    if (!pret()) return;
    note(440, 0, 0.6, { type: 'square', volume: 0.15 });
    note(445, 0, 0.6, { type: 'square', volume: 0.15 });
  },
  roulement(duree = 1.4) {
    if (!pret()) return;
    const coups = Math.floor(duree / 0.045);
    for (let i = 0; i < coups; i++) bruit(i * 0.045, 0.05, { volume: 0.08 + (i / coups) * 0.12, filtre: 300, q: 1.2 });
    cymbale(duree);
  },
  suspense() {
    if (!pret()) return;
    note(196, 0, 1.2, { type: 'triangle', volume: 0.12, glisse: 392 });
  },
  applaudissements(duree = 2.5) {
    if (!pret()) return;
    for (let i = 0; i < duree * 40; i++) {
      bruit(Math.random() * duree, 0.04 + Math.random() * 0.04, { volume: 0.05 + Math.random() * 0.1, filtre: 1500 + Math.random() * 2500, q: 1.5 });
    }
  },
  fanfare() {
    if (!pret()) return;
    const accords = [
      [N.do, N.mi, N.sol],
      [N.fa, N.la, N.do2],
      [N.sol, N.si, N.re * 2],
      [N.do2, N.mi2, N.sol2]
    ];
    accords.forEach((a, i) => a.forEach((f) => note(f, i * 0.28, i === 3 ? 1.2 : 0.3, { type: 'square', volume: 0.08 })));
    cymbale(0.84);
  },
  or() {
    if (!pret()) return;
    [N.do2, N.mi2, N.sol2, N.mi2 * 2].forEach((f, i) => note(f, i * 0.07, 0.35, { type: 'sine', volume: 0.14 }));
    [N.sol2, N.do2 * 2].forEach((f, i) => note(f, 0.3 + i * 0.12, 0.6, { type: 'triangle', volume: 0.1 }));
  },
  serie() {
    if (!pret()) return;
    [N.do, N.mi, N.sol, N.do2, N.mi2].forEach((f, i) => note(f, i * 0.06, 0.18, { type: 'square', volume: 0.09 }));
    bruit(0.3, 0.5, { volume: 0.1, filtre: 5000, q: 0.5, typeFiltre: 'highpass' });
  },
  points() {
    if (!pret()) return;
    [0, 1, 2, 3].forEach((i) => note(1200 + i * 200, i * 0.05, 0.08, { type: 'sine', volume: 0.12 }));
  }
};

function cymbale(debut) {
  bruit(debut, 1.2, { volume: 0.12, filtre: 7000, q: 0.5, typeFiltre: 'highpass' });
}

/** Petite musique de la rafale : le tempo accélère avec le temps. */
export function lancerMusiqueRafale(dureeSecondes) {
  arreterMusique();
  if (!actif || !musiqueActive || !ctx) return;
  const debut = ctx.currentTime;
  const motif = [N.do, N.mi, N.sol, N.mi, N.la, N.sol, N.mi, N.re];
  let pas = 0;
  let prochain = ctx.currentTime + 0.05;
  boucleMusique = setInterval(() => {
    const ecoule = ctx.currentTime - debut;
    const intervalle = Math.max(0.12, 0.26 - (ecoule / dureeSecondes) * 0.14);
    while (prochain < ctx.currentTime + 0.2) {
      const t = prochain - ctx.currentTime;
      note(motif[pas % motif.length] / 2, t, intervalle * 0.9, { type: 'square', volume: 0.05 });
      if (pas % 2 === 0) note(N.do / 4, t, intervalle, { type: 'triangle', volume: 0.12 });
      pas++;
      prochain += intervalle;
    }
  }, 50);
}

export function arreterMusique() {
  if (boucleMusique) clearInterval(boucleMusique);
  boucleMusique = null;
}
