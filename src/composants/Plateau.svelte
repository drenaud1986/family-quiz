<script>
  // Décor de plateau télé : fond, projecteurs, rampe d'ampoules.
  let { intense = false } = $props();
  const ampoules = Array.from({ length: 14 });
</script>

<div class="plateau" class:intense aria-hidden="true">
  <div class="halo"></div>
  <div class="projecteur gauche"></div>
  <div class="projecteur droite"></div>
  <div class="rampe haut">
    {#each ampoules as _, i}<span style="animation-delay: {(i % 4) * 0.25}s"></span>{/each}
  </div>
  <div class="rampe bas">
    {#each ampoules as _, i}<span style="animation-delay: {((i + 2) % 4) * 0.25}s"></span>{/each}
  </div>
  <div class="sol"></div>
</div>

<style>
  .plateau {
    position: fixed;
    inset: 0;
    overflow: hidden;
    background:
      radial-gradient(120% 70% at 50% 0%, var(--fond-3) 0%, transparent 60%),
      radial-gradient(90% 60% at 50% 110%, #5a1a8f 0%, transparent 70%),
      linear-gradient(180deg, var(--fond-2), var(--fond-1));
    z-index: 0;
  }
  .halo {
    position: absolute;
    inset: -20%;
    background: radial-gradient(circle at 50% 40%, rgba(255, 200, 61, 0.12), transparent 45%);
    animation: respire 6s ease-in-out infinite;
  }
  .projecteur {
    position: absolute;
    top: -10%;
    width: 60%;
    height: 120%;
    background: conic-gradient(from 180deg at 50% 0%, transparent 160deg, rgba(255, 255, 255, 0.09) 175deg, rgba(255, 255, 255, 0.14) 180deg, rgba(255, 255, 255, 0.09) 185deg, transparent 200deg);
    transform-origin: 50% 0%;
    mix-blend-mode: screen;
  }
  .gauche {
    left: -10%;
    animation: balaye-g 9s ease-in-out infinite;
  }
  .droite {
    right: -10%;
    animation: balaye-d 11s ease-in-out infinite;
  }
  .intense .projecteur {
    animation-duration: 3s;
  }
  .rampe {
    position: absolute;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-around;
    padding: 0 var(--e-3);
  }
  .haut {
    top: 6px;
  }
  .bas {
    bottom: 6px;
  }
  .rampe span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--or);
    box-shadow: 0 0 8px var(--or);
    animation: clignote 1s steps(2) infinite;
  }
  .intense .rampe span {
    animation-duration: 0.4s;
  }
  .sol {
    position: absolute;
    left: -20%;
    right: -20%;
    bottom: -30%;
    height: 50%;
    background: radial-gradient(ellipse at 50% 50%, rgba(47, 211, 255, 0.16), transparent 70%);
  }
  @keyframes balaye-g {
    0%, 100% { transform: rotate(-18deg); }
    50% { transform: rotate(14deg); }
  }
  @keyframes balaye-d {
    0%, 100% { transform: rotate(16deg); }
    50% { transform: rotate(-12deg); }
  }
  @keyframes clignote {
    0% { opacity: 1; }
    100% { opacity: 0.35; }
  }
  @keyframes respire {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.08); }
  }
</style>
