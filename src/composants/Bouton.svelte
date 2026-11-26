<script>
  import { sons } from '../lib/audio.js';

  /** variante : 'or' (principal) | 'carte' (secondaire) | 'discret' | 'danger' */
  let { variante = 'or', taille = 'normal', large = false, desactive = false, son = true, onclick, children, ...reste } = $props();

  function clic(e) {
    if (desactive) return;
    if (son) sons.clic();
    onclick?.(e);
  }
</script>

<button class="bouton {variante} {taille}" class:large disabled={desactive} onclick={clic} {...reste}>
  {@render children?.()}
</button>

<style>
  .bouton {
    min-height: var(--cible);
    padding: var(--e-3) var(--e-5);
    border: none;
    border-radius: var(--r-rond);
    font-size: var(--t-moyen);
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--e-2);
    transition: transform var(--d-rapide), box-shadow var(--d-rapide), opacity var(--d-rapide);
  }
  .bouton:active:not(:disabled) {
    transform: scale(0.95);
  }
  .bouton:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .large {
    width: 100%;
  }
  .grand {
    min-height: clamp(56px, 9vh, 72px);
    font-size: var(--t-grand);
  }
  .petit {
    min-height: 44px;
    font-size: var(--t-petit);
    padding: var(--e-2) var(--e-4);
  }
  .or {
    background: linear-gradient(180deg, var(--or-clair), var(--or));
    color: var(--texte-sur-or);
    box-shadow: 0 6px 0 var(--or-fonce), var(--ombre);
  }
  .or:active:not(:disabled) {
    box-shadow: 0 2px 0 var(--or-fonce), var(--ombre);
  }
  .carte {
    background: var(--carte-forte);
    border: 2px solid var(--bord);
    backdrop-filter: blur(6px);
  }
  .discret {
    background: transparent;
    color: var(--texte-doux);
    font-weight: 500;
    font-size: var(--t-normal);
  }
  .danger {
    background: var(--rouge);
    box-shadow: 0 6px 0 var(--rouge-fonce), var(--ombre);
  }
</style>
