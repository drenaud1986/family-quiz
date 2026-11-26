import { db, listerReponses, listerHistorique, enregistrerPartie } from './db.js';
import { genererManches, formerEquipes, bonusAge } from './jeu.js';
import { reglages } from './etat.svelte.js';
import { souvenirs } from './banque.js';

/**
 * Prépare et enregistre une nouvelle émission.
 * @param {object} o
 * @param {object[]} o.presents  candidats qui jouent
 * @param {string} o.mode        individuel | enfants-parents | filles-garcons | connaitre
 * @param {string} o.duree       courte | normale | longue
 * @param {object} [o.cible]     mode « connaitre » : le candidat dont on teste la connaissance
 * @returns {Promise<number|null>} l'identifiant de la partie, ou null s'il manque des réponses
 */
export async function creerPartie({ presents, mode, duree, cible = null, manches: manchesChoisies = null, rigolo = false }) {
  const [reponses, historique, parties] = await Promise.all([
    listerReponses(),
    listerHistorique(),
    db.parties.where('terminee').equals(1).toArray()
  ]);
  const equipes = cible ? null : formerEquipes(mode, presents);
  const partiesRecentes = parties
    .filter((p) => !p.abandonnee)
    .sort((a, b) => b.date - a.date)
    .slice(0, 3)
    .map((p) => p.id);
  // Seuls les candidats présents (et la cible) comptent : aucune question ne parle d'un absent.
  const concernes = cible ? [...presents, cible] : presents;
  const manches = genererManches(
    { joueursPartie: presents, tousJoueurs: concernes, reponses, historique, partiesRecentes, equipes, cible, souvenirs },
    duree,
    { manches: manchesChoisies, rigolo }
  );
  const total = manches.reduce((n, m) => n + (m.etapes?.length ?? m.joueurs.length), 0);
  const minimum = cible ? 4 : presents.length * 2;
  if (!manches.length || (!cible && manches.length < 2) || total < minimum) return null;

  const partie = {
    date: Date.now(),
    terminee: 0,
    joueurs: presents.map((j) => j.id),
    cible: cible?.id ?? null,
    rigolo,
    // Coup de pouce aux plus jeunes : points multipliés selon l'âge (réglage).
    bonusAge: reglages.coupDePouce ? Object.fromEntries(presents.map((j) => [j.id, bonusAge(j)])) : null,
    mode,
    equipes,
    duree,
    manches,
    pos: { m: 0, e: 0 },
    phase: 'generique'
  };
  partie.id = await enregistrerPartie(partie);
  await enregistrerPartie(partie);
  return partie.id;
}
