<script>
  import Plateau from './composants/Plateau.svelte';
  import Accueil from './ecrans/Accueil.svelte';
  import Joueurs from './ecrans/Joueurs.svelte';
  import FicheJoueur from './ecrans/FicheJoueur.svelte';
  import Reglages from './ecrans/Reglages.svelte';
  import NouvellePartie from './ecrans/NouvellePartie.svelte';
  import Questionnaire from './ecrans/Questionnaire.svelte';
  import Emission from './ecrans/Emission.svelte';
  import { nav, chargerReglages } from './lib/etat.svelte.js';
  import { demanderStockagePersistant } from './lib/db.js';
  import { debloquerAudio } from './lib/audio.js';

  const ecrans = { accueil: Accueil, joueurs: Joueurs, fiche: FicheJoueur, reglages: Reglages, nouvelle: NouvellePartie, questionnaire: Questionnaire, emission: Emission };

  let pret = $state(false);
  chargerReglages().then(() => (pret = true));
  demanderStockagePersistant();

  const Ecran = $derived(ecrans[nav.ecran] ?? Accueil);
</script>

<svelte:window onpointerdown={debloquerAudio} />

<Plateau intense={nav.ecran === 'emission'} />
<main class="scene">
  {#if pret}
    {#key nav.ecran + JSON.stringify(nav.params)}
      <div class="ecran">
        <Ecran {...nav.params} />
      </div>
    {/key}
  {/if}
</main>

<style>
  .scene {
    position: relative;
    z-index: 1;
    height: 100%;
    max-width: 720px;
    margin: 0 auto;
  }
  .ecran {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    animation: entree var(--d-normale) ease-out;
  }
  @keyframes entree {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: none; }
  }
</style>
