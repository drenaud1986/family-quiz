// Voix, vibrations, écran allumé, plein écran.

let voixActive = true;
let vitesse = 1;
let voixFr = null;

export function configurerVoix({ voix, vitesseVoix }) {
  voixActive = voix;
  vitesse = vitesseVoix ?? 1;
  if (!voix) taire();
}

function choisirVoix() {
  if (!('speechSynthesis' in window)) return null;
  const voix = speechSynthesis.getVoices();
  return voix.find((v) => v.lang === 'fr-FR' && /google/i.test(v.name)) ?? voix.find((v) => v.lang?.startsWith('fr')) ?? null;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  voixFr = choisirVoix();
  speechSynthesis.addEventListener?.('voiceschanged', () => (voixFr = choisirVoix()));
}

/** Lit un texte à voix haute. Renvoie une promesse résolue à la fin de la lecture. */
export function dire(texte) {
  return new Promise((resoudre) => {
    if (!voixActive || !texte || !('speechSynthesis' in window)) return resoudre();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texte.replace(/[«»“”]/g, ''));
    u.lang = 'fr-FR';
    if (voixFr) u.voice = voixFr;
    u.rate = vitesse;
    u.pitch = 1.05;
    u.onend = () => resoudre();
    u.onerror = () => resoudre();
    speechSynthesis.speak(u);
    // Garde-fou : certaines voix n'envoient jamais « onend ».
    setTimeout(resoudre, 400 + texte.length * 90);
  });
}

export function taire() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

export function vibrer(motif) {
  try {
    navigator.vibrate?.(motif);
  } catch {
    /* non disponible */
  }
}

let verrou = null;

export async function garderEcranAllume() {
  try {
    if ('wakeLock' in navigator && !verrou) {
      verrou = await navigator.wakeLock.request('screen');
      verrou.addEventListener('release', () => (verrou = null));
    }
  } catch {
    /* refusé ou non disponible */
  }
}

export function libererEcran() {
  verrou?.release?.();
  verrou = null;
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && verrouSouhaite) garderEcranAllume();
});
let verrouSouhaite = false;
export function souhaiterEcranAllume(oui) {
  verrouSouhaite = oui;
  if (oui) garderEcranAllume();
  else libererEcran();
}

export async function pleinEcran() {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    }
  } catch {
    /* refusé */
  }
}
