<script>
  import { onDestroy } from 'svelte';
  import { sons } from '../lib/audio.js';
  import { vibrer } from '../lib/appareil.js';

  // Chrono circulaire. `enMarche` permet de le figer (révélation, validation…).
  let { secondes, enMarche = true, onfin, taille = 96 } = $props();

  let restant = $state(secondes);
  let fini = false;
  let dernierTic = Math.ceil(secondes);
  let precedent = performance.now();
  let raf;

  function boucle(maintenant) {
    const dt = (maintenant - precedent) / 1000;
    precedent = maintenant;
    if (enMarche && !fini) {
      restant = Math.max(0, restant - dt);
      const entier = Math.ceil(restant);
      if (entier !== dernierTic) {
        dernierTic = entier;
        if (entier <= 5 && entier > 0) sons.tic(true);
      }
      if (restant <= 0) {
        fini = true;
        sons.finChrono();
        vibrer([200, 80, 200]);
        onfin?.();
      }
    }
    raf = requestAnimationFrame(boucle);
  }
  raf = requestAnimationFrame(boucle);
  onDestroy(() => cancelAnimationFrame(raf));

  const fraction = $derived(restant / secondes);
  const urgent = $derived(restant <= 5);
  const r = 44;
  const circonference = 2 * Math.PI * r;
</script>

<div class="chrono" class:urgent style="--taille: {taille}px">
  <svg viewBox="0 0 100 100">
    <circle cx="50" cy="50" r={r} class="fond" />
    <circle
      cx="50"
      cy="50"
      r={r}
      class="arc"
      stroke-dasharray={circonference}
      stroke-dashoffset={circonference * (1 - fraction)}
    />
  </svg>
  <span class="nombre">{Math.ceil(restant)}</span>
</div>

<style>
  .chrono {
    position: relative;
    width: var(--taille);
    height: var(--taille);
    display: grid;
    place-items: center;
  }
  svg {
    position: absolute;
    inset: 0;
    transform: rotate(-90deg);
  }
  .fond {
    fill: rgba(0, 0, 0, 0.3);
    stroke: rgba(255, 255, 255, 0.15);
    stroke-width: 8;
  }
  .arc {
    fill: none;
    stroke: var(--cyan);
    stroke-width: 8;
    stroke-linecap: round;
    transition: stroke var(--d-normale);
  }
  .urgent .arc {
    stroke: var(--rouge);
  }
  .nombre {
    position: relative;
    font-size: calc(var(--taille) * 0.38);
    font-weight: 700;
  }
  .urgent {
    animation: pulse 0.5s ease-in-out infinite alternate;
  }
  @keyframes pulse {
    from { transform: scale(1); }
    to { transform: scale(1.12); }
  }
</style>
