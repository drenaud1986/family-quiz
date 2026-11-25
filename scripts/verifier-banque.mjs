// Vérifie la banque de questions (format décrit au §8 du cahier des charges).
// Usage : npm run verifier
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const categories = JSON.parse(readFileSync(join(racine, 'categories.json'), 'utf8')).map((c) => c.id);
const dossier = join(racine, 'banque');

const AGES = ['6-8', '9-12', '13-17', 'adulte'];
const ROLES = ['papa', 'maman', 'fille', 'garcon'];
const REPERES = ['{nom}', '{de_nom}', '{a_nom}', '{il}', '{Il}', '{s_il}', '{e}', '{reponse}'];
const INTERDITS_QUI = /\{(nom|de_nom|a_nom|il|Il|s_il|e)\}/;

const erreurs = [];
const ids = new Map();
const questions = [];

for (const fichier of readdirSync(dossier).filter((f) => f.endsWith('.json'))) {
  let contenu;
  try {
    contenu = JSON.parse(readFileSync(join(dossier, fichier), 'utf8'));
  } catch (e) {
    erreurs.push(`${fichier} : JSON invalide (${e.message})`);
    continue;
  }
  for (const q of contenu) questions.push({ ...q, _fichier: fichier });
}

for (const q of questions) {
  const ou = `${q._fichier} › ${q.id ?? '(sans id)'}`;
  const e = (m) => erreurs.push(`${ou} : ${m}`);
  if (!q.id || !/^[a-z-]+-\d{3}$/.test(q.id)) e('id manquant ou mal formé');
  if (ids.has(q.id)) e(`id en double (aussi dans ${ids.get(q.id)})`);
  ids.set(q.id, q._fichier);
  if (!categories.includes(q.categorie)) e(`catégorie inconnue « ${q.categorie} »`);
  if (q.id && !q.id.startsWith(q.categorie + '-')) e('l’id ne commence pas par la catégorie');
  if (!Array.isArray(q.ages) || !q.ages.length || q.ages.some((a) => !AGES.includes(a))) e('ages invalides');
  if (q.roles && q.roles.some((r) => !ROLES.includes(r))) e('roles invalides');
  if (!q.questionnaire || !q.quiz) e('questionnaire ou quiz manquant');
  if (q.quiz && !/\{(nom|de_nom|a_nom)\}/.test(q.quiz)) e('le quiz ne nomme pas la personne visée');

  switch (q.type) {
    case 'choix':
      if (!Array.isArray(q.choix) || q.choix.length < 6 || q.choix.length > 8) e(`${q.choix?.length} choix (6 à 8 attendus)`);
      if (typeof q.autre !== 'boolean') e('champ autre manquant');
      break;
    case 'duel':
      if (!Array.isArray(q.choix) || q.choix.length !== 2) e('un duel a exactement 2 choix');
      if (q.qui) e('pas de champ qui sur un duel');
      break;
    case 'membre':
      if (q.choix) e('pas de choix sur une question membre');
      if (typeof q.inclureSoi !== 'boolean') e('champ inclureSoi manquant');
      if (q.qui) e('pas de champ qui sur une question membre');
      break;
    case 'libre':
      if (q.affirmation) e('pas d’affirmation sur une question libre');
      if (q.ages?.includes('6-8')) e('question libre interdite aux 6-8 ans');
      if (!q.exemple) e('exemple manquant');
      break;
    default:
      e(`type inconnu « ${q.type} »`);
  }

  if (q.choix) {
    const cids = q.choix.map((c) => c.id);
    if (new Set(cids).size !== cids.length) e('identifiants de choix en double');
    for (const c of q.choix) {
      if (!c.id || !c.label || !c.emoji) e(`choix incomplet ${JSON.stringify(c)}`);
      // Les paroles rapportées entre guillemets « » peuvent être à la première personne.
      if (!c.label?.startsWith('«') && /(^|\s)(je|mon|ma|mes|moi)(?=[\s,.!?]|$)|(^|\s)j['’]/i.test(c.label)) e(`libellé à la première personne : « ${c.label} »`);
    }
  }

  for (const champ of ['questionnaire', 'quiz', 'affirmation', 'qui']) {
    const t = q[champ];
    if (!t) continue;
    for (const m of t.match(/\{[^}]*\}/g) ?? []) if (!REPERES.includes(m)) e(`${champ} : repère inconnu ${m}`);
    if (t.includes('"')) e(`${champ} : guillemets droits (utiliser « »)`);
  }
  if (q.affirmation && !q.affirmation.includes('{reponse}')) e('affirmation sans {reponse}');
  if (q.qui && !q.qui.includes('{reponse}')) e('qui sans {reponse}');
  if (q.qui && INTERDITS_QUI.test(q.qui)) e('qui contient un repère désignant la personne (interdit)');
  if (q.questionnaire && /\{(nom|de_nom|a_nom)\}/.test(q.questionnaire)) e('le questionnaire ne doit pas nommer le joueur');
}

const compte = (cle) => questions.reduce((acc, q) => ((acc[cle(q)] = (acc[cle(q)] ?? 0) + 1), acc), {});
console.log(`Questions : ${questions.length}`);
console.log('Par catégorie :', compte((q) => q.categorie));
console.log('Par type :', compte((q) => q.type));
console.log('Par âge :', Object.fromEntries(AGES.map((a) => [a, questions.filter((q) => q.ages?.includes(a)).length])));

if (erreurs.length) {
  console.error(`\n${erreurs.length} erreur(s) :`);
  for (const m of erreurs) console.error(' - ' + m);
  process.exit(1);
}
console.log('\nAucune erreur.');
