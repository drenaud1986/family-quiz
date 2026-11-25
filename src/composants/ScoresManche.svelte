<script>
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import Avatar from './Avatar.svelte';
  import Bouton from './Bouton.svelte';
  import Mascotte from './Mascotte.svelte';
  import { scoresEquipes } from '../lib/jeu.js';
  import { sons } from '../lib/audio.js';
  import { dire } from '../lib/appareil.js';

  // Classement animé entre deux manches.
  let { partie, parId, scores, titre, bouton, onsuite } = $props();

  let revele = $state(false);
  const classement = $derived(
    [...partie.joueurs].map((id) => ({ id, score: scores[id] ?? 0 })).sort((a, b) => (revele ? b.score - a.score : 0))
  );
  const max = $derived(Math.max(1, ...Object.values(scores)));
  const equipes = $derived(scoresEquipes(partie, scores));
  const enTete = $derived.by(() => {
    if (equipes) {
      const [a, b] = equipes;
      return a.score === b.score ? 'Égalité parfaite entre les équipes !' : `${a.score > b.score ? a.nom : b.nom} mènent la danse !`;
    }
    const premier = classement[0];
    return revele && premier ? `${parId[premier.id]?.nom} est en tête !` : 'Voyons les scores…';
  });

  onMount(() => {
    sons.roulement(1);
    setTimeout(() => {
      revele = true;
      sons.points();
      dire(enTete);
    }, 1100);
  });
</script>

<section class="scores">
  <h1>{titre}</h1>
  <Mascotte humeur={revele ? 'content' : 'suspense'} taille={110} bulle={enTete} />

  {#if equipes}
    <div class="equipes">
      {#each equipes as e}
        <div class="equipe" style="--couleur: {e.couleur}">
          <span class="emoji">{e.emoji}</span>
          <strong>{e.nom}</strong>
          <span class="total">{revele ? e.score : '…'}</span>
        </div>
      {/each}
    </div>
  {/if}

  <ol class="liste">
    {#each classement as ligne, i (ligne.id)}
      <li animate:flip={{ duration: 600 }}>
        <span class="rang">{revele ? i + 1 : '·'}</span>
        <Avatar joueur={parId[ligne.id]} taille={48} />
        <div class="piste">
          <span class="nom">{parId[ligne.id]?.nom}</span>
          <div class="barre" style="width: {revele ? (ligne.score / max) * 100 : 4}%; background: {parId[ligne.id]?.couleur}"></div>
        </div>
        <strong class="pts">{revele ? ligne.score : ''}</strong>
      </li>
    {/each}
  </ol>

  <Bouton taille="grand" onclick={onsuite}>{bouton}</Bouton>
</section>

<style>
  .scores {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--e-4);
  }
  h1 {
    font-size: var(--t-titre);
    color: var(--or);
    text-align: center;
  }
  .equipes {
    display: flex;
    gap: var(--e-3);
    width: 100%;
  }
  .equipe {
    flex: 1;
    padding: var(--e-3);
    border-radius: var(--r-moyen);
    border: 3px solid var(--couleur);
    background: color-mix(in srgb, var(--couleur) 22%, transparent);
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .equipe .emoji {
    font-size: 32px;
  }
  .total {
    font-size: var(--t-titre);
    font-weight: 700;
  }
  .liste {
    list-style: none;
    margin: 0;
    padding: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
  }
  li {
    display: flex;
    align-items: center;
    gap: var(--e-3);
    padding: var(--e-2) var(--e-3);
    border-radius: var(--r-moyen);
    background: var(--carte);
  }
  .rang {
    width: 28px;
    font-size: var(--t-moyen);
    font-weight: 700;
    color: var(--or);
    text-align: center;
  }
  .piste {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
  }
  .nom {
    font-weight: 600;
  }
  .barre {
    height: 12px;
    border-radius: var(--r-rond);
    transition: width 1s cubic-bezier(0.34, 1.2, 0.64, 1);
  }
  .pts {
    min-width: 56px;
    text-align: right;
    font-size: var(--t-moyen);
  }
</style>
