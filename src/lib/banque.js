import categoriesJson from '../data/categories.json';

// Chaque catégorie a son fichier dans src/data/banque/<categorie>.json.
const fichiers = import.meta.glob('../data/banque/*.json', { eager: true, import: 'default' });

/** Catégorie des questions écrites par la famille (ajoutées depuis l'application). */
export const CATEGORIE_PERSO = { id: 'perso', label: 'Questions de la famille', emoji: '🏠' };

export const categories = [...categoriesJson, CATEGORIE_PERSO];
export const categorieParId = Object.fromEntries(categories.map((c) => [c.id, c]));

export const questions = Object.values(fichiers).flat();
export const questionParId = Object.fromEntries(questions.map((q) => [q.id, q]));

/** Souvenirs de famille (questions à réponse connue), chargés depuis la base. */
export const souvenirs = [];

/** Retrouve le choix d'une question à partir de son identifiant. */
export function choixParId(question, choixId) {
  return question.choix?.find((c) => c.id === choixId) ?? null;
}

const TOUS_AGES = ['6-8', '9-12', '13-17', 'adulte'];
const DES_9_ANS = ['9-12', '13-17', 'adulte'];
const EMOJIS_DEFAUT = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'];

/** Transforme une question du questionnaire écrite par la famille au format de la banque. */
export function versQuestionBanque(p) {
  const texte = p.texte.trim();
  const libre = p.format === 'libre';
  const choix = libre
    ? undefined
    : p.choix
        .filter((c) => c.label?.trim())
        .map((c, i) => ({ id: `c${i}`, label: c.label.trim(), emoji: c.emoji?.trim() || EMOJIS_DEFAUT[i % EMOJIS_DEFAUT.length] }));
  const type = libre ? 'libre' : choix.length === 2 ? 'duel' : 'choix';
  return {
    id: `perso-${p.id}`,
    categorie: 'perso',
    type,
    ages: libre || p.ages === '9+' ? DES_9_ANS : TOUS_AGES,
    questionnaire: texte,
    quiz: `Qu'a répondu {nom} à la question : « ${texte} »`,
    affirmation: libre ? undefined : `À la question « ${texte} », {nom} a répondu : {reponse}.`,
    qui: type === 'duel' ? undefined : `Qui a répondu « {reponse} » à la question : « ${texte} » ?`,
    autre: false,
    exemple: libre ? p.exemple || '' : undefined,
    choix
  };
}

/** Remplace les questions de la famille dans la banque (au démarrage et après chaque modification). */
export function integrerPerso(liste) {
  for (let i = questions.length - 1; i >= 0; i--) {
    if (questions[i].categorie === 'perso') {
      delete questionParId[questions[i].id];
      questions.splice(i, 1);
    }
  }
  souvenirs.length = 0;
  for (const p of liste) {
    if (p.type === 'souvenir') {
      souvenirs.push(p);
    } else {
      const q = versQuestionBanque(p);
      questions.push(q);
      questionParId[q.id] = q;
    }
  }
}
