import { questions, questionParId } from './banque.js';
import { tranche } from './joueurs.js';

export const QUESTIONS_PREMIERE_FOIS = 20;
export const QUESTIONS_PARTIES_SUIVANTES = 4;
const SEUIL_PREMIERE_FOIS = 10;
const SIX_MOIS = 182 * 24 * 3600 * 1000;

/** La question convient-elle à ce joueur (âge, rôle, nombre de joueurs) ? */
export function estEligible(question, joueur, nbJoueursEnregistres) {
  if (!question.ages.includes(tranche(joueur))) return false;
  if (question.roles && !question.roles.includes(joueur.role)) return false;
  if (question.type === 'membre' && nbJoueursEnregistres < 3) return false;
  return true;
}

export function estPremiereFois(joueur, reponses) {
  return reponses.filter((r) => r.joueurId === joueur.id && !r.passee).length < SEUIL_PREMIERE_FOIS;
}

/**
 * Choisit les questions du questionnaire d'un joueur.
 * Priorité aux questions que les autres ont déjà (ou pourront) répondre,
 * pour fabriquer de bonnes fausses réponses et la manche « Qui a répondu ça ? ».
 * @returns {{ question: object, miseAJour?: object }[]}
 */
export function preparerQuestionnaire(joueur, tousJoueurs, reponses, nombre = null, rigolo = false) {
  const n = tousJoueurs.length;
  const autres = tousJoueurs.filter((j) => j.id !== joueur.id);
  const miennes = reponses.filter((r) => r.joueurId === joueur.id);
  const repondues = new Set(miennes.filter((r) => !r.passee).map((r) => r.questionId));
  const passees = new Set(miennes.filter((r) => r.passee).map((r) => r.questionId));

  const parAutres = {};
  for (const r of reponses) {
    if (r.joueurId !== joueur.id && !r.passee) parAutres[r.questionId] = (parAutres[r.questionId] ?? 0) + 1;
  }

  const premiereFois = estPremiereFois(joueur, reponses);
  // Émission 100 % rigolote : uniquement des phrases rigolotes (8 la première fois, 4 ensuite).
  const nbDroles = miennes.filter((r) => !r.passee && questionParId[r.questionId]?.type === 'drole').length;
  const cible = nombre ?? (rigolo ? (nbDroles < 8 ? 8 : 4) : premiereFois ? QUESTIONS_PREMIERE_FOIS : QUESTIONS_PARTIES_SUIVANTES);

  const candidates = questions
    .filter((q) => !repondues.has(q.id) && estEligible(q, joueur, n) && (!rigolo || q.type === 'drole'))
    .map((q) => ({
      q,
      score:
        Math.random() * 10 +
        // Les questions écrites par la famille passent en priorité.
        (q.categorie === 'perso' ? 8 : 0) +
        Math.min(autres.filter((a) => estEligible(q, a, n)).length, 2) * 0.5 -
        (passees.has(q.id) ? 4 : 0)
    }));

  // Un mélange de formats : quelques réponses libres (les plus drôles pour « Qui a répondu ça ? »),
  // un peu de « membre » et de duels, le reste en QCM.
  const libreDispo = candidates.some((c) => c.q.type === 'libre');
  const quotas = {
    libre: libreDispo ? Math.round(cible * 0.2) : 0,
    membre: Math.max(1, Math.round(cible * 0.15)),
    duel: Math.max(1, Math.round(cible * 0.25)),
    drole: rigolo ? cible : Math.max(1, Math.round(cible * 0.1)),
    choix: cible
  };
  // Environ 40 % de questions déjà posées à un autre candidat (pour comparer et piéger),
  // le reste tiré au hasard : chacun a son propre questionnaire.
  const quotaPartage = Math.round(cible * 0.4);
  let partagees = 0;
  const minimums = { libre: quotas.libre ? Math.max(1, Math.round(cible * 0.15)) : 0 };

  const choisies = [];
  const parCategorie = {};
  const parType = {};
  while (choisies.length < cible && candidates.length) {
    let meilleur = 0;
    let meilleurScore = -Infinity;
    const restantes = cible - choisies.length;
    const libresManquantes = (minimums.libre ?? 0) - (parType.libre ?? 0);
    candidates.forEach((c, i) => {
      const t = c.q.type;
      let s = c.score - (parCategorie[c.q.categorie] ?? 0) * 3;
      if ((parType[t] ?? 0) >= (quotas[t] ?? cible)) s -= 8;
      const dejaPosee = parAutres[c.q.id] ?? 0;
      if (dejaPosee && partagees < quotaPartage) s += 5;
      if (dejaPosee >= 2) s -= 3;
      if (libresManquantes > 0 && restantes <= libresManquantes * 3 && t === 'libre') s += 6;
      if (s > meilleurScore) {
        meilleurScore = s;
        meilleur = i;
      }
    });
    const [{ q }] = candidates.splice(meilleur, 1);
    parCategorie[q.categorie] = (parCategorie[q.categorie] ?? 0) + 1;
    parType[q.type] = (parType[q.type] ?? 0) + 1;
    if (parAutres[q.id]) partagees++;
    choisies.push({ question: q });
  }

  // « C'est toujours vrai ? » : au plus une réponse ancienne par partie.
  if (!premiereFois && nombre === null && !rigolo) {
    const ancienne = miennes
      .filter((r) => !r.passee && Date.now() - r.date > SIX_MOIS && questionParId[r.questionId])
      .sort((a, b) => a.date - b.date)[0];
    if (ancienne) choisies.unshift({ question: questionParId[ancienne.questionId], miseAJour: ancienne });
  }

  return choisies;
}
