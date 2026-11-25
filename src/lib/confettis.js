import confetti from 'canvas-confetti';

const COULEURS = ['#ffc83d', '#ff4fa3', '#2fd3ff', '#3ddc84', '#b46bff', '#ffffff'];

export function petitesConfettis() {
  confetti({ particleCount: 60, spread: 70, startVelocity: 35, origin: { y: 0.65 }, colors: COULEURS, disableForReducedMotion: true });
}

export function grandesConfettis(dureeMs = 3500) {
  const fin = Date.now() + dureeMs;
  (function salve() {
    confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: COULEURS, disableForReducedMotion: true });
    confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: COULEURS, disableForReducedMotion: true });
    if (Date.now() < fin) requestAnimationFrame(salve);
  })();
  setTimeout(() => confetti({ particleCount: 150, spread: 120, origin: { y: 0.4 }, colors: COULEURS, disableForReducedMotion: true }), 400);
}
