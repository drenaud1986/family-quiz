<script>
  let { joueur, taille = 64, nom = false, saute = false, eteint = false } = $props();
</script>

<div class="avatar" class:eteint style="--taille: {taille}px; --couleur: {joueur?.couleur ?? '#888'}">
  <div class="rond" class:saute>
    <span>{joueur?.emoji ?? '❓'}</span>
  </div>
  {#if nom}<div class="nom">{joueur?.nom}</div>{/if}
</div>

<style>
  .avatar {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: var(--e-1);
    transition: opacity var(--d-normale), filter var(--d-normale);
  }
  .eteint {
    opacity: 0.35;
    filter: grayscale(0.8);
  }
  .rond {
    width: var(--taille);
    height: var(--taille);
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.35), transparent 55%), var(--couleur);
    box-shadow: 0 0 0 calc(var(--taille) * 0.06) rgba(255, 255, 255, 0.85), 0 6px 16px rgba(0, 0, 0, 0.4);
  }
  .rond span {
    font-size: calc(var(--taille) * 0.58);
    line-height: 1;
  }
  .saute {
    animation: saute 0.7s ease-in-out infinite;
  }
  .nom {
    font-weight: 600;
    font-size: clamp(14px, calc(var(--taille) * 0.24), 28px);
    text-align: center;
    max-width: calc(var(--taille) * 2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @keyframes saute {
    0%, 100% { transform: translateY(0) scale(1); }
    40% { transform: translateY(-18%) scale(1.05, 0.95); }
    60% { transform: translateY(-18%) scale(0.97, 1.03); }
  }
</style>
