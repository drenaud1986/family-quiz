<script>
  import { onDestroy } from 'svelte';
  import { tp } from '../lib/ecran.svelte.js';
  import Mascotte from '../composants/Mascotte.svelte';
  import Bouton from '../composants/Bouton.svelte';
  import Avatar from '../composants/Avatar.svelte';
  import { aller } from '../lib/etat.svelte.js';
  import { listerJoueurs, partieEnCours, abandonnerPartiesEnCours, compterPartiesTerminees } from '../lib/db.js';
  import { questions } from '../lib/banque.js';
  import { auHasard } from '../lib/hasard.js';

  let joueurs = $state([]);
  let enCours = $state(null);
  let nbEmissions = $state(0);
  let astuce = $state('');

  const actifs = $derived(joueurs.filter((j) => !j.archive));

  Promise.all([listerJoueurs(), partieEnCours(), compterPartiesTerminees()]).then(([j, p, n]) => {
    joueurs = j;
    enCours = p;
    nbEmissions = n;
  });

  const ASTUCES = [
    'Astuce : un candidat absent ce soir ? Archive-le depuis sa fiche !',
    'Le saviez-vous ? Une question en or rapporte le double de points.',
    'Trois bonnes réponses d’affilée, et c’est le bonus de série 🔥',
    'Plus vous répondez au questionnaire, plus les questions sont drôles !',
    'Dans les réglages, tu peux changer ma voix. Essaie !',
    'Qui connaît le mieux la famille ? Réponse ce soir !'
  ];
  const minuterie = setInterval(() => (astuce = auHasard(ASTUCES)), 7000);
  onDestroy(() => clearInterval(minuterie));

  const bulle = $derived(
    actifs.length < 2
      ? 'Bienvenue sur le plateau ! Commence par inscrire au moins 2 candidats.'
      : enCours
        ? 'Une émission est en cours. On reprend ?'
        : astuce || 'Bienvenue sur le plateau ! Prêts pour l’émission ?'
  );

  const titre = 'Family Quiz'.split('');

  async function nouvelle() {
    if (enCours) await abandonnerPartiesEnCours();
    aller('nouvelle');
  }
</script>

<section class="accueil">
  <button class="reglages" aria-label="Réglages" onclick={() => aller('reglages')}>⚙️</button>

  <h1 class="logo" aria-label="Family Quiz">
    {#each titre as lettre, i}
      <span style="--i: {i}" class:espace={lettre === ' '}>{lettre}</span>
    {/each}
  </h1>
  <p class="sous-titre">Le jeu télévisé de la famille</p>

  <div class="mascotte">
    <Mascotte humeur="parle" {bulle} taille={tp(170)} />
  </div>

  {#if actifs.length}
    <div class="candidats">
      {#each actifs as j, i (j.id)}
        <div class="candidat" style="--i: {i}"><Avatar joueur={j} taille={tp(52)} /></div>
      {/each}
    </div>
  {/if}

  <div class="actions">
    {#if enCours}
      <Bouton taille="grand" large onclick={() => aller('emission', { partieId: enCours.id })}>▶️ Reprendre l’émission</Bouton>
      <Bouton variante="carte" large desactive={actifs.length < 2} onclick={nouvelle}>🎬 Nouvelle émission</Bouton>
    {:else}
      <Bouton taille="grand" large desactive={actifs.length < 2} onclick={nouvelle}>🎬 Nouvelle émission</Bouton>
    {/if}
    <Bouton variante="carte" large onclick={() => aller('joueurs')}>👨‍👩‍👧‍👦 Les candidats</Bouton>
  </div>

  <p class="pied">
    {questions.length} questions dans la banque{#if nbEmissions} · {nbEmissions} émission{nbEmissions > 1 ? 's' : ''} jouée{nbEmissions > 1 ? 's' : ''}{/if}
  </p>
</section>

<style>
  .accueil {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: calc(var(--cible) + var(--e-4)) var(--e-4) var(--e-4);
    gap: var(--e-3);
  }
  .reglages {
    position: absolute;
    top: var(--e-4);
    right: var(--e-4);
    width: var(--cible);
    height: var(--cible);
    border-radius: 50%;
    border: 2px solid var(--bord);
    background: var(--carte);
    font-size: var(--t-grand);
  }
  .logo {
    font-size: min(var(--t-geant), 12vw);
    font-weight: 700;
    white-space: nowrap;
    text-align: center;
    line-height: 1;
    animation: tombe 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  .logo span {
    display: inline-block;
    color: var(--or);
    text-shadow: 0 4px 0 var(--or-fonce), 0 10px 24px rgba(0, 0, 0, 0.45);
    animation: lettre 2.4s ease-in-out infinite;
    animation-delay: calc(var(--i) * 0.12s);
  }
  .logo span:nth-child(n + 8) {
    color: var(--rose);
    text-shadow: 0 4px 0 var(--rose-fonce), 0 10px 24px rgba(0, 0, 0, 0.45);
  }
  .logo .espace {
    width: 0.3em;
  }
  .sous-titre {
    color: var(--texte-doux);
    font-size: var(--t-moyen);
  }
  .mascotte {
    margin: var(--e-2) 0;
  }
  .candidats {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--e-3);
  }
  .candidat {
    animation: tombe 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    animation-delay: calc(0.6s + var(--i) * 0.1s);
  }
  .actions {
    width: 100%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    margin-top: auto;
  }
  .pied {
    color: var(--texte-faible);
    font-size: var(--t-petit);
    text-align: center;
  }
  @keyframes lettre {
    0%, 100% { transform: translateY(0) rotate(0); }
    50% { transform: translateY(-6px) rotate(-3deg); }
  }
  @keyframes tombe {
    from { transform: translateY(-60px) scale(0.5); opacity: 0; }
    to { transform: none; opacity: 1; }
  }
</style>
