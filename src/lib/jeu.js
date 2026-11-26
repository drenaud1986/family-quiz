import { questionParId, choixParId } from './banque.js';
import { remplir, majuscule, accord } from './grammaire.js';
import { roleParId, estPetit } from './joueurs.js';
import { melanger, auHasard } from './hasard.js';

// ---------------------------------------------------------------------------
// Réglages du jeu
// ---------------------------------------------------------------------------

export const DUREES = {
  courte: { id: 'courte', label: 'Courte', temps: '≈ 10 min', m1: 1, m2: 1, m3: 1, rafale: 20 },
  normale: { id: 'normale', label: 'Normale', temps: '15 à 20 min', m1: 2, m2: 2, m3: 1, rafale: 30 },
  longue: { id: 'longue', label: 'Longue', temps: '25 à 30 min', m1: 3, m2: 4, m3: 2, rafale: 45 }
};

export const MODES = [
  { id: 'individuel', label: 'Chacun pour soi', emoji: '🏆' },
  { id: 'enfants-parents', label: 'Enfants contre parents', emoji: '🧒 🆚 🧑' },
  { id: 'filles-garcons', label: 'Filles contre garçons', emoji: '👧 🆚 👦' }
];

export const POINTS = { quiz: 100, vraifaux: 50, qui: 100, complicite: 25, multiplicateurRafale: 2, serie: 50 };

/** Une série de bonnes réponses d'affilée rapporte un bonus tous les SERIE_PAS. */
export const SERIE_PAS = 3;
export const CHRONO = { normal: 20, petit: 30 };

export const MANCHES = {
  quiz: {
    id: 'quiz',
    numero: 1,
    titre: 'Quiz classique',
    emoji: '🎯',
    regle: 'Je pose une question sur un adversaire. Trouve la bonne réponse !'
  },
  vraifaux: {
    id: 'vraifaux',
    numero: 2,
    titre: 'Vrai ou faux',
    emoji: '⚖️',
    regle: "J'annonce une affirmation sur un adversaire. Vrai ou faux ? À toi de juger !"
  },
  qui: {
    id: 'qui',
    numero: 3,
    titre: 'Qui a répondu ça ?',
    emoji: '🕵️',
    regle: 'Je dévoile une réponse du questionnaire. Devine qui l’a donnée !'
  },
  rafale: {
    id: 'rafale',
    numero: 4,
    titre: 'La rafale finale',
    emoji: '⚡',
    regle: 'Chacun son tour, enchaîne un maximum de bonnes réponses avant la fin du chrono. Points doublés !'
  }
};

// ---------------------------------------------------------------------------
// Équipes
// ---------------------------------------------------------------------------

export function formerEquipes(mode, joueurs) {
  if (mode === 'enfants-parents') {
    return [
      { id: 'A', nom: 'Les enfants', emoji: '🧒', couleur: '#2fd3ff', joueurs: joueurs.filter((j) => roleParId[j.role].equipeAge === 'enfants').map((j) => j.id) },
      { id: 'B', nom: 'Les parents', emoji: '🧑', couleur: '#ff4fa3', joueurs: joueurs.filter((j) => roleParId[j.role].equipeAge === 'parents').map((j) => j.id) }
    ];
  }
  if (mode === 'filles-garcons') {
    return [
      { id: 'A', nom: 'Les filles', emoji: '👧', couleur: '#ff4fa3', joueurs: joueurs.filter((j) => roleParId[j.role].genre === 'f').map((j) => j.id) },
      { id: 'B', nom: 'Les garçons', emoji: '👦', couleur: '#2fd3ff', joueurs: joueurs.filter((j) => roleParId[j.role].genre === 'm').map((j) => j.id) }
    ];
  }
  return null;
}

/** @returns {string|null} la raison pour laquelle le mode n'est pas jouable */
export function modeImpossible(mode, joueurs) {
  if (joueurs.length < 2) return 'Il faut au moins 2 joueurs.';
  const equipes = formerEquipes(mode, joueurs);
  if (equipes) {
    const vide = equipes.find((e) => e.joueurs.length === 0);
    if (vide) return `Il manque quelqu'un dans l'équipe « ${vide.nom} ».`;
  }
  return null;
}

export function equipeDe(partie, joueurId) {
  return partie.equipes?.find((e) => e.joueurs.includes(joueurId)) ?? null;
}

// ---------------------------------------------------------------------------
// Génération de la partie
// ---------------------------------------------------------------------------

const OPTIONS_VF = [
  { id: 'vrai', label: 'Vrai', emoji: '👍' },
  { id: 'faux', label: 'Faux', emoji: '👎' }
];

function normaliser(texte) {
  return (texte ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Prépare tout ce qu'il faut pour générer les questions d'une partie.
 */
function creerContexte({ joueursPartie, tousJoueurs, reponses, historique, partiesRecentes, equipes }) {
  const rep = {};
  for (const r of reponses) {
    if (r.passee || !questionParId[r.questionId]) continue;
    (rep[r.joueurId] ??= {})[r.questionId] = r;
  }
  const recentes = new Set(partiesRecentes);
  const recent = new Set(historique.filter((h) => recentes.has(h.partieId)).map((h) => `${h.questionId}|${h.sujetId}`));
  const parId = Object.fromEntries(tousJoueurs.map((j) => [j.id, j]));
  return {
    joueursPartie,
    tousJoueurs,
    parId,
    rep,
    equipes,
    recent,
    utilisees: new Set(),
    nbVise: Object.fromEntries(joueursPartie.map((j) => [j.id, 0]))
  };
}

function adversaires(ctx, actifId) {
  if (!ctx.equipes) return ctx.joueursPartie.filter((j) => j.id !== actifId);
  const equipe = ctx.equipes.find((e) => e.joueurs.includes(actifId));
  return ctx.joueursPartie.filter((j) => !equipe.joueurs.includes(j.id));
}

function ordreDuTour(ctx) {
  if (!ctx.equipes) return ctx.joueursPartie.map((j) => j.id);
  const [a, b] = ctx.equipes.map((e) => [...e.joueurs]);
  const ordre = [];
  while (a.length || b.length) {
    if (a.length) ordre.push(a.shift());
    if (b.length) ordre.push(b.shift());
  }
  return ordre;
}

/** Réponses d'un joueur, les paires jamais posées récemment en premier. */
function reponsesDe(ctx, sujetId, { autoriserReutilisation = false } = {}) {
  const liste = Object.values(ctx.rep[sujetId] ?? {});
  const fraiches = [];
  const recentes = [];
  const utilisees = [];
  for (const r of melanger(liste)) {
    const cle = `${r.questionId}|${sujetId}`;
    if (ctx.utilisees.has(cle)) utilisees.push(r);
    else if (ctx.recent.has(cle)) recentes.push(r);
    else fraiches.push(r);
  }
  return autoriserReutilisation ? [...fraiches, ...recentes, ...utilisees] : [...fraiches, ...recentes];
}

function optionJoueur(j) {
  return { id: `j${j.id}`, label: j.nom, emoji: j.emoji, couleur: j.couleur };
}

/** Les fausses réponses : d'abord celles des autres joueurs, puis la liste. */
function faussesReponses(ctx, q, bonneId, nombre) {
  const desAutres = [];
  for (const [jid, reps] of Object.entries(ctx.rep)) {
    const r = reps[q.id];
    if (r?.choixId && r.choixId !== bonneId && !desAutres.includes(r.choixId)) desAutres.push(r.choixId);
  }
  const reste = q.choix.map((c) => c.id).filter((id) => id !== bonneId && !desAutres.includes(id));
  return [...melanger(desAutres), ...melanger(reste)].slice(0, nombre).map((id) => choixParId(q, id));
}

function formatChoix(c) {
  return { id: c.id, label: majuscule(c.label), emoji: c.emoji };
}

/** Question de la manche 1 (ou de la rafale si `rapide`). */
function construireQuiz(ctx, r, sujet, rapide = false) {
  const q = questionParId[r.questionId];
  const base = { questionId: q.id, sujetId: sujet.id, categorie: q.categorie, texte: remplir(q.quiz, sujet) };

  if (q.type === 'libre' || (q.type === 'choix' && r.texte)) {
    if (rapide) return null;
    return { ...base, forme: 'oral', reponseOrigine: r.texte };
  }
  if (q.type === 'membre') {
    const membre = ctx.parId[r.membreId];
    if (!membre) return null;
    const options = ctx.tousJoueurs.filter((j) => q.inclureSoi || j.id !== sujet.id).map(optionJoueur);
    return { ...base, forme: 'avatars', options, bonne: `j${membre.id}` };
  }
  const bonne = choixParId(q, r.choixId);
  if (!bonne) return null;
  const options = q.type === 'duel' ? q.choix : melanger([bonne, ...faussesReponses(ctx, q, bonne.id, 3)]);
  return { ...base, forme: 'choix', options: options.map(formatChoix), bonne: bonne.id };
}

/** Affirmation de la manche 2 : vraie une fois sur deux. */
function construireVraiFaux(ctx, r, sujet) {
  const q = questionParId[r.questionId];
  if (!q.affirmation) return null;
  let vraiLabel;
  let fauxLabel;
  if (q.type === 'membre') {
    const membre = ctx.parId[r.membreId];
    if (!membre) return null;
    vraiLabel = membre.nom;
    const autres = ctx.tousJoueurs.filter((j) => j.id !== membre.id && (q.inclureSoi || j.id !== sujet.id));
    fauxLabel = autres.length ? auHasard(autres).nom : null;
  } else if (r.choixId) {
    const bonne = choixParId(q, r.choixId);
    if (!bonne) return null;
    vraiLabel = bonne.label;
    fauxLabel = faussesReponses(ctx, q, bonne.id, 1)[0]?.label ?? null;
  } else {
    return null;
  }
  const vrai = !fauxLabel || Math.random() < 0.5;
  return {
    questionId: q.id,
    sujetId: sujet.id,
    categorie: q.categorie,
    texte: remplir(q.affirmation, sujet, vrai ? vraiLabel : fauxLabel),
    forme: 'choix',
    options: OPTIONS_VF,
    bonne: vrai ? 'vrai' : 'faux',
    revelation: vrai ? null : remplir(q.affirmation, sujet, vraiLabel)
  };
}

/** Réponse donnée par un seul joueur (pour « Qui a répondu ça ? »). */
function estUnique(ctx, q, r) {
  for (const [jid, reps] of Object.entries(ctx.rep)) {
    if (Number(jid) === r.joueurId) continue;
    const autre = reps[q.id];
    if (!autre) continue;
    if (r.choixId && autre.choixId === r.choixId) return false;
    if (r.texte && autre.texte && normaliser(autre.texte) === normaliser(r.texte)) return false;
  }
  return true;
}

function construireQui(ctx, r, auteur, actifId) {
  const q = questionParId[r.questionId];
  if (!q.qui || !estUnique(ctx, q, r)) return null;
  let valeur;
  if (r.texte) valeur = r.texte.trim();
  else if (r.choixId) valeur = choixParId(q, r.choixId)?.label;
  if (!valeur) return null;
  const options = ctx.joueursPartie.filter((j) => j.id !== actifId).map(optionJoueur);
  if (options.length < 2) return null;
  return {
    questionId: q.id,
    sujetId: auteur.id,
    categorie: q.categorie,
    texte: remplir(q.qui, null, valeur),
    rappel: remplir(q.questionnaire, null),
    forme: 'avatars',
    options,
    bonne: `j${auteur.id}`
  };
}

/** Choisit la personne visée : l'adversaire le moins visé qui a de la matière. */
function choisirSujet(ctx, actifId, aDeLaMatiere) {
  const possibles = melanger(adversaires(ctx, actifId)).filter((j) => aDeLaMatiere(j));
  if (!possibles.length) return null;
  possibles.sort((a, b) => ctx.nbVise[a.id] - ctx.nbVise[b.id]);
  return possibles[0];
}

function marquer(ctx, etape) {
  ctx.utilisees.add(`${etape.questionId}|${etape.sujetId}`);
  ctx.nbVise[etape.sujetId] = (ctx.nbVise[etape.sujetId] ?? 0) + 1;
}

function genererTour(ctx, actifId, construire) {
  const essais = melanger(adversaires(ctx, actifId)).sort((a, b) => ctx.nbVise[a.id] - ctx.nbVise[b.id]);
  for (const sujet of essais) {
    for (const r of reponsesDe(ctx, sujet.id)) {
      const etape = construire(r, sujet);
      if (etape) {
        marquer(ctx, etape);
        return { actifId, ...etape };
      }
    }
  }
  return null;
}

function genererQui(ctx, actifId) {
  const auteurs = melanger(adversaires(ctx, actifId)).sort((a, b) => ctx.nbVise[a.id] - ctx.nbVise[b.id]);
  for (const auteur of auteurs) {
    for (const r of reponsesDe(ctx, auteur.id)) {
      const etape = construireQui(ctx, r, auteur, actifId);
      if (etape) {
        marquer(ctx, etape);
        return { actifId, ...etape };
      }
    }
  }
  return null;
}

function genererRafale(ctx, actifId, taille = 30) {
  const pool = [];
  const deja = new Set();
  for (let tentative = 0; tentative < taille * 4 && pool.length < taille; tentative++) {
    const sujet = auHasard(adversaires(ctx, actifId));
    const reps = reponsesDe(ctx, sujet.id, { autoriserReutilisation: true });
    const r = reps.find((x) => !deja.has(`${x.questionId}|${sujet.id}`));
    if (!r) continue;
    const etape = Math.random() < 0.4 ? construireVraiFaux(ctx, r, sujet) : construireQuiz(ctx, r, sujet, true);
    deja.add(`${r.questionId}|${sujet.id}`);
    if (etape) pool.push({ actifId, ...etape });
  }
  return pool;
}

/** Une « question en or » (points doublés) au hasard, jamais la première de la manche. */
function marquerOr(etapes) {
  if (etapes.length >= 3) etapes[1 + Math.floor(Math.random() * (etapes.length - 1))].or = true;
  return etapes;
}

/**
 * Génère toutes les manches d'une partie, à partir des réponses connues.
 */
export function genererManches(donnees, dureeId) {
  const ctx = creerContexte(donnees);
  const duree = DUREES[dureeId];
  const ordre = ordreDuTour(ctx);
  const manches = [];

  const quiz = [];
  for (let t = 0; t < duree.m1; t++) {
    for (const actifId of ordre) {
      const e = genererTour(ctx, actifId, (r, s) => construireQuiz(ctx, r, s));
      if (e) quiz.push(e);
    }
  }
  if (quiz.length) manches.push({ id: 'quiz', etapes: marquerOr(quiz) });

  const vf = [];
  for (let t = 0; t < duree.m2; t++) {
    for (const actifId of ordre) {
      const e = genererTour(ctx, actifId, (r, s) => construireVraiFaux(ctx, r, s));
      if (e) vf.push(e);
    }
  }
  if (vf.length) manches.push({ id: 'vraifaux', etapes: marquerOr(vf) });

  const qui = [];
  for (let t = 0; t < duree.m3; t++) {
    for (const actifId of ordre) {
      const e = genererQui(ctx, actifId);
      if (e) qui.push(e);
    }
  }
  if (qui.length) manches.push({ id: 'qui', etapes: marquerOr(qui) });

  const rafale = ordre
    .map((actifId) => ({ actifId, secondes: duree.rafale, pool: genererRafale(ctx, actifId), resultats: [] }))
    .filter((r) => r.pool.length >= 3);
  if (rafale.length) manches.push({ id: 'rafale', joueurs: rafale });

  return manches;
}

// ---------------------------------------------------------------------------
// Temps et points
// ---------------------------------------------------------------------------

export function secondesPourRepondre(joueur) {
  return estPetit(joueur) ? CHRONO.petit : CHRONO.normal;
}

export function pointsEtape(mancheId, etape) {
  if (mancheId === 'rafale') {
    const base = etape.options === OPTIONS_VF || etape.options?.[0]?.id === 'vrai' ? POINTS.vraifaux : POINTS.quiz;
    return base * POINTS.multiplicateurRafale;
  }
  return POINTS[mancheId] * (etape.or ? 2 : 1);
}

/**
 * Série en cours du joueur actif, en comptant l'étape `etapeCourante` si elle est réussie.
 * Parcourt les manches dans l'ordre (la rafale n'entre pas dans les séries).
 */
export function serieAvant(partie, actifId, etapeCourante) {
  let serie = 0;
  for (const manche of partie.manches) {
    if (manche.id === 'rafale') continue;
    for (const e of manche.etapes) {
      if (e === etapeCourante) return serie;
      if (e.actifId !== actifId || !e.resultat) continue;
      serie = e.resultat.correct ? serie + 1 : 0;
    }
  }
  return serie;
}

/** Calcule les scores à partir des résultats enregistrés dans la partie. */
export function calculerScores(partie) {
  const scores = Object.fromEntries(partie.joueurs.map((id) => [id, 0]));
  const individuel = !partie.equipes;
  for (const manche of partie.manches) {
    if (manche.id === 'rafale') {
      for (const tour of manche.joueurs) {
        for (const res of tour.resultats) {
          if (res.correct) scores[tour.actifId] += res.points;
        }
      }
      continue;
    }
    for (const e of manche.etapes) {
      if (!e.resultat?.correct) continue;
      scores[e.actifId] += pointsEtape(manche.id, e) + (e.resultat.bonus ?? 0);
      if (individuel && manche.id !== 'qui' && scores[e.sujetId] !== undefined) scores[e.sujetId] += POINTS.complicite;
    }
  }
  return scores;
}

export function scoresEquipes(partie, scores) {
  if (!partie.equipes) return null;
  return partie.equipes.map((e) => ({ ...e, score: e.joueurs.reduce((s, id) => s + (scores[id] ?? 0), 0) }));
}

/** Titres amusants affichés au podium. */
export function titresPodium(partie, parId) {
  const titres = [];
  const devine = {}; // sujet -> { ok, total }
  const paires = {}; // `${actif}|${sujet}` -> ok
  for (const manche of partie.manches) {
    const etapes =
      manche.id === 'rafale'
        ? manche.joueurs.flatMap((t) => t.resultats.map((r) => ({ actifId: t.actifId, sujetId: r.sujetId, resultat: r })))
        : manche.etapes;
    for (const e of etapes) {
      if (!e.resultat) continue;
      const d = (devine[e.sujetId] ??= { ok: 0, total: 0 });
      d.total++;
      if (e.resultat.correct) {
        d.ok++;
        const cle = `${e.actifId}|${e.sujetId}`;
        paires[cle] = (paires[cle] ?? 0) + 1;
      }
    }
  }

  const meilleurePaire = Object.entries(paires).sort((a, b) => b[1] - a[1])[0];
  if (meilleurePaire && meilleurePaire[1] >= 2) {
    const [actifId, sujetId] = meilleurePaire[0].split('|').map(Number);
    const actif = parId[actifId];
    const sujet = parId[sujetId];
    if (actif && sujet) {
      titres.push({ emoji: '🔍', joueurId: actif.id, texte: `${accord(actif, 'Celui', 'Celle')} qui connaît le mieux ${sujet.nom}` });
    }
  }

  const rafale = partie.manches.find((m) => m.id === 'rafale');
  if (rafale) {
    const meilleur = rafale.joueurs
      .map((t) => ({ id: t.actifId, ok: t.resultats.filter((r) => r.correct).length }))
      .sort((a, b) => b.ok - a.ok)[0];
    if (meilleur?.ok > 0 && parId[meilleur.id]) {
      const j = parId[meilleur.id];
      titres.push({ emoji: '⚡', joueurId: j.id, texte: `${accord(j, 'Roi', 'Reine')} de la rafale (${meilleur.ok} bonnes réponses)` });
    }
  }

  let meilleureSerie = { id: null, n: 0 };
  const series = {};
  for (const manche of partie.manches) {
    if (manche.id === 'rafale') continue;
    for (const e of manche.etapes) {
      if (!e.resultat) continue;
      series[e.actifId] = e.resultat.correct ? (series[e.actifId] ?? 0) + 1 : 0;
      if (series[e.actifId] > meilleureSerie.n) meilleureSerie = { id: e.actifId, n: series[e.actifId] };
    }
  }
  if (meilleureSerie.n >= SERIE_PAS && parId[meilleureSerie.id]) {
    titres.push({ emoji: '🔥', joueurId: meilleureSerie.id, texte: `Série record : ${meilleureSerie.n} bonnes réponses d'affilée` });
  }

  const mysteres = Object.entries(devine)
    .filter(([, d]) => d.total >= 2)
    .map(([id, d]) => ({ id: Number(id), taux: d.ok / d.total }))
    .sort((a, b) => a.taux - b.taux);
  if (mysteres.length && parId[mysteres[0].id]) {
    const j = parId[mysteres[0].id];
    titres.push({ emoji: '🎭', joueurId: j.id, texte: `${accord(j, 'Le plus mystérieux', 'La plus mystérieuse')} de la famille` });
  }

  const livreOuvert = mysteres.at(-1);
  if (livreOuvert && livreOuvert.taux >= 0.7 && livreOuvert.id !== mysteres[0].id && parId[livreOuvert.id]) {
    titres.push({ emoji: '📖', joueurId: livreOuvert.id, texte: `${parId[livreOuvert.id].nom}, un vrai livre ouvert` });
  }

  return titres;
}

/** Entrées d'historique à enregistrer à la fin de la partie. */
export function entreesHistorique(partie) {
  const date = Date.now();
  const entrees = [];
  for (const manche of partie.manches) {
    const etapes =
      manche.id === 'rafale'
        ? manche.joueurs.flatMap((t) => t.resultats.map((r) => ({ ...r, actifId: t.actifId })))
        : manche.etapes.filter((e) => e.resultat).map((e) => ({ ...e, correct: e.resultat.correct }));
    for (const e of etapes) {
      entrees.push({
        partieId: partie.id,
        questionId: e.questionId,
        sujetId: e.sujetId,
        joueurActifId: e.actifId,
        manche: manche.id,
        correct: !!e.correct,
        date
      });
    }
  }
  return entrees;
}
