// Effets sonores et jingles générés par le navigateur (Web Audio) : aucun fichier, aucun droit d'auteur.
// Chaîne : sources → (sec + réverbération de plateau) → compresseur → haut-parleur.

let ctx = null;
let maitre = null; // entrée sèche
let reverb = null; // envoi vers la réverbération
let actif = true;
let musiqueActive = true;
let boucleMusique = null;
let bufferBruit = null;

export function configurerAudio({ son, musique }) {
  actif = son;
  musiqueActive = musique;
  if (!musique) arreterMusique();
}

/** Réponse impulsionnelle synthétique : une salle de télé, ~1,6 s. */
function impulsion(duree = 1.6, decroissance = 3) {
  const taille = Math.floor(ctx.sampleRate * duree);
  const ir = ctx.createBuffer(2, taille, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < taille; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / taille, decroissance);
  }
  return ir;
}

/** À appeler lors d'un geste de l'utilisateur pour débloquer le son. */
export function debloquerAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const compresseur = ctx.createDynamicsCompressor();
    compresseur.threshold.value = -16;
    compresseur.ratio.value = 4;
    compresseur.connect(ctx.destination);
    const sortie = ctx.createGain();
    sortie.gain.value = 0.6;
    sortie.connect(compresseur);
    maitre = ctx.createGain();
    maitre.connect(sortie);
    const conv = ctx.createConvolver();
    conv.buffer = impulsion();
    const retour = ctx.createGain();
    retour.gain.value = 0.28;
    reverb = ctx.createGain();
    reverb.connect(conv).connect(retour).connect(sortie);
    // Bruit blanc réutilisé par tous les sons (évite d'en recréer à chaque fois).
    bufferBruit = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = bufferBruit.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    chargerEnregistrements();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

// Bruitages enregistrés (Kenney.nl, CC0) dans public/sons/. Sans eux, les sons synthétiques prennent le relais.
// [fichier, volume] : les fichiers n'ont pas tous le même niveau.
const ENREGISTREMENTS = {
  clic: ['clic.ogg', 0.6],
  pop: ['pop.ogg', 0.7],
  whoosh: ['whoosh.ogg', 0.6],
  bonne: ['bonne.ogg', 0.9],
  mauvaise: ['mauvaise.ogg', 1],
  jingle: ['jingle.ogg', 1],
  generique: ['generique.ogg', 1],
  fanfare: ['fanfare.ogg', 2.4],
  or: ['or.mp3', 4],
  serie: ['serie.mp3', 4],
  tic: ['tic.ogg', 0.5]
};
const tampons = {};

function chargerEnregistrements() {
  for (const [nom, [fichier]] of Object.entries(ENREGISTREMENTS)) {
    fetch(`${import.meta.env.BASE_URL}sons/${fichier}`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then((a) => new Promise((ok, ko) => ctx.decodeAudioData(a, ok, ko)))
      .then((b) => (tampons[nom] = b))
      .catch(() => {});
  }
}

/** Joue l'enregistrement s'il est chargé ; renvoie false sinon (le son synthétique est alors utilisé). */
function jouer(nom, debut = 0, facteur = 1, humide = 0.25) {
  const b = tampons[nom];
  if (!b) return false;
  const src = ctx.createBufferSource();
  src.buffer = b;
  const g = ctx.createGain();
  g.gain.value = ENREGISTREMENTS[nom][1] * facteur;
  src.connect(g);
  brancher(g, humide);
  src.start(ctx.currentTime + debut);
  return true;
}

function pret() {
  if (!actif || !ctx) return false;
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}

/** Branche un nœud sur la sortie sèche et, en partie, sur la réverbération. */
function brancher(noeud, humide = 0.5) {
  noeud.connect(maitre);
  if (humide > 0) {
    const g = ctx.createGain();
    g.gain.value = humide;
    noeud.connect(g).connect(reverb);
  }
}

function enveloppe(g, t, volume, attaque, duree) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volume, t + attaque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
}

function note(freq, debut, duree, { type = 'triangle', volume = 0.3, glisse = null, humide = 0.4, attaque = 0.012, vibrato = 0 } = {}) {
  const t = ctx.currentTime + debut;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (glisse) osc.frequency.exponentialRampToValueAtTime(glisse, t + duree);
  if (vibrato) {
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = 5.5;
    lg.gain.value = freq * vibrato;
    lfo.connect(lg).connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + duree + 0.05);
  }
  enveloppe(g, t, volume, attaque, duree);
  osc.connect(g);
  brancher(g, humide);
  osc.start(t);
  osc.stop(t + duree + 0.05);
}

/** Cuivre : deux dents de scie désaccordées dans un filtre qui s'ouvre (fanfare de plateau). */
function cuivre(freq, debut, duree, volume = 0.1) {
  const t = ctx.currentTime + debut;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.Q.value = 2;
  f.frequency.setValueAtTime(freq * 1.5, t);
  f.frequency.exponentialRampToValueAtTime(freq * 6, t + 0.06);
  f.frequency.exponentialRampToValueAtTime(freq * 3, t + duree);
  const g = ctx.createGain();
  enveloppe(g, t, volume, 0.03, duree);
  for (const d of [-6, 6]) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    o.detune.value = d;
    o.connect(f);
    o.start(t);
    o.stop(t + duree + 0.05);
  }
  f.connect(g);
  brancher(g, 0.5);
}

/** Cloche / carillon : partiels inharmoniques qui s'éteignent lentement. */
function cloche(freq, debut, volume = 0.12, duree = 1.4) {
  [1, 2.76, 5.4].forEach((r, i) => note(freq * r, debut, duree / (i + 1), { type: 'sine', volume: volume / (i + 1), humide: 0.7, attaque: 0.003 }));
}

function bruit(debut, duree, { volume = 0.2, filtre = 1200, q = 0.8, typeFiltre = 'bandpass', montee = 0.005, humide = 0.3, glisseFiltre = null } = {}) {
  const t = ctx.currentTime + debut;
  const src = ctx.createBufferSource();
  src.buffer = bufferBruit;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = typeFiltre;
  f.frequency.setValueAtTime(filtre, t);
  if (glisseFiltre) f.frequency.exponentialRampToValueAtTime(glisseFiltre, t + duree);
  f.Q.value = q;
  const g = ctx.createGain();
  enveloppe(g, t, volume, montee, duree);
  src.connect(f).connect(g);
  brancher(g, humide);
  src.start(t, Math.random() * 1.5);
  src.stop(t + duree + 0.05);
}

// Batterie
function grosseCaisse(debut, volume = 0.5) {
  note(150, debut, 0.35, { type: 'sine', volume, glisse: 45, humide: 0.1, attaque: 0.002 });
}
function caisseClaire(debut, volume = 0.25) {
  bruit(debut, 0.18, { volume, filtre: 1800, q: 0.7, humide: 0.4 });
  note(220, debut, 0.1, { type: 'triangle', volume: volume * 0.6, glisse: 160, humide: 0.2, attaque: 0.002 });
}
function cymbale(debut, volume = 0.1) {
  bruit(debut, 1.6, { volume, filtre: 6500, q: 0.4, typeFiltre: 'highpass', humide: 0.6 });
}

const N = { do: 523.25, re: 587.33, mi: 659.25, fa: 698.46, sol: 783.99, la: 880, si: 987.77, do2: 1046.5, re2: 1174.7, mi2: 1318.5, sol2: 1568 };

export const sons = {
  clic() {
    if (!pret() || jouer('clic')) return;
    note(1200, 0, 0.04, { type: 'sine', volume: 0.12, humide: 0.1, attaque: 0.002 });
  },
  pop() {
    if (!pret() || jouer('pop')) return;
    note(420, 0, 0.1, { type: 'sine', volume: 0.25, glisse: 1100, humide: 0.2, attaque: 0.004 });
  },
  whoosh() {
    if (!pret() || jouer('whoosh')) return;
    bruit(0, 0.45, { volume: 0.2, filtre: 300, glisseFiltre: 3000, q: 1.2, montee: 0.2, humide: 0.4 });
  },
  generique() {
    if (!pret()) return;
    // Roulement, montée de cuivres, accord final avec cymbale : le générique de l'émission.
    for (let i = 0; i < 10; i++) caisseClaire(i * 0.05, 0.08 + i * 0.015);
    if (jouer('generique', 0.5)) {
      grosseCaisse(0.5, 0.6);
      cymbale(0.5, 0.12);
      return;
    }
    const m = [N.do, N.mi, N.sol, N.do2, N.sol, N.do2, N.mi2];
    m.forEach((f, i) => cuivre(f / 2, 0.5 + i * 0.12, 0.22, 0.09));
    grosseCaisse(0.5);
    grosseCaisse(0.86);
    caisseClaire(1.1);
    [N.do, N.mi, N.sol, N.do2].forEach((f) => cuivre(f / 2, 1.34, 1.3, 0.08));
    note(N.do2, 1.34, 1.3, { type: 'triangle', volume: 0.12, vibrato: 0.006 });
    grosseCaisse(1.34, 0.6);
    cymbale(1.34, 0.14);
  },
  jingle() {
    if (!pret() || jouer('jingle')) return;
    [N.sol, N.la, N.si, N.do2].forEach((f, i) => note(f, i * 0.08, 0.18, { type: 'square', volume: 0.07 }));
    [N.do, N.mi, N.sol].forEach((f) => cuivre(f / 2, 0.36, 0.7, 0.08));
    grosseCaisse(0.36);
    cymbale(0.36, 0.07);
  },
  bonne() {
    if (!pret()) return;
    // « Ding-ding ! » de plateau.
    if (jouer('bonne')) return;
    cloche(N.mi2, 0, 0.13, 1);
    cloche(N.do2 * 1.5, 0.13, 0.13, 1.4);
  },
  mauvaise() {
    if (!pret()) return;
    // Buzzer « mééé ».
    if (jouer('mauvaise')) return;
    note(150, 0, 0.55, { type: 'sawtooth', volume: 0.12, glisse: 135, humide: 0.2, attaque: 0.01 });
    note(155, 0, 0.55, { type: 'square', volume: 0.07, glisse: 138, humide: 0.2, attaque: 0.01 });
    note(75, 0, 0.55, { type: 'sawtooth', volume: 0.08, humide: 0.1 });
  },
  tic(urgent = false) {
    if (!pret() || jouer('tic', 0, urgent ? 1.8 : 1, 0)) return;
    note(urgent ? 1500 : 1000, 0, 0.03, { type: 'square', volume: urgent ? 0.1 : 0.05, humide: 0.05, attaque: 0.002 });
    bruit(0, 0.02, { volume: urgent ? 0.08 : 0.04, filtre: 4000, q: 2, humide: 0 });
  },
  finChrono() {
    if (!pret()) return;
    note(440, 0, 0.7, { type: 'square', volume: 0.12, humide: 0.3 });
    note(446, 0, 0.7, { type: 'square', volume: 0.12, humide: 0.3 });
    note(220, 0, 0.7, { type: 'sawtooth', volume: 0.06 });
  },
  roulement(duree = 1.4) {
    if (!pret()) return;
    const coups = Math.floor(duree / 0.04);
    for (let i = 0; i < coups; i++) caisseClaire(i * 0.04, 0.04 + (i / coups) * 0.16);
    grosseCaisse(duree, 0.6);
    cymbale(duree, 0.13);
  },
  suspense() {
    if (!pret()) return;
    note(98, 0, 1.4, { type: 'sawtooth', volume: 0.06, glisse: 196, humide: 0.6 });
    note(196, 0, 1.4, { type: 'triangle', volume: 0.1, glisse: 392, vibrato: 0.01, humide: 0.6 });
    bruit(0, 1.4, { volume: 0.05, filtre: 400, glisseFiltre: 4000, q: 3, montee: 1.2, humide: 0.6 });
  },
  applaudissements(duree = 2.5) {
    if (!pret()) return;
    // Rumeur de la salle + claquements individuels + quelques sifflets et « wouh ».
    bruit(0, duree + 0.6, { volume: 0.07, filtre: 1600, q: 0.4, montee: 0.25, humide: 0.6 });
    const n = Math.floor(duree * 70);
    for (let i = 0; i < n; i++) {
      const t = Math.random() * duree;
      bruit(t, 0.025 + Math.random() * 0.03, { volume: 0.04 + Math.random() * 0.1, filtre: 900 + Math.random() * 2600, q: 1.2 + Math.random(), humide: 0.5 });
    }
    if (duree >= 1.5) {
      const sifflet = 1800 + Math.random() * 400;
      note(sifflet, 0.3, 0.35, { type: 'sine', volume: 0.05, glisse: sifflet * 1.25, humide: 0.6 });
      note(sifflet * 1.1, 0.75, 0.25, { type: 'sine', volume: 0.04, glisse: sifflet * 0.9, humide: 0.6 });
    }
  },
  fanfare() {
    if (!pret()) return;
    if (jouer('fanfare', 0.15)) {
      grosseCaisse(0, 0.5);
      caisseClaire(0.08, 0.15);
      cymbale(0.15, 0.13);
      return;
    }
    const accords = [
      [N.do, N.mi, N.sol],
      [N.fa, N.la, N.do2],
      [N.sol, N.si, N.re2],
      [N.do2, N.mi2, N.sol2]
    ];
    accords.forEach((a, i) => {
      a.forEach((f) => cuivre(f / 2, i * 0.26, i === 3 ? 1.6 : 0.24, 0.07));
      grosseCaisse(i * 0.26, 0.4);
      if (i < 3) caisseClaire(i * 0.26 + 0.13, 0.12);
    });
    cymbale(0.78, 0.15);
    cloche(N.sol2, 0.78, 0.08, 1.6);
  },
  or() {
    if (!pret()) return;
    // Scintillement doré.
    if (jouer('or', 0, 1, 0.5)) {
      bruit(0, 1, { volume: 0.04, filtre: 9000, q: 0.5, typeFiltre: 'highpass', montee: 0.3, humide: 0.8 });
      return;
    }
    [N.do2, N.mi2, N.sol2, N.do2 * 2, N.mi2 * 2].forEach((f, i) => cloche(f, i * 0.06, 0.07, 0.9));
    bruit(0, 1, { volume: 0.05, filtre: 9000, q: 0.5, typeFiltre: 'highpass', montee: 0.3, humide: 0.8 });
  },
  serie() {
    if (!pret()) return;
    if (jouer('serie')) return cymbale(0.3, 0.08);
    [N.do, N.mi, N.sol, N.do2, N.mi2].forEach((f, i) => note(f, i * 0.055, 0.16, { type: 'square', volume: 0.07 }));
    bruit(0.1, 0.6, { volume: 0.1, filtre: 500, glisseFiltre: 6000, q: 1, montee: 0.2, humide: 0.4 });
    cymbale(0.3, 0.08);
  },
  points() {
    if (!pret()) return;
    // Pièces qui tombent dans la caisse.
    [0, 1, 2, 3].forEach((i) => cloche(1800 + i * 260, i * 0.05, 0.05, 0.35));
  }
};

/** Musique de la rafale : batterie + basse + mélodie, le tempo accélère avec le temps. */
export function lancerMusiqueRafale(dureeSecondes) {
  arreterMusique();
  if (!actif || !musiqueActive || !ctx) return;
  const debut = ctx.currentTime;
  const motif = [N.do, N.mi, N.sol, N.mi, N.la, N.sol, N.mi, N.re];
  const basse = [N.do / 4, N.do / 4, N.la / 8, N.la / 8, N.fa / 4, N.fa / 4, N.sol / 4, N.sol / 4];
  let pas = 0;
  let prochain = ctx.currentTime + 0.05;
  boucleMusique = setInterval(() => {
    const ecoule = ctx.currentTime - debut;
    const intervalle = Math.max(0.11, 0.24 - (ecoule / dureeSecondes) * 0.13);
    while (prochain < ctx.currentTime + 0.2) {
      const t = prochain - ctx.currentTime;
      note(motif[pas % motif.length] / 2, t, intervalle * 0.8, { type: 'square', volume: 0.035, humide: 0.2 });
      if (pas % 2 === 0) note(basse[(pas / 2) % basse.length], t, intervalle * 1.8, { type: 'triangle', volume: 0.14, humide: 0.05 });
      if (pas % 4 === 0) grosseCaisse(t, 0.3);
      if (pas % 4 === 2) caisseClaire(t, 0.08);
      bruit(t, 0.03, { volume: 0.025, filtre: 8000, typeFiltre: 'highpass', humide: 0 });
      pas++;
      prochain += intervalle;
    }
  }, 50);
}

export function arreterMusique() {
  if (boucleMusique) clearInterval(boucleMusique);
  boucleMusique = null;
}
