import { lireReglages, ecrireReglage } from './db.js';
import { configurerAudio } from './audio.js';
import { configurerVoix } from './appareil.js';

// ---------- Navigation ----------

export const nav = $state({ ecran: 'accueil', params: {} });

const pile = [];
let surRetour = null;

/** Va à un écran. `remplacer` évite d'empiler (pour les étapes d'un même parcours). */
export function aller(ecran, params = {}, { remplacer = false } = {}) {
  if (!remplacer) {
    pile.push({ ecran: nav.ecran, params: nav.params });
    history.pushState({ n: pile.length }, '');
  }
  nav.ecran = ecran;
  nav.params = params;
  surRetour = null;
}

export function retour() {
  const precedent = pile.pop();
  if (precedent) {
    nav.ecran = precedent.ecran;
    nav.params = precedent.params;
  } else {
    nav.ecran = 'accueil';
    nav.params = {};
  }
  surRetour = null;
}

export function accueil() {
  pile.length = 0;
  nav.ecran = 'accueil';
  nav.params = {};
  surRetour = null;
}

/** Un écran peut intercepter le bouton retour d'Android (ex. : pause pendant l'émission). */
export function intercepterRetour(fn) {
  surRetour = fn;
  return () => {
    if (surRetour === fn) surRetour = null;
  };
}

window.addEventListener('popstate', () => {
  if (surRetour) {
    history.pushState({ n: pile.length }, '');
    surRetour();
    return;
  }
  retour();
});

// ---------- Réglages ----------

export const REGLAGES_DEFAUT = { son: true, musique: true, voix: true, vitesseVoix: 1, hauteurVoix: 1.05, nomVoix: '', dureeParDefaut: 'normale' };

export const reglages = $state({ ...REGLAGES_DEFAUT });

export async function chargerReglages() {
  Object.assign(reglages, REGLAGES_DEFAUT, await lireReglages());
  appliquerReglages();
}

export async function changerReglage(cle, valeur) {
  reglages[cle] = valeur;
  appliquerReglages();
  await ecrireReglage(cle, valeur);
}

function appliquerReglages() {
  configurerAudio({ son: reglages.son, musique: reglages.musique });
  configurerVoix({ voix: reglages.voix, vitesseVoix: reglages.vitesseVoix, hauteurVoix: reglages.hauteurVoix, nomVoix: reglages.nomVoix });
}
