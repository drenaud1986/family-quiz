<script>
  import { tp } from '../lib/ecran.svelte.js';
  import { onMount, onDestroy } from 'svelte';
  import Chrono from './Chrono.svelte';
  import GrilleChoix from './GrilleChoix.svelte';
  import { sons, lancerMusiqueRafale, arreterMusique } from '../lib/audio.js';
  import { vibrer, taire } from '../lib/appareil.js';
  import { pointsEtape } from '../lib/jeu.js';
  import { pause } from '../lib/hasard.js';
  import { typo } from '../lib/grammaire.js';

  // Le tour de rafale d'un joueur : un maximum de bonnes réponses avant la fin du chrono.
  let { tour, parId, enPause = false, onfin } = $props();

  let compte = $state(3);
  let phase = $state('compte'); // compte | jeu | fini
  let index = $state(0);
  let choisi = $state(null);
  let bonne = $state(null);
  let resultats = [];
  let nbBonnes = $state(0);
  let points = $state(0);

  const question = $derived(tour.pool[index]);
  const sujet = $derived(question ? parId[question.sujetId] : null);

  onMount(async () => {
    taire();
    for (const n of [3, 2, 1]) {
      compte = n;
      sons.tic(true);
      await pause(800);
    }
    compte = 0;
    sons.jingle();
    phase = 'jeu';
    lancerMusiqueRafale(tour.secondes);
  });
  onDestroy(arreterMusique);

  async function repondre(o) {
    if (phase !== 'jeu' || choisi) return;
    choisi = o.id;
    bonne = question.bonne;
    const correct = o.id === question.bonne;
    const p = correct ? pointsEtape('rafale', question) : 0;
    resultats.push({ questionId: question.questionId, sujetId: question.sujetId, correct, points: p });
    if (correct) {
      nbBonnes++;
      points += p;
      sons.bonne();
      vibrer(40);
    } else {
      sons.mauvaise();
      vibrer([30, 40, 30]);
    }
    await pause(correct ? 450 : 900);
    if (phase !== 'jeu') return;
    choisi = null;
    bonne = null;
    if (index < tour.pool.length - 1) index++;
    else finir();
  }

  function finir() {
    if (phase === 'fini') return;
    phase = 'fini';
    arreterMusique();
    onfin?.(resultats);
  }
</script>

<section class="rafale">
  {#if phase === 'compte'}
    <div class="compte">{#key compte}<span>{compte || 'GO !'}</span>{/key}</div>
  {:else}
    <header class="haut">
      <Chrono secondes={tour.secondes} enMarche={phase === 'jeu' && !enPause} onfin={finir} taille={tp(84)} />
      <div class="compteur">
        <span>✅</span>
        {#key nbBonnes}<strong>{nbBonnes}</strong>{/key}
        <small>{points} pts</small>
      </div>
    </header>

    {#if question}
      {#key index}
        <div class="question">
          {#if sujet}<p class="sur">Sur {sujet.emoji} {sujet.nom}</p>{/if}
          <h2>{typo(question.texte)}</h2>
          <GrilleChoix
            options={question.options}
            avatars={question.forme === 'avatars'}
            colonnes={question.options.length > 4 ? 3 : 2}
            {choisi}
            {bonne}
            verrouille={!!choisi}
            onchoix={repondre}
          />
        </div>
      {/key}
    {/if}
  {/if}
</section>

<style>
  .rafale {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
  }
  .compte {
    flex: 1;
    display: grid;
    place-items: center;
  }
  .compte span {
    font-size: clamp(90px, 28vmin, 140px);
    font-weight: 700;
    color: var(--or);
    text-shadow: 0 8px 0 var(--or-fonce), 0 0 60px rgba(255, 200, 61, 0.6);
    animation: compte 0.8s ease-out;
  }
  .haut {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .compteur {
    display: flex;
    align-items: baseline;
    gap: var(--e-2);
    padding: var(--e-2) var(--e-4);
    border-radius: var(--r-rond);
    background: rgba(0, 0, 0, 0.35);
    font-size: var(--t-grand);
  }
  .compteur strong {
    font-size: var(--t-titre);
    color: var(--vert);
    display: inline-block;
    animation: rebond var(--d-normale) cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .compteur small {
    color: var(--texte-doux);
    font-size: var(--t-petit);
  }
  .question {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    animation: entre 0.25s ease-out;
  }
  .sur {
    text-align: center;
    color: var(--texte-doux);
    font-weight: 600;
  }
  h2 {
    text-align: center;
    font-size: var(--t-grand);
    line-height: 1.2;
  }
  @keyframes compte {
    from { transform: scale(2.4); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  @keyframes rebond {
    from { transform: scale(1.8); }
    to { transform: scale(1); }
  }
  @keyframes entre {
    from { opacity: 0; transform: translateX(40px); }
    to { opacity: 1; transform: none; }
  }
</style>
