<script>
  import { typo } from '../lib/grammaire.js';

  // Phrase à trous des « Phrases rigolotes » : le trou ___ est mis en scène.
  let { phrase } = $props();
  const morceaux = $derived(typo(phrase).split('___'));
</script>

<div class="phrase">
  {#each morceaux as m, i}
    {m}{#if i < morceaux.length - 1}<span class="trou">?</span>{/if}
  {/each}
</div>

<style>
  .phrase {
    padding: var(--e-3) var(--e-4);
    border-radius: var(--r-moyen);
    background: #fff;
    color: var(--texte-sur-or);
    font-size: var(--t-moyen);
    font-weight: 700;
    line-height: 1.35;
    text-align: center;
    box-shadow: var(--ombre);
    transform: rotate(-1deg);
    animation: carte 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .trou {
    display: inline-block;
    min-width: 3.5em;
    margin: 0 var(--e-1);
    padding: 0 var(--e-2);
    border-bottom: 3px dashed var(--rose);
    color: var(--rose);
    animation: trou 1s ease-in-out infinite alternate;
  }
  @keyframes carte {
    from { transform: scale(0.6) rotate(-6deg); opacity: 0; }
    to { transform: rotate(-1deg); opacity: 1; }
  }
  @keyframes trou {
    from { transform: scale(1); }
    to { transform: scale(1.15); }
  }
</style>
