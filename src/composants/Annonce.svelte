<script>
  import { tp } from '../lib/ecran.svelte.js';
  import { onMount, onDestroy } from 'svelte';
  import Avatar from './Avatar.svelte';
  import Bouton from './Bouton.svelte';
  import { sons } from '../lib/audio.js';
  import { dire } from '../lib/appareil.js';
  import { accord } from '../lib/grammaire.js';

  // « Au tour de… Question sur… » avec tirage animé de la personne visée.
  let { actif, sujet = null, candidats = [], etiquette = 'Question sur…', or = false, onpret } = $props();

  let affiche = $state(sujet ? null : actif);
  let pret = $state(!sujet);
  let timer;

  onMount(() => {
    sons.whoosh();
    if (or) setTimeout(() => sons.or(), 300);
    if (!sujet) {
      dire(`Au tour de ${actif.nom} !`);
      return;
    }
    dire(`Au tour de ${actif.nom} ! ${etiquette}`).then(() => {});
    const roulette = candidats.length > 1 ? candidats : [sujet];
    let i = 0;
    const debut = performance.now();
    setTimeout(() => sons.roulement(1.5), 500);
    const tourner = () => {
      const ecoule = performance.now() - debut;
      if (ecoule > 2000) {
        affiche = sujet;
        pret = true;
        sons.pop();
        dire(sujet.nom);
        return;
      }
      affiche = roulette[i++ % roulette.length];
      timer = setTimeout(tourner, 70 + (ecoule / 2000) * 160);
    };
    timer = setTimeout(tourner, 500);
  });
  onDestroy(() => clearTimeout(timer));
</script>

<section class="annonce">
  {#if or}<div class="badge-or">⭐ Question en or ⭐<small>Points doublés !</small></div>{/if}
  <p class="petit">🎤 Au tour de</p>
  <div class="actif"><Avatar joueur={actif} taille={tp(120)} saute /></div>
  <h1 style="color: {actif.couleur}">{actif.nom}</h1>

  {#if sujet}
    <p class="petit">{etiquette}</p>
    <div class="roulette" class:pose={pret}>
      {#if affiche}<Avatar joueur={affiche} taille={tp(96)} nom />{/if}
    </div>
  {/if}

  <div class="bouton" class:visible={pret}>
    <Bouton taille="grand" desactive={!pret} onclick={onpret}>{accord(actif, 'Je suis prêt !', 'Je suis prête !')}</Bouton>
  </div>
</section>

<style>
  .annonce {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--e-3);
    text-align: center;
  }
  .badge-or {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--e-2) var(--e-5);
    border-radius: var(--r-moyen);
    background: linear-gradient(135deg, var(--or-clair), var(--or), var(--or-fonce));
    color: var(--texte-sur-or);
    font-weight: 700;
    font-size: var(--t-grand);
    box-shadow: 0 0 40px rgba(255, 200, 61, 0.6);
    animation: badge 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), lueur 1.2s ease-in-out 0.8s infinite alternate;
  }
  .badge-or small {
    font-size: var(--t-petit);
  }
  @keyframes badge {
    from { transform: scale(0) rotate(-20deg); }
    to { transform: none; }
  }
  @keyframes lueur {
    from { box-shadow: 0 0 20px rgba(255, 200, 61, 0.4); }
    to { box-shadow: 0 0 50px rgba(255, 200, 61, 0.9); }
  }
  .petit {
    font-size: var(--t-moyen);
    color: var(--texte-doux);
  }
  .actif {
    animation: zoom var(--d-lente) cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  h1 {
    font-size: var(--t-geant);
    line-height: 1;
    text-shadow: 0 4px 0 rgba(0, 0, 0, 0.35);
  }
  .roulette {
    min-height: clamp(96px, 16vh, 140px);
    padding: var(--e-3) var(--e-5);
    border-radius: var(--r-grand);
    border: 3px dashed var(--bord);
    background: var(--champ);
  }
  .roulette.pose {
    border: 3px solid var(--or);
    box-shadow: 0 0 40px rgba(255, 200, 61, 0.5);
    animation: pose 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .bouton {
    margin-top: var(--e-4);
    opacity: 0;
    transform: translateY(20px);
    transition: opacity var(--d-normale), transform var(--d-normale);
  }
  .bouton.visible {
    opacity: 1;
    transform: none;
  }
  @keyframes zoom {
    from { transform: scale(0) rotate(-20deg); }
    to { transform: none; }
  }
  @keyframes pose {
    0% { transform: scale(1); }
    50% { transform: scale(1.15); }
    100% { transform: scale(1); }
  }
</style>
