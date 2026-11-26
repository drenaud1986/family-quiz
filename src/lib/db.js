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

// Version 2 : questions écrites par la famille (questionnaire et souvenirs).
db.version(2).stores({ perso: '++id, type' });

const TABLES = ['joueurs', 'reponses', 'historique', 'parties', 'reglages', 'perso'];

// ---------- Questions de la famille ----------

export const listerPerso = () => db.perso.orderBy('id').toArray();
export const enregistrerPerso = (q) => db.perso.put(JSON.parse(JSON.stringify(q)));
export const supprimerPerso = (id) => db.perso.delete(id);

// ---------- Sauvegarde ----------

/** Toutes les données de la tablette, dans un objet prêt à être enregistré en fichier. */
export async function exporterDonnees() {
  const donnees = { application: 'family-quiz', format: 1, date: new Date().toISOString() };
  for (const t of TABLES) donnees[t] = await db[t].toArray();
  return donnees;
}

/** Remplace toutes les données par celles d'une sauvegarde. */
export async function importerDonnees(donnees) {
  if (donnees?.application !== 'family-quiz' || !Array.isArray(donnees.joueurs)) {
    throw new Error("Ce fichier n'est pas une sauvegarde Family Quiz.");
  }
  await db.transaction('rw', TABLES.map((t) => db[t]), async () => {
    for (const t of TABLES) {
      await db[t].clear();
      if (Array.isArray(donnees[t]) && donnees[t].length) await db[t].bulkPut(donnees[t]);
    }
  });
}

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
  // Vider les tables plutôt que supprimer la base : fonctionne même si l'appli est ouverte ailleurs.
  await db.transaction('rw', TABLES, () => Promise.all(TABLES.map((t) => db.table(t).clear())));
  location.reload();
}

/** Copie profonde « simple » pour stocker un état réactif Svelte. */
function copiePure(objet) {
  return JSON.parse(JSON.stringify(objet));
}
