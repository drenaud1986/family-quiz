<script>
  import Avatar from './Avatar.svelte';
  import Bouton from './Bouton.svelte';
  import { onMount } from 'svelte';
  import { sons } from '../lib/audio.js';
  import { dire } from '../lib/appareil.js';
  import { typo } from '../lib/grammaire.js';

  // « Passe la tablette à… » : écran de passage de relais.
  let { joueur, titre = 'Passe la tablette à', emoji = '🙈', consigne = '', bouton = "C'est moi !", onpret } = $props();

  onMount(() => {
    sons.whoosh();
    dire(`${titre} ${joueur.nom} !`);
  });
</script>

<section class="relais">
  <div class="emoji">{emoji}</div>
  <p class="titre">{titre}</p>
  <div class="avatar"><Avatar {joueur} taille={150} saute /></div>
  <h1 class="nom" style="color: {joueur.couleur}">{joueur.nom}</h1>
  {#if consigne}<p class="consigne">{typo(consigne)}</p>{/if}
  <Bouton taille="grand" onclick={onpret}>{bouton}</Bouton>
</section>

<style>
  .relais {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--e-4);
    padding: var(--e-6) var(--e-5);
    text-align: center;
  }
  .emoji {
    font-size: 56px;
    animation: balance 1.2s ease-in-out infinite;
  }
  .titre {
    font-size: var(--t-grand);
    color: var(--texte-doux);
  }
  .avatar {
    animation: zoom var(--d-lente) cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .nom {
    font-size: var(--t-geant);
    line-height: 1;
    text-shadow: 0 4px 0 rgba(0, 0, 0, 0.35);
  }
  .consigne {
    max-width: 420px;
    color: var(--texte-doux);
    font-size: var(--t-normal);
    line-height: 1.4;
  }
  @keyframes balance {
    0%, 100% { transform: rotate(-10deg); }
    50% { transform: rotate(10deg); }
  }
  @keyframes zoom {
    from { transform: scale(0); }
    to { transform: scale(1); }
  }
</style>
