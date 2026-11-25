/** Mélange une copie du tableau (Fisher-Yates). */
export function melanger(tableau) {
  const t = [...tableau];
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}

export const auHasard = (tableau) => tableau[Math.floor(Math.random() * tableau.length)];

export const pause = (ms) => new Promise((resoudre) => setTimeout(resoudre, ms));
