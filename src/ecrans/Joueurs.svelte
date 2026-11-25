<script>
  import EnTete from '../composants/EnTete.svelte';
  import Avatar from '../composants/Avatar.svelte';
  import Bouton from '../composants/Bouton.svelte';
  import { aller } from '../lib/etat.svelte.js';
  import { listerJoueurs, listerReponses } from '../lib/db.js';
  import { age, roleParId } from '../lib/joueurs.js';

  let joueurs = $state([]);
  let nbReponses = $state({});

  Promise.all([listerJoueurs(), listerReponses()]).then(([j, r]) => {
    joueurs = j;
    const n = {};
    for (const x of r) if (!x.passee) n[x.joueurId] = (n[x.joueurId] ?? 0) + 1;
    nbReponses = n;
  });
</script>

<EnTete titre="Les candidats" />

<section class="liste">
  {#each joueurs as j, i (j.id)}
    <button class="fiche" style="--i: {i}; --couleur: {j.couleur}" onclick={() => aller('fiche', { id: j.id })}>
      <Avatar joueur={j} taille={64} />
      <div class="infos">
        <strong>{j.nom}</strong>
        <span>{roleParId[j.role]?.emoji} {roleParId[j.role]?.label} · {age(j)} ans</span>
        <span class="reponses">{nbReponses[j.id] ?? 0} réponses au questionnaire</span>
      </div>
      <span class="fleche">›</span>
    </button>
  {:else}
    <p class="vide">Aucun candidat pour l’instant.<br />Inscris toute la famille !</p>
  {/each}

  <div class="ajouter">
    <Bouton taille="grand" large onclick={() => aller('fiche', {})}>➕ Ajouter un candidat</Bouton>
  </div>
</section>

<style>
  .liste {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    padding: var(--e-2) var(--e-4) var(--e-7);
  }
  .fiche {
    display: flex;
    align-items: center;
    gap: var(--e-4);
    padding: var(--e-3) var(--e-4);
    border: 2px solid var(--bord);
    border-left: 8px solid var(--couleur);
    border-radius: var(--r-moyen);
    background: var(--carte);
    text-align: left;
    animation: glisse var(--d-normale) ease-out both;
    animation-delay: calc(var(--i) * 60ms);
  }
  .fiche:active {
    transform: scale(0.98);
  }
  .infos {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  strong {
    font-size: var(--t-moyen);
  }
  .infos span {
    color: var(--texte-doux);
    font-size: var(--t-petit);
  }
  .reponses {
    color: var(--texte-faible) !important;
  }
  .fleche {
    font-size: var(--t-titre);
    color: var(--texte-faible);
  }
  .vide {
    text-align: center;
    color: var(--texte-doux);
    padding: var(--e-6) 0;
    line-height: 1.5;
  }
  .ajouter {
    margin-top: var(--e-4);
  }
  @keyframes glisse {
    from { transform: translateX(-30px); opacity: 0; }
    to { transform: none; opacity: 1; }
  }
</style>
