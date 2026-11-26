import Dexie from 'dexie';

// Toutes les données restent sur la tablette (IndexedDB).
export const db = new Dexie('family-quiz');

db.version(1).stores({
  joueurs: '++id, nom',
  reponses: '++id, joueurId, questionId, [joueurId+questionId]',
  historique: '++id, partieId, questionId, sujetId, date',
  parties: '++id, date, terminee',
  reglages: 'cle'
});

/** Demande au navigateur de ne pas effacer les données de lui-même. */
export async function demanderStockagePersistant() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    /* sans importance */
  }
}

// ---------- Joueurs ----------

export const listerJoueurs = () => db.joueurs.orderBy('id').toArray();

export async function enregistrerJoueur(joueur) {
  const donnees = { ...joueur };
  if (!donnees.creeLe) donnees.creeLe = Date.now();
  return db.joueurs.put(donnees);
}

export async function supprimerJoueur(id) {
  await db.transaction('rw', db.joueurs, db.reponses, db.historique, async () => {
    await db.joueurs.delete(id);
    await db.reponses.where('joueurId').equals(id).delete();
    await db.historique.where('sujetId').equals(id).delete();
  });
}

// ---------- Réponses ----------

export const listerReponses = () => db.reponses.toArray();

/** Enregistre (ou remplace) la réponse d'un joueur à une question. */
export async function enregistrerReponse(joueurId, questionId, valeur) {
  const existante = await db.reponses.where({ joueurId, questionId }).first();
  const donnees = { joueurId, questionId, ...valeur, date: Date.now() };
  if (existante) donnees.id = existante.id;
  return db.reponses.put(donnees);
}

export const reponsesDe = (joueurId) => db.reponses.where('joueurId').equals(joueurId).toArray();

export const supprimerReponse = (id) => db.reponses.delete(id);

export const viderReponses = (joueurId) => db.reponses.where('joueurId').equals(joueurId).delete();

// ---------- Historique ----------

export const listerHistorique = () => db.historique.toArray();

export async function ajouterHistorique(entrees) {
  if (entrees.length) await db.historique.bulkAdd(entrees);
}

// ---------- Parties ----------

export async function partieEnCours() {
  const parties = await db.parties.where('terminee').equals(0).toArray();
  return parties.sort((a, b) => b.date - a.date)[0] ?? null;
}

export const enregistrerPartie = (partie) => db.parties.put(copiePure(partie));

export async function terminerPartie(id) {
  await db.parties.update(id, { terminee: 1 });
}

export async function abandonnerPartiesEnCours() {
  await db.parties.where('terminee').equals(0).modify({ terminee: 1, abandonnee: true });
}

export const compterPartiesTerminees = () => db.parties.where('terminee').equals(1).count();

// ---------- Réglages ----------

export async function lireReglages() {
  const lignes = await db.reglages.toArray();
  return Object.fromEntries(lignes.map((l) => [l.cle, l.valeur]));
}

export const ecrireReglage = (cle, valeur) => db.reglages.put({ cle, valeur });

export async function toutEffacer() {
  await db.delete();
  location.reload();
}

/** Copie profonde « simple » pour stocker un état réactif Svelte. */
function copiePure(objet) {
  return JSON.parse(JSON.stringify(objet));
}
