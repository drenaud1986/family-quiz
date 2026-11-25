<script>
  import EnTete from '../composants/EnTete.svelte';
  import Bouton from '../composants/Bouton.svelte';
  import { reglages, changerReglage } from '../lib/etat.svelte.js';
  import { DUREES } from '../lib/jeu.js';
  import { toutEffacer } from '../lib/db.js';
  import { dire } from '../lib/appareil.js';
  import { sons } from '../lib/audio.js';

  let etapeEffacement = $state(0);

  const interrupteurs = [
    { cle: 'son', label: 'Effets sonores', emoji: '🔊' },
    { cle: 'musique', label: 'Musique de la rafale', emoji: '🎵' },
    { cle: 'voix', label: 'Lecture à voix haute', emoji: '🗣️' }
  ];
  const vitesses = [
    { v: 0.85, label: 'Lente' },
    { v: 1, label: 'Normale' },
    { v: 1.15, label: 'Rapide' }
  ];
</script>

<EnTete titre="Réglages" />

<section class="reglages">
  {#each interrupteurs as i}
    <button class="ligne" onclick={() => changerReglage(i.cle, !reglages[i.cle])}>
      <span>{i.emoji} {i.label}</span>
      <span class="inter" class:on={reglages[i.cle]}><span></span></span>
    </button>
  {/each}

  <div class="bloc">
    <p>Vitesse de la voix</p>
    <div class="segments">
      {#each vitesses as s}
        <button class:actif={reglages.vitesseVoix === s.v} onclick={() => changerReglage('vitesseVoix', s.v)}>{s.label}</button>
      {/each}
    </div>
    <Bouton variante="carte" taille="petit" onclick={() => dire('Bonsoir et bienvenue sur le plateau de Family Quiz !')}>▶️ Tester la voix</Bouton>
  </div>

  <div class="bloc">
    <p>Durée de l’émission par défaut</p>
    <div class="segments">
      {#each Object.values(DUREES) as d}
        <button class:actif={reglages.dureeParDefaut === d.id} onclick={() => changerReglage('dureeParDefaut', d.id)}>{d.label}</button>
      {/each}
    </div>
  </div>

  <div class="bloc">
    <Bouton variante="carte" taille="petit" onclick={() => sons.generique()}>🎺 Tester les sons</Bouton>
  </div>

  <div class="bloc danger">
    {#if etapeEffacement === 0}
      <Bouton variante="discret" onclick={() => (etapeEffacement = 1)}>🗑️ Tout effacer</Bouton>
    {:else if etapeEffacement === 1}
      <p>Effacer tous les candidats, leurs réponses et l’historique des émissions ?</p>
      <div class="segments">
        <Bouton variante="carte" onclick={() => (etapeEffacement = 0)}>Annuler</Bouton>
        <Bouton variante="danger" onclick={() => (etapeEffacement = 2)}>Oui, effacer</Bouton>
      </div>
    {:else}
      <p><strong>Vraiment sûr ?</strong> Rien ne pourra être récupéré.</p>
      <div class="segments">
        <Bouton variante="carte" onclick={() => (etapeEffacement = 0)}>Non, garder</Bouton>
        <Bouton variante="danger" onclick={toutEffacer}>Tout effacer</Bouton>
      </div>
    {/if}
  </div>
</section>

<style>
  .reglages {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    padding: var(--e-2) var(--e-4) var(--e-7);
  }
  .ligne {
    min-height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--e-4);
    border: 2px solid var(--bord);
    border-radius: var(--r-moyen);
    background: var(--carte);
    font-size: var(--t-normal);
    font-weight: 600;
  }
  .inter {
    width: 56px;
    height: 32px;
    border-radius: var(--r-rond);
    background: rgba(255, 255, 255, 0.2);
    position: relative;
    transition: background var(--d-normale);
  }
  .inter span {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #fff;
    transition: transform var(--d-normale);
  }
  .inter.on {
    background: var(--vert);
  }
  .inter.on span {
    transform: translateX(24px);
  }
  .bloc {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--e-3);
    padding: var(--e-4);
    border: 2px solid var(--bord);
    border-radius: var(--r-moyen);
    background: var(--carte);
    text-align: center;
  }
  .bloc p {
    font-weight: 600;
  }
  .segments {
    display: flex;
    gap: var(--e-2);
    flex-wrap: wrap;
    justify-content: center;
  }
  .segments > button {
    min-height: var(--cible);
    padding: 0 var(--e-4);
    border-radius: var(--r-rond);
    border: 2px solid var(--bord);
    background: transparent;
    font-size: var(--t-normal);
  }
  .segments > button.actif {
    background: var(--or);
    border-color: var(--or);
    color: var(--texte-sur-or);
    font-weight: 600;
  }
  .danger {
    border-color: rgba(255, 90, 90, 0.5);
  }
</style>
