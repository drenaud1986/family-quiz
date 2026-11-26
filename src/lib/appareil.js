// Voix, vibrations, écran allumé, plein écran.

let voixActive = true;
let vitesse = 1;
let hauteur = 1.05;
let nomVoix = '';
let voixFr = null;

export function configurerVoix({ voix, vitesseVoix, hauteurVoix, nomVoix: nom }) {
  voixActive = voix;
  vitesse = vitesseVoix ?? 1;
  hauteur = hauteurVoix ?? 1.05;
  nomVoix = nom ?? '';
  voixFr = choisirVoix();
  if (!voix) taire();
}

/** Les voix françaises disponibles sur l'appareil (elles varient d'un appareil à l'autre). */
export function voixFrancaises() {
  if (!('speechSynthesis' in window)) return [];
  return speechSynthesis
    .getVoices()
    .filter((v) => v.lang?.toLowerCase().startsWith('fr'))
    .sort((a, b) => (a.lang === 'fr-FR' ? -1 : 0) - (b.lang === 'fr-FR' ? -1 : 0) || a.name.localeCompare(b.name));
}

/** Attend que la liste des voix soit chargée (elle arrive en différé sur Chrome). */
export function chargerVoix() {
  return new Promise((resoudre) => {
    if (!('speechSynthesis' in window)) return resoudre([]);
    const liste = voixFrancaises();
    if (liste.length) return resoudre(liste);
    const fin = () => resoudre(voixFrancaises());
    speechSynthesis.addEventListener?.('voiceschanged', fin, { once: true });
    setTimeout(fin, 1500);
  });
}

function choisirVoix() {
  const voix = voixFrancaises();
  return (
    voix.find((v) => v.name === nomVoix) ??
    voix.find((v) => v.lang === 'fr-FR' && /google/i.test(v.name)) ??
    voix.find((v) => v.lang === 'fr-FR') ??
    voix[0] ??
    null
  );
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
    u.pitch = hauteur;
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
