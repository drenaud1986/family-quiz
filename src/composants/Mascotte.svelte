<script>
import { typo } from '../lib/grammaire.js';
  // Le présentateur : un micro doré à nœud papillon (personnage original).
  /** humeur : 'content' | 'parle' | 'surpris' | 'decu' | 'suspense' | 'fete' */
  let { humeur = 'content', bulle = '', taille = 140, cote = 'droite' } = $props();

  const bouches = {
    content: 'M78 104 Q100 124 122 104',
    parle: 'M84 104 Q100 120 116 104 Q100 112 84 104',
    surpris: 'M92 108 a8 10 0 1 0 16 0 a8 10 0 1 0 -16 0',
    decu: 'M80 114 Q100 98 120 114',
    suspense: 'M82 108 Q91 102 100 108 T118 108',
    fete: 'M74 100 Q100 132 126 100 Z'
  };
  const sourcils = {
    content: ['M68 62 Q78 56 88 62', 'M112 62 Q122 56 132 62'],
    parle: ['M68 62 Q78 56 88 62', 'M112 62 Q122 56 132 62'],
    surpris: ['M68 52 Q78 44 88 52', 'M112 52 Q122 44 132 52'],
    decu: ['M68 58 Q78 64 88 64', 'M112 64 Q122 64 132 58'],
    suspense: ['M68 62 L88 58', 'M112 58 L132 62'],
    fete: ['M68 56 Q78 48 88 56', 'M112 56 Q122 48 132 56']
  };
  const regard = $derived(humeur === 'suspense' ? 5 : 0);
</script>

<div class="mascotte {cote}" style="--taille: {taille}px">
  {#if bulle}
    {#key bulle}
      <div class="bulle">{typo(bulle)}</div>
    {/key}
  {/if}
  <svg viewBox="0 0 200 240" class="corps {humeur}" aria-hidden="true">
    <defs>
      <radialGradient id="tete-or" cx="38%" cy="30%" r="75%">
        <stop offset="0" stop-color="#fff2b0" />
        <stop offset="0.45" stop-color="#ffc83d" />
        <stop offset="1" stop-color="#d98e00" />
      </radialGradient>
      <pattern id="grille" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M0 5 H10 M5 0 V10" stroke="#b87800" stroke-opacity=".25" stroke-width="1.2" />
      </pattern>
      <linearGradient id="manche" x1="0" x2="1">
        <stop offset="0" stop-color="#3a1a80" />
        <stop offset=".5" stop-color="#6a35d6" />
        <stop offset="1" stop-color="#3a1a80" />
      </linearGradient>
    </defs>

    <!-- bras -->
    <g class="bras-g">
      <path d="M72 168 Q40 170 34 140" stroke="#6a35d6" stroke-width="9" fill="none" stroke-linecap="round" />
      <circle cx="34" cy="136" r="12" fill="#fff" />
    </g>
    <g class="bras-d">
      <path d="M128 168 Q160 170 166 140" stroke="#6a35d6" stroke-width="9" fill="none" stroke-linecap="round" />
      <circle cx="166" cy="136" r="12" fill="#fff" />
    </g>

    <!-- manche -->
    <rect x="72" y="140" width="56" height="88" rx="22" fill="url(#manche)" />
    <rect x="80" y="196" width="40" height="6" rx="3" fill="#ffc83d" opacity=".8" />
    <rect x="80" y="208" width="40" height="6" rx="3" fill="#ffc83d" opacity=".5" />

    <!-- tête -->
    <circle cx="100" cy="86" r="70" fill="url(#tete-or)" />
    <circle cx="100" cy="86" r="70" fill="url(#grille)" />
    <circle cx="100" cy="86" r="66" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="4" />
    <!-- nœud papillon, devant la tête -->
    <path d="M100 160 L72 145 L72 175 Z M100 160 L128 145 L128 175 Z" fill="#ff4fa3" stroke="#c2186b" stroke-width="2" stroke-linejoin="round" />
    <circle cx="100" cy="160" r="8" fill="#ff7fc0" stroke="#c2186b" stroke-width="2" />

    <!-- visage -->
    <g class="yeux">
      <ellipse cx="78" cy="80" rx="11" ry="13" fill="#fff" />
      <ellipse cx="122" cy="80" rx="11" ry="13" fill="#fff" />
      <circle cx={80 + regard} cy="82" r="6" fill="#2d1066" />
      <circle cx={124 + regard} cy="82" r="6" fill="#2d1066" />
      <circle cx={82 + regard} cy="79" r="2" fill="#fff" />
      <circle cx={126 + regard} cy="79" r="2" fill="#fff" />
    </g>
    <path d={sourcils[humeur][0]} stroke="#7a4a00" stroke-width="4" fill="none" stroke-linecap="round" />
    <path d={sourcils[humeur][1]} stroke="#7a4a00" stroke-width="4" fill="none" stroke-linecap="round" />
    <circle cx="64" cy="102" r="8" fill="#ff7fa8" opacity=".55" />
    <circle cx="136" cy="102" r="8" fill="#ff7fa8" opacity=".55" />
    <path
      class="bouche"
      d={bouches[humeur]}
      stroke="#5a2a00"
      stroke-width="4"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill={humeur === 'fete' || humeur === 'surpris' || humeur === 'parle' ? '#7a1f3d' : 'none'}
    />
  </svg>
</div>

<style>
  .mascotte {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
  }
  .corps {
    width: var(--taille);
    height: calc(var(--taille) * 1.2);
    animation: flotte 2.6s ease-in-out infinite;
    filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.45));
    overflow: visible;
  }
  .yeux {
    animation: cligne 4s infinite;
    transform-origin: 100px 80px;
  }
  .parle .bouche {
    animation: parle 0.28s ease-in-out infinite alternate;
    transform-origin: 100px 108px;
  }
  .content .bras-d,
  .parle .bras-d {
    animation: salue 1.4s ease-in-out infinite;
    transform-origin: 128px 168px;
  }
  .fete .bras-g,
  .fete .bras-d {
    animation: hourra 0.5s ease-in-out infinite alternate;
  }
  .fete .bras-g {
    transform-origin: 72px 168px;
  }
  .fete .bras-d {
    transform-origin: 128px 168px;
  }
  .fete {
    animation: saute 0.5s ease-in-out infinite alternate;
  }
  .surpris {
    animation: sursaut 0.4s ease-out;
  }
  .decu {
    animation: affaisse 2.6s ease-in-out infinite;
  }
  .suspense {
    animation: tremble 0.12s linear infinite;
  }
  .bulle {
    position: relative;
    max-width: min(320px, 80vw);
    margin-bottom: var(--e-3);
    padding: var(--e-3) var(--e-4);
    background: #fff;
    color: var(--texte-sur-or);
    border-radius: var(--r-moyen);
    font-size: var(--t-normal);
    font-weight: 600;
    line-height: 1.3;
    text-align: center;
    box-shadow: var(--ombre);
    animation: bulle var(--d-normale) cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .bulle::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    margin-left: -10px;
    border: 10px solid transparent;
    border-top-color: #fff;
    border-bottom: 0;
  }
  @keyframes flotte {
    0%, 100% { transform: translateY(0) rotate(-2deg); }
    50% { transform: translateY(-8px) rotate(2deg); }
  }
  @keyframes cligne {
    0%, 46%, 50%, 100% { transform: scaleY(1); }
    48% { transform: scaleY(0.1); }
  }
  @keyframes parle {
    from { transform: scaleY(0.6); }
    to { transform: scaleY(1.3); }
  }
  @keyframes salue {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-25deg); }
  }
  @keyframes hourra {
    from { transform: rotate(0deg); }
    to { transform: rotate(-30deg); }
  }
  @keyframes saute {
    from { transform: translateY(0); }
    to { transform: translateY(-14px); }
  }
  @keyframes sursaut {
    0% { transform: scale(1); }
    40% { transform: scale(1.12) translateY(-10px); }
    100% { transform: scale(1); }
  }
  @keyframes affaisse {
    0%, 100% { transform: translateY(4px) rotate(-4deg); }
    50% { transform: translateY(8px) rotate(-6deg); }
  }
  @keyframes tremble {
    0% { transform: translateX(-1px); }
    50% { transform: translateX(1px); }
    100% { transform: translateX(-1px); }
  }
  @keyframes bulle {
    from { transform: scale(0.6); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
</style>
