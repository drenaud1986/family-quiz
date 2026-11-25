// Rôles, tranches d'âge, couleurs et galerie d'avatars.

export const ROLES = [
  { id: 'papa', label: 'Papa', emoji: '👨', genre: 'm', equipeAge: 'parents' },
  { id: 'maman', label: 'Maman', emoji: '👩', genre: 'f', equipeAge: 'parents' },
  { id: 'fille', label: 'Fille', emoji: '👧', genre: 'f', equipeAge: 'enfants' },
  { id: 'garcon', label: 'Garçon', emoji: '👦', genre: 'm', equipeAge: 'enfants' }
];
export const roleParId = Object.fromEntries(ROLES.map((r) => [r.id, r]));

export const AGE_MIN = 6;
export const AGE_MAX = 99;

export const TRANCHES = [
  { id: '6-8', label: '6 – 8 ans', min: 6, max: 8 },
  { id: '9-12', label: '9 – 12 ans', min: 9, max: 12 },
  { id: '13-17', label: '13 – 17 ans', min: 13, max: 17 },
  { id: 'adulte', label: 'Adulte', min: 18, max: 200 }
];

export function age(joueur) {
  return new Date().getFullYear() - joueur.anneeNaissance;
}

export function tranche(joueur) {
  const a = Math.max(AGE_MIN, age(joueur));
  return TRANCHES.find((t) => a >= t.min && a <= t.max).id;
}

export const estPetit = (joueur) => tranche(joueur) === '6-8';
export const genre = (joueur) => roleParId[joueur.role]?.genre ?? 'm';

export const COULEURS = ['#ff4fa3', '#2fd3ff', '#3ddc84', '#ffc83d', '#b46bff', '#ff8a3d', '#ff5a5a', '#4d7cff'];

export function couleurLibre(joueurs) {
  const prises = new Set(joueurs.map((j) => j.couleur));
  return COULEURS.find((c) => !prises.has(c)) ?? COULEURS[joueurs.length % COULEURS.length];
}

export const AVATARS = [
  '🦁', '🐯', '🐻', '🐼', '🐨', '🐸', '🐵', '🦊', '🐶', '🐱', '🐰', '🦄',
  '🐲', '🦖', '🐙', '🦈', '🐬', '🦉', '🐧', '🦋', '🐢', '🐝', '🦔', '🐹',
  '😎', '🤓', '🥳', '😺', '🤠', '🧐', '😜', '🤩', '👽', '🤖', '👻', '🎃',
  '🧙', '🧚', '🦸', '🦹', '🥷', '👑', '🧑‍🚀', '🧑‍🍳', '🧑‍🎤', '🧛', '🧜', '🧞',
  '⚽', '🎸', '🎨', '🚀', '🌈', '⭐', '🔥', '🍕', '🍩', '🌵', '🍄', '💎'
];
