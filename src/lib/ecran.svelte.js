// Taille de l'écran, pour adapter les grands éléments (mascotte, avatars) aux smartphones.

export const ecran = $state({ l: window.innerWidth, h: window.innerHeight });

window.addEventListener('resize', () => {
  ecran.l = window.innerWidth;
  ecran.h = window.innerHeight;
});

/**
 * Taille proportionnelle : `n` sur une tablette (≈ 900 px de haut, 420 px de large utiles),
 * réduite d'autant sur un écran plus petit. Jamais plus grand que `n`.
 */
export function tp(n) {
  const facteur = Math.min(1, ecran.h / 900, ecran.l / 420);
  return Math.round(n * Math.max(0.55, facteur));
}
