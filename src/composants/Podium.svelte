<script>
  import { tp } from '../lib/ecran.svelte.js';
  import { onMount } from 'svelte';
  import Avatar from './Avatar.svelte';
  import Bouton from './Bouton.svelte';
  import Mascotte from './Mascotte.svelte';
  import { scoresEquipes, titresPodium } from '../lib/jeu.js';
  import { sons } from '../lib/audio.js';
  import { dire } from '../lib/appareil.js';
  import { grandesConfettis } from '../lib/confettis.js';
  import { pause } from '../lib/hasard.js';
  import { lireReglages, ecrireReglage } from '../lib/db.js';

  let { partie, parId, scores, onrejouer, onaccueil } = $props();

  const classement = $derived([...partie.joueurs].map((id) => ({ id, score: scores[id] ?? 0 })).sort((a, b) => b.score - a.score));
  const equipes = $derived(scoresEquipes(partie, scores));
  const titres = $derived(titresPodium(partie, parId));
  const marches = $derived([classement[1], classement[0], classement[2]]);

  /** Mode « Qui connaît le mieux… ? » : taux de bonnes réponses de chaque candidat sur la cible. */
  const connaissance = $derived.by(() => {
    if (!partie.cible) return [];
    return partie.joueurs
      .map((id) => {
        let ok = 0;
        let total = 0;
        for (const m of partie.manches) {
          const res = m.id === 'rafale' ? m.joueurs.filter((t) => t.actifId === id).flatMap((t) => t.resultats) : m.etapes.filter((x) => x.actifId === id && x.resultat).map((x) => x.resultat);
          for (const x of res) {
            total++;
            if (x.correct) ok++;
          }
        }
        const pct = total ? Math.round((ok / total) * 100) : 0;
        return { id, pct, verdict: pct >= 80 ? 'Expert absolu ! 🏆' : pct >= 60 ? 'Très bonne connaissance 👏' : pct >= 40 ? 'Pas mal, mais peut mieux faire 😉' : 'Il va falloir discuter un peu plus ! 😅' };
      })
      .sort((a, b) => b.pct - a.pct);
  });

  let etape = $state(0); // 0 rien, 1 troisième, 2 deuxième, 3 premier
  let fin = $state(false);
  let records = $state([]);

  /** Records personnels : meilleur score de chaque candidat, toutes émissions confondues. */
  async function majRecords() {
    const anciens = (await lireReglages()).records ?? {};
    const nouveaux = { ...anciens };
    const battus = [];
    for (const c of classement) {
      const avant = anciens[c.id];
      if (avant === undefined || c.score > avant) nouveaux[c.id] = c.score;
      if (avant !== undefined && c.score > avant) battus.push({ id: c.id, score: c.score, avant });
    }
    await ecrireReglage('records', nouveaux);
    return battus;
  }

  function annonceVainqueur() {
    if (equipes) {
      const [a, b] = equipes;
      if (a.score === b.score) return 'Égalité ! Les deux équipes gagnent !';
      return `Victoire de l'équipe ${a.score > b.score ? a.nom.replace(/^Les /, 'des ') : b.nom.replace(/^Les /, 'des ')} !`;
    }
    const premier = classement[0];
    const exaequo = classement.filter((c) => c.score === premier.score);
    if (exaequo.length > 1) return `Égalité au sommet entre ${exaequo.map((c) => parId[c.id]?.nom).join(' et ')} !`;
    return `Et le grand gagnant est… ${parId[premier.id]?.nom} !`;
  }

  onMount(async () => {
    const recordsBattus = majRecords();
    sons.roulement(1.6);
    await dire('Le moment tant attendu… le podium !');
    await pause(400);
    if (classement[2]) {
      etape = 1;
      sons.pop();
      await pause(900);
    }
    etape = 2;
    sons.pop();
    await pause(900);
    sons.roulement(1.4);
    await pause(1400);
    etape = 3;
    fin = true;
    sons.fanfare();
    sons.applaudissements(3.5);
    grandesConfettis();
    await dire(annonceVainqueur());
    records = await recordsBattus;
    if (records.length) {
      sons.serie();
      dire(records.length > 1 ? 'Et plusieurs records personnels sont battus !' : `Et nouveau record personnel pour ${parId[records[0].id]?.nom} !`);
    }
  });

  function visible(index) {
    // index dans marches : 0 = deuxième, 1 = premier, 2 = troisième
    return (index === 2 && etape >= 1) || (index === 0 && etape >= 2) || (index === 1 && etape >= 3);
  }
  const hauteurs = [130, 180, 100];
  const medailles = ['🥈', '🥇', '🥉'];
</script>

<section class="podium">
  <h1>🏆 Le podium</h1>
  <Mascotte humeur={fin ? 'fete' : 'suspense'} taille={tp(110)} bulle={fin ? annonceVainqueur() : 'Roulement de tambour…'} />

  {#if partie.cible && fin}
    <div class="connaissance">
      <p class="titre-connaissance">Qui connaît le mieux {parId[partie.cible]?.nom} {parId[partie.cible]?.emoji} ?</p>
      {#each connaissance as c, i}
        <div class="ligne-connaissance" style="--i: {i}">
          <Avatar joueur={parId[c.id]} taille={40} />
          <div class="jauge"><div class="rempli" style="width: {c.pct}%"></div><span>{c.pct} %</span></div>
          <small>{c.verdict}</small>
        </div>
      {/each}
    </div>
  {/if}

  {#if equipes && fin}
    <div class="equipes">
      {#each equipes as e}
        <div class="equipe" class:gagnante={e.score >= Math.max(...equipes.map((x) => x.score))} style="--couleur: {e.couleur}">
          <span>{e.emoji} {e.nom}</span><strong>{e.score}</strong>
        </div>
      {/each}
    </div>
  {/if}

  <div class="marches">
    {#each marches as m, i}
      {#if m}
        <div class="colonne" class:visible={visible(i)}>
          <div class="haut">
            <Avatar joueur={parId[m.id]} taille={i === 1 ? 84 : 64} saute={i === 1 && fin} nom />
            <strong class="score">{m.score} pts</strong>
          </div>
          <div class="marche" style="height: {tp(hauteurs[i])}px; --couleur: {parId[m.id]?.couleur}">
            <span>{medailles[i]}</span>
          </div>
        </div>
      {/if}
    {/each}
  </div>

  {#if fin}
    {#if classement.length > 3}
      <ol class="autres" start="4">
        {#each classement.slice(3) as c, i}
          <li><span class="rang">{i + 4}.</span> <Avatar joueur={parId[c.id]} taille={32} /> {parId[c.id]?.nom} <strong>{c.score} pts</strong></li>
        {/each}
      </ol>
    {/if}

    {#if records.length}
      <div class="records">
        {#each records as r, i}
          <div class="record" style="--i: {i}">
            <span class="emoji">🏅</span>
            <Avatar joueur={parId[r.id]} taille={36} />
            <span>Nouveau record pour {parId[r.id]?.nom} : <strong>{r.score} pts</strong> <small>(avant : {r.avant})</small></span>
          </div>
        {/each}
      </div>
    {/if}

    {#if titres.length}
      <div class="titres">
        {#each titres as t, i}
          <div class="titre" style="--i: {i}">
            <span class="emoji">{t.emoji}</span>
            <Avatar joueur={parId[t.joueurId]} taille={36} />
            <span>{t.texte}</span>
          </div>
        {/each}
      </div>
    {/if}

    <div class="actions">
      <Bouton taille="grand" large onclick={onrejouer}>🔁 Rejouer</Bouton>
      <Bouton variante="carte" large onclick={onaccueil}>🏠 Accueil</Bouton>
    </div>
  {/if}
</section>

<style>
  .podium {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--e-4);
    padding-bottom: var(--e-5);
  }
  h1 {
    font-size: var(--t-titre);
    color: var(--or);
  }
  .equipes {
    display: flex;
    gap: var(--e-3);
    width: 100%;
  }
  .equipe {
    flex: 1;
    padding: var(--e-3);
    border-radius: var(--r-moyen);
    border: 3px solid var(--couleur);
    display: flex;
    flex-direction: column;
    align-items: center;
    font-weight: 600;
    opacity: 0.6;
  }
  .equipe strong {
    font-size: var(--t-titre);
  }
  .equipe.gagnante {
    opacity: 1;
    background: color-mix(in srgb, var(--couleur) 30%, transparent);
    animation: brille 1s ease-in-out infinite alternate;
  }
  .marches {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: var(--e-2);
    width: 100%;
    min-height: clamp(220px, 36vh, 330px);
  }
  .colonne {
    flex: 1;
    max-width: 180px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--e-2);
    opacity: 0;
    transform: translateY(60px);
    transition: opacity var(--d-lente), transform var(--d-lente) cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .colonne.visible {
    opacity: 1;
    transform: none;
  }
  .haut {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--e-1);
  }
  .score {
    color: var(--or);
  }
  .marche {
    width: 100%;
    border-radius: var(--r-petit) var(--r-petit) 0 0;
    background: linear-gradient(180deg, color-mix(in srgb, var(--couleur) 80%, white), var(--couleur));
    box-shadow: inset 0 -10px 0 rgba(0, 0, 0, 0.2), var(--ombre);
    display: flex;
    justify-content: center;
    padding-top: var(--e-2);
    font-size: 40px;
  }
  .autres {
    width: 100%;
    margin: 0;
    padding: 0 var(--e-3);
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
  }
  .autres li {
    display: flex;
    align-items: center;
    gap: var(--e-2);
  }
  .autres strong {
    margin-left: auto;
  }
  .connaissance {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    padding: var(--e-3);
    border-radius: var(--r-moyen);
    border: 2px solid var(--or);
    background: var(--or-voile);
  }
  .titre-connaissance {
    text-align: center;
    font-weight: 700;
    font-size: var(--t-moyen);
  }
  .ligne-connaissance {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: var(--e-1) var(--e-3);
    animation: arrive var(--d-lente) cubic-bezier(0.34, 1.56, 0.64, 1) both;
    animation-delay: calc(var(--i) * 0.3s);
  }
  .ligne-connaissance small {
    grid-column: 2;
    color: var(--texte-doux);
  }
  .jauge {
    position: relative;
    height: 24px;
    border-radius: var(--r-rond);
    background: rgba(255, 255, 255, 0.15);
    overflow: hidden;
  }
  .rempli {
    height: 100%;
    background: linear-gradient(90deg, var(--rose), var(--or));
    animation: remplir 1.4s ease-out;
  }
  .jauge span {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-weight: 700;
    font-size: var(--t-petit);
  }
  @keyframes remplir {
    from { width: 0; }
  }
  .records {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
  }
  .record {
    display: flex;
    align-items: center;
    gap: var(--e-3);
    padding: var(--e-3);
    border-radius: var(--r-moyen);
    background: linear-gradient(90deg, var(--or-voile), transparent);
    border: 2px solid var(--or);
    font-weight: 600;
    animation: arrive var(--d-lente) cubic-bezier(0.34, 1.56, 0.64, 1) both, brille 1s ease-in-out 0.6s 3 alternate;
    animation-delay: calc(var(--i) * 0.3s);
    --couleur: var(--or);
  }
  .record .emoji {
    font-size: var(--t-emoji);
  }
  .record small {
    color: var(--texte-doux);
    font-weight: 400;
  }
  .titres {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
  }
  .titre {
    display: flex;
    align-items: center;
    gap: var(--e-3);
    padding: var(--e-3);
    border-radius: var(--r-moyen);
    background: var(--carte-forte);
    font-weight: 600;
    animation: arrive var(--d-lente) cubic-bezier(0.34, 1.56, 0.64, 1) both;
    animation-delay: calc(0.5s + var(--i) * 0.3s);
  }
  .titre .emoji {
    font-size: 28px;
  }
  .actions {
    width: 100%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    margin-top: var(--e-3);
  }
  @keyframes arrive {
    from { opacity: 0; transform: translateX(-40px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes brille {
    from { box-shadow: 0 0 10px var(--couleur); }
    to { box-shadow: 0 0 36px var(--couleur); }
  }
</style>
