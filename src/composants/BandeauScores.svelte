<script>
  import Avatar from './Avatar.svelte';
  import { scoresEquipes } from '../lib/jeu.js';

  // Bandeau compact des scores, en haut de l'émission.
  let { partie, parId, scores, actifId = null } = $props();
  const equipes = $derived(scoresEquipes(partie, scores));
</script>

<div class="bandeau">
  {#if equipes}
    {#each equipes as e, i}
      <div class="equipe" style="--couleur: {e.couleur}">
        <span>{e.emoji} {e.nom}</span>
        {#key e.score}<strong class="score">{e.score}</strong>{/key}
      </div>
      {#if i === 0}<span class="vs">VS</span>{/if}
    {/each}
  {:else}
    {#each partie.joueurs as id (id)}
      <div class="joueur" class:actif={id === actifId}>
        <Avatar joueur={parId[id]} taille={34} />
        {#key scores[id]}<strong class="score">{scores[id] ?? 0}</strong>{/key}
      </div>
    {/each}
  {/if}
</div>

<style>
  .bandeau {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--e-2);
    padding: var(--e-2) var(--e-3);
    border-radius: var(--r-rond);
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid var(--bord);
    flex-wrap: wrap;
  }
  .joueur {
    display: flex;
    align-items: center;
    gap: var(--e-1);
    padding: 2px var(--e-2) 2px 2px;
    border-radius: var(--r-rond);
    transition: background var(--d-normale);
  }
  .joueur.actif {
    background: rgba(255, 200, 61, 0.3);
  }
  .equipe {
    display: flex;
    align-items: center;
    gap: var(--e-2);
    padding: var(--e-1) var(--e-3);
    border-radius: var(--r-rond);
    background: color-mix(in srgb, var(--couleur) 30%, transparent);
    border: 2px solid var(--couleur);
    font-weight: 600;
    font-size: var(--t-petit);
  }
  .score {
    font-size: var(--t-normal);
    font-weight: 700;
    color: var(--or);
    display: inline-block;
    animation: monte var(--d-lente) cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .vs {
    font-weight: 700;
    color: var(--or);
  }
  @keyframes monte {
    from { transform: scale(1.8); color: #fff; }
    to { transform: scale(1); }
  }
</style>
