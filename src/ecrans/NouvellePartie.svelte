<script>
  import { tp } from '../lib/ecran.svelte.js';
  import EnTete from '../composants/EnTete.svelte';
  import Avatar from '../composants/Avatar.svelte';
  import Bouton from '../composants/Bouton.svelte';
  import { aller, reglages } from '../lib/etat.svelte.js';
  import { listerJoueurs, listerReponses } from '../lib/db.js';
  import { MODES, DUREES, formerEquipes, modeImpossible, MIN_REPONSES_CIBLE, QUESTIONS_CONNAITRE } from '../lib/jeu.js';
  import { creerPartie } from '../lib/partie.js';
  import { pleinEcran, souhaiterEcranAllume } from '../lib/appareil.js';
  import { sons } from '../lib/audio.js';

  let joueurs = $state([]);
  let presents = $state(new Set());
  let mode = $state('individuel');
  let duree = $state(reglages.dureeParDefaut);
  let cibleId = $state(null);
  let nbReponses = $state({});
  let erreurLancement = $state('');
  const connaitre = $derived(mode === 'connaitre');

  listerJoueurs().then((tous) => {
    // Les candidats archivés ne jouent pas.
    const j = tous.filter((x) => !x.archive);
    joueurs = j;
    presents = new Set(j.map((x) => x.id));
  });
  listerReponses().then((r) => {
    const n = {};
    for (const x of r) if (!x.passee) n[x.joueurId] = (n[x.joueurId] ?? 0) + 1;
    nbReponses = n;
  });

  // En mode « Qui connaît le mieux… ? », la cible ne joue pas : les autres répondent sur elle.
  const selection = $derived(joueurs.filter((j) => presents.has(j.id) && !(connaitre && j.id === cibleId)));
  const equipes = $derived(connaitre ? null : formerEquipes(mode, selection));
  const impossible = $derived(
    connaitre
      ? !cibleId
        ? 'Choisis la personne à deviner.'
        : !selection.length
          ? 'Il faut au moins un autre candidat pour jouer.'
          : null
      : modeImpossible(mode, selection)
  );
  const parId = $derived(Object.fromEntries(joueurs.map((j) => [j.id, j])));

  function basculer(id) {
    const s = new Set(presents);
    s.has(id) ? s.delete(id) : s.add(id);
    presents = s;
    sons.pop();
  }

  async function lancer() {
    pleinEcran();
    souhaiterEcranAllume(true);
    sons.jingle();
    if (!connaitre) return aller('questionnaire', { joueurs: selection.map((j) => j.id), mode, duree });
    // Pas de questionnaire : on utilise les réponses déjà en mémoire de la cible.
    const partieId = await creerPartie({ presents: selection, mode, duree, cible: parId[cibleId] });
    if (!partieId) return (erreurLancement = `Pas assez de réponses pour ${parId[cibleId].nom}. Ajoute-lui des questions depuis sa fiche.`);
    aller('emission', { partieId });
  }
</script>

<EnTete titre="Nouvelle émission" />

<section class="nouvelle">
  <div class="bloc">
    <h2>Qui joue ce soir ?</h2>
    <div class="presents">
      {#each joueurs as j (j.id)}
        <button class="present" class:absent={!presents.has(j.id)} onclick={() => basculer(j.id)}>
          <Avatar joueur={j} taille={tp(64)} nom eteint={!presents.has(j.id)} />
          <span class="coche">{presents.has(j.id) ? '✅' : '➕'}</span>
        </button>
      {/each}
    </div>
  </div>

  <div class="bloc">
    <h2>Mode de jeu</h2>
    <div class="modes">
      {#each MODES as m}
        <button class="mode" class:actif={mode === m.id} onclick={() => ((mode = m.id), sons.pop())}>
          <span class="emoji">{m.emoji}</span>
          <span>{m.label}</span>
        </button>
      {/each}
    </div>

    {#if equipes && !impossible}
      <div class="equipes">
        {#each equipes as e, i}
          <div class="equipe" style="--couleur: {e.couleur}">
            <strong>{e.emoji} {e.nom}</strong>
            <div class="membres">
              {#each e.joueurs as id}<Avatar joueur={parId[id]} taille={40} />{/each}
            </div>
          </div>
          {#if i === 0}<span class="vs">VS</span>{/if}
        {/each}
      </div>
    {/if}
    {#if connaitre}
      <div class="cible">
        <p>Sur qui porte le jeu ? Les autres candidats répondront à {QUESTIONS_CONNAITRE[duree].quiz + QUESTIONS_CONNAITRE[duree].vraifaux} questions sur cette personne.</p>
        <div class="presents">
          {#each joueurs as j (j.id)}
            {@const assez = (nbReponses[j.id] ?? 0) >= MIN_REPONSES_CIBLE}
            <button class="present" disabled={!assez} onclick={() => ((cibleId = j.id), (erreurLancement = ''), sons.pop())}>
              <Avatar joueur={j} taille={tp(56)} nom eteint={!assez} saute={cibleId === j.id} />
              <span class="coche">{cibleId === j.id ? '🎯' : ''}</span>
              <small>{assez ? `${nbReponses[j.id]} réponses` : `${nbReponses[j.id] ?? 0}/${MIN_REPONSES_CIBLE} réponses`}</small>
            </button>
          {/each}
        </div>
      </div>
    {/if}
    {#if impossible}<p class="erreur">{impossible}</p>{/if}
    {#if erreurLancement}<p class="erreur">{erreurLancement}</p>{/if}
  </div>

  <div class="bloc">
    <h2>Durée</h2>
    <div class="durees">
      {#each Object.values(DUREES) as d}
        <button class="duree" class:actif={duree === d.id} onclick={() => ((duree = d.id), sons.pop())}>
          <strong>{d.label}</strong><small>{d.temps}</small>
        </button>
      {/each}
    </div>
  </div>

  <Bouton taille="grand" large desactive={!!impossible} onclick={lancer}>🎬 C’est parti !</Bouton>
</section>

<style>
  .nouvelle {
    display: flex;
    flex-direction: column;
    gap: var(--e-5);
    padding: var(--e-2) var(--e-4) var(--e-7);
  }
  .bloc {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
  }
  h2 {
    font-size: var(--t-moyen);
    color: var(--or);
  }
  .presents {
    display: flex;
    flex-wrap: wrap;
    gap: var(--e-3);
    justify-content: center;
  }
  .present {
    position: relative;
    padding: var(--e-2);
    border: none;
    background: none;
  }
  .coche {
    position: absolute;
    top: 0;
    right: 0;
    font-size: 20px;
  }
  .modes {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--e-2);
  }
  .cible {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    padding: var(--e-3);
    border-radius: var(--r-moyen);
    border: 2px solid var(--or);
    background: var(--or-voile);
    animation: apparait var(--d-normale) ease-out;
  }
  .cible > p {
    text-align: center;
    font-weight: 600;
  }
  .present small {
    display: block;
    color: var(--texte-doux);
    font-size: var(--t-petit);
  }
  .present:disabled {
    cursor: default;
  }
  .durees {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--e-2);
  }
  .mode,
  .duree {
    min-height: 92px;
    padding: var(--e-2);
    border: 2px solid var(--bord);
    border-radius: var(--r-moyen);
    background: var(--carte);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--e-1);
    font-size: var(--t-petit);
    font-weight: 600;
    transition: transform var(--d-rapide);
  }
  .mode .emoji {
    font-size: 24px;
  }
  .duree strong {
    font-size: var(--t-normal);
  }
  .duree small {
    color: var(--texte-doux);
    font-weight: 400;
  }
  .actif {
    border-color: var(--or);
    background: var(--or-voile);
    transform: scale(1.04);
  }
  .equipes {
    display: flex;
    align-items: center;
    gap: var(--e-2);
    animation: apparait var(--d-normale) ease-out;
  }
  .equipe {
    flex: 1;
    padding: var(--e-3);
    border-radius: var(--r-moyen);
    border: 2px solid var(--couleur);
    background: color-mix(in srgb, var(--couleur) 18%, transparent);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--e-2);
  }
  .membres {
    display: flex;
    flex-wrap: wrap;
    gap: var(--e-2);
    justify-content: center;
  }
  .vs {
    font-size: var(--t-grand);
    font-weight: 700;
    color: var(--or);
  }
  .erreur {
    color: var(--rouge);
    font-weight: 600;
    text-align: center;
  }
  @keyframes apparait {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: none; }
  }
</style>
