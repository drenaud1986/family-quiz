import { genre } from './joueurs.js';

const VOYELLE = /^[aeiouyàâäéèêëîïôöùûüœæh]/i;

/** « de Léo » / « d'Emma » */
export const deNom = (nom) => (VOYELLE.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Met la première lettre en majuscule (libellés des boutons). */
export const majuscule = (texte) => (texte ? texte.charAt(0).toUpperCase() + texte.slice(1) : texte);

/**
 * Remplace les repères d'une phrase.
 * @param {string} phrase
 * @param {object|null} joueur  la personne désignée (visée, ou qui répond au questionnaire)
 * @param {string} [reponse]
 */
export function remplir(phrase, joueur, reponse = '') {
  if (!phrase) return '';
  const f = joueur ? genre(joueur) === 'f' : false;
  const nom = joueur?.nom ?? '';
  return phrase
    .replaceAll('{de_nom}', deNom(nom))
    .replaceAll('{a_nom}', `à ${nom}`)
    .replaceAll('{nom}', nom)
    .replaceAll('{s_il}', f ? 'si elle' : "s'il")
    .replaceAll('{Il}', f ? 'Elle' : 'Il')
    .replaceAll('{il}', f ? 'elle' : 'il')
    .replaceAll('{e}', f ? 'e' : '')
    .replaceAll('{reponse}', reponse)
    .replace(/^./, (c) => c.toUpperCase());
}

/** Espaces insécables de la typographie française (évite « ! » seul en début de ligne). */
export const typo = (texte) => (texte ?? '').replace(/ ([!?:;»])/g, ' $1').replace(/« /g, '« ');

/** Accord simple selon le genre du joueur. */
export const accord = (joueur, masculin, feminin) => (genre(joueur) === 'f' ? feminin : masculin);
