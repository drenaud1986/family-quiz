import categoriesJson from '../data/categories.json';

// Chaque catégorie a son fichier dans src/data/banque/<categorie>.json.
const fichiers = import.meta.glob('../data/banque/*.json', { eager: true, import: 'default' });

export const categories = categoriesJson;
export const categorieParId = Object.fromEntries(categories.map((c) => [c.id, c]));

export const questions = Object.values(fichiers).flat();
export const questionParId = Object.fromEntries(questions.map((q) => [q.id, q]));

/** Retrouve le choix d'une question à partir de son identifiant. */
export function choixParId(question, choixId) {
  return question.choix?.find((c) => c.id === choixId) ?? null;
}
