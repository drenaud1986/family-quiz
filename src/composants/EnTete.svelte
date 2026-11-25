<script>
  import { retour } from '../lib/etat.svelte.js';
  import { sons } from '../lib/audio.js';

  // Barre de titre des écrans de menu.
  let { titre, onretour = retour, actions } = $props();
</script>

<header class="entete">
  <button
    class="retour"
    aria-label="Retour"
    onclick={() => {
      sons.clic();
      onretour();
    }}>←</button
  >
  <h1>{titre}</h1>
  <div class="actions">{@render actions?.()}</div>
</header>

<style>
  .entete {
    display: grid;
    grid-template-columns: var(--cible) 1fr var(--cible);
    align-items: center;
    gap: var(--e-2);
    padding: var(--e-5) var(--e-4) var(--e-3);
  }
  .retour {
    width: var(--cible);
    height: var(--cible);
    border-radius: 50%;
    border: 2px solid var(--bord);
    background: var(--carte);
    font-size: var(--t-grand);
    line-height: 1;
  }
  h1 {
    text-align: center;
    font-size: var(--t-grand);
    font-weight: 700;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
  }
</style>
