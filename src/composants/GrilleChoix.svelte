<script>
  import { sons } from '../lib/audio.js';

  /**
   * Grille de réponses illustrées.
   * options : [{ id, label, emoji, couleur? }]
   * etat : { choisi?: id, bonne?: id }  (bonne est montrée après la réponse)
   */
  let { options, onchoix, choisi = null, bonne = null, verrouille = false, colonnes = 2, avatars = false } = $props();

  function choisir(o) {
    if (verrouille) return;
    sons.pop();
    onchoix?.(o);
  }

  function etatDe(o) {
    if (bonne) {
      if (o.id === bonne) return 'bonne';
      if (o.id === choisi) return 'mauvaise';
      return 'eteinte';
    }
    return o.id === choisi ? 'choisie' : '';
  }
</script>

<div class="grille" class:avatars style="--colonnes: {colonnes}">
  {#each options as o, i (o.id)}
    <button
      class="option {etatDe(o)}"
      style="--i: {i}; --couleur: {o.couleur ?? 'var(--carte-forte)'}"
      disabled={verrouille && !bonne}
      onclick={() => choisir(o)}
    >
      <span class="emoji" class:rond={avatars}>{o.emoji}</span>
      <span class="label">{o.label}</span>
    </button>
  {/each}
</div>

<style>
  .grille {
    display: grid;
    grid-template-columns: repeat(var(--colonnes), 1fr);
    gap: var(--e-3);
    width: 100%;
  }
  .option {
    position: relative;
    min-height: 96px;
    padding: var(--e-3);
    border: 3px solid var(--bord);
    border-radius: var(--r-moyen);
    background: var(--carte-forte);
    backdrop-filter: blur(6px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--e-2);
    text-align: center;
    animation: arrive var(--d-normale) cubic-bezier(0.34, 1.56, 0.64, 1) both;
    animation-delay: calc(var(--i) * 70ms);
    transition: transform var(--d-rapide), background var(--d-normale), border-color var(--d-normale), opacity var(--d-normale);
  }
  .option:active:not(:disabled) {
    transform: scale(0.95);
  }
  .option:disabled {
    cursor: default;
  }
  .emoji {
    font-size: 40px;
    line-height: 1;
  }
  .rond {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--couleur);
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.85);
    font-size: 38px;
  }
  .label {
    font-size: var(--t-normal);
    font-weight: 600;
    line-height: 1.2;
  }
  .choisie {
    border-color: var(--or);
    background: var(--or-voile);
    transform: scale(1.03);
  }
  .bonne {
    border-color: var(--vert);
    background: rgba(61, 220, 132, 0.35);
    animation: gagne 0.6s ease-in-out 2;
    z-index: 1;
  }
  .mauvaise {
    border-color: var(--rouge);
    background: rgba(255, 90, 90, 0.35);
    animation: secoue 0.4s ease-in-out;
  }
  .eteinte {
    opacity: 0.35;
  }
  @keyframes arrive {
    from { transform: translateY(24px) scale(0.85); opacity: 0; }
    to { transform: none; opacity: 1; }
  }
  @keyframes gagne {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); box-shadow: 0 0 30px rgba(61, 220, 132, 0.8); }
  }
  @keyframes secoue {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    75% { transform: translateX(8px); }
  }
</style>
