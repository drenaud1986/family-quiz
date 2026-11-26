<script>
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  // Nombre qui défile jusqu'à sa nouvelle valeur (scores).
  let { valeur = 0 } = $props();

  const anime = new Tween(valeur, { duration: 900, easing: cubicOut });
  let monte = $state(false);
  let precedente = valeur;

  $effect(() => {
    if (valeur !== precedente) {
      monte = valeur > precedente;
      precedente = valeur;
      anime.target = valeur;
      if (monte) setTimeout(() => (monte = false), 900);
    }
  });
</script>

<strong class="compteur" class:monte>{Math.round(anime.current)}</strong>

<style>
  .compteur {
    display: inline-block;
    min-width: 2ch;
    font-size: var(--t-normal);
    font-weight: 700;
    color: var(--or);
    font-variant-numeric: tabular-nums;
    transition: transform var(--d-normale), color var(--d-normale);
  }
  .monte {
    transform: scale(1.35);
    color: var(--vert);
  }
</style>
