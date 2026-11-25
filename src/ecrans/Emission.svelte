<script>
  import { onDestroy } from 'svelte';
  import Mascotte from '../composants/Mascotte.svelte';
  import Bouton from '../composants/Bouton.svelte';
  import Avatar from '../composants/Avatar.svelte';
  import Chrono from '../composants/Chrono.svelte';
  import GrilleChoix from '../composants/GrilleChoix.svelte';
  import Relais from '../composants/Relais.svelte';
  import Annonce from '../composants/Annonce.svelte';
  import BandeauScores from '../composants/BandeauScores.svelte';
  import Rafale from '../composants/Rafale.svelte';
  import ScoresManche from '../composants/ScoresManche.svelte';
  import Podium from '../composants/Podium.svelte';
  import { aller, accueil, intercepterRetour } from '../lib/etat.svelte.js';
  import { db, listerJoueurs, enregistrerPartie, terminerPartie, ajouterHistorique } from '../lib/db.js';
  import { MANCHES, calculerScores, pointsEtape, secondesPourRepondre, equipeDe, entreesHistorique, POINTS } from '../lib/jeu.js';
  import { categorieParId } from '../lib/banque.js';
  import { sons, arreterMusique } from '../lib/audio.js';
  import { dire, taire, vibrer, souhaiterEcranAllume } from '../lib/appareil.js';
  import { petitesConfettis } from '../lib/confettis.js';
  import { auHasard, pause } from '../lib/hasard.js';
  import { accord, typo } from '../lib/grammaire.js';

  let { partieId } = $props();

  let partie = $state(null);
  let tous = $state([]);
  let phase = $state('chargement');
  let enPause = $state(false);

  // État de la question en cours
  let choisi = $state(null);
  let bonne = $state(null);
  let humeur = $state('content');
  let bulle = $state('');
  let gain = $state(0);
  let tempsEcoule = $state(false);
  let revele = $state(false);

  const parId = $derived(Object.fromEntries(tous.map((j) => [j.id, j])));
  const manche = $derived(partie?.manches[partie.pos.m]);
  const infoManche = $derived(manche ? MANCHES[manche.id] : null);
  const etape = $derived(manche?.etapes?.[partie.pos.e]);
  const tourRafale = $derived(manche?.joueurs?.[partie.pos.e]);
  const actif = $derived(parId[etape?.actifId ?? tourRafale?.actifId]);
  const sujet = $derived(etape ? parId[etape.sujetId] : null);
  const scores = $derived(partie ? calculerScores(partie) : {});
  const derniereManche = $derived(partie ? partie.pos.m >= partie.manches.length - 1 : false);

  const PHRASES_BONNE = ['Bravo !', 'Bien joué !', 'Exactement !', 'Quelle mémoire !', 'Dans le mille !', 'Impressionnant !', 'Tu connais ta famille !'];
  const PHRASES_MAUVAISE = ['Oh non, raté !', 'Presque !', 'Eh non !', 'Ah, surprise !', 'Pas cette fois !', 'Aïe aïe aïe !'];

  const arreterRetour = intercepterRetour(() => (enPause = !enPause));
  onDestroy(() => {
    arreterRetour();
    taire();
    arreterMusique();
    souhaiterEcranAllume(false);
  });

  Promise.all([db.parties.get(partieId), listerJoueurs()]).then(([p, j]) => {
    if (!p) return accueil();
    tous = j;
    partie = p;
    souhaiterEcranAllume(true);
    // Reprise : on revient au début de l'étape interrompue.
    const stables = ['generique', 'candidats', 'titre', 'scores', 'podium'];
    if (stables.includes(p.phase)) allerA(p.phase, false);
    else if (manche.id === 'rafale') {
      // Un tour de rafale déjà joué passe au suivant ; sinon on le rejoue.
      if (tourRafale?.resultats.length) suiteRafale();
      else allerA('rafale-annonce', false);
    } else if (etape?.resultat) suivant();
    else allerA('annonce', false);
  });

  function sauver() {
    return enregistrerPartie(partie);
  }

  function allerA(p, sauvegarder = true) {
    taire();
    phase = p;
    partie.phase = p;
    if (sauvegarder) sauver();
    entrer(p);
  }

  function entrer(p) {
    if (p === 'generique') {
      humeur = 'fete';
      bulle = 'Bonsoir et bienvenue sur le plateau de Family Quiz !';
      sons.generique();
      pause(1200).then(() => dire(bulle));
    } else if (p === 'candidats') {
      humeur = 'parle';
      bulle = 'Ce soir, nos candidats sont…';
      sons.applaudissements(2);
      const noms = partie.joueurs.map((id) => parId[id]?.nom).join(', ');
      dire(`Ce soir, nos candidats sont : ${noms} !`);
    } else if (p === 'titre') {
      humeur = 'parle';
      bulle = infoManche.regle;
      sons.jingle();
      pause(900).then(() => dire(`Manche ${infoManche.numero} : ${infoManche.titre}. ${infoManche.regle}`));
    } else if (p === 'question') {
      choisi = null;
      bonne = null;
      gain = 0;
      tempsEcoule = false;
      revele = false;
      humeur = 'parle';
      bulle = '';
      const lecture = manche.id === 'vraifaux' ? `${etape.texte} Vrai ou faux ?` : etape.texte;
      dire(lecture);
    }
  }

  // ---------- Déroulé ----------

  function commencerManche() {
    partie.pos.e = 0;
    allerA(manche.id === 'rafale' ? 'rafale-annonce' : 'annonce');
  }

  function candidatsRoulette() {
    if (manche.id === 'qui' || !etape) return [];
    const equipe = equipeDe(partie, etape.actifId);
    return partie.joueurs.filter((id) => id !== etape.actifId && !equipe?.joueurs.includes(id)).map((id) => parId[id]);
  }

  function repondre(option) {
    if (choisi || phase !== 'question') return;
    choisi = option.id;
    reveler(option.id === etape.bonne);
  }

  function tempsFini() {
    if (phase !== 'question' || choisi) return;
    tempsEcoule = true;
    reveler(false);
  }

  function aiRepondu() {
    taire();
    allerA('validation', false);
  }

  async function reveler(correct) {
    taire();
    phase = 'revelation';
    humeur = 'suspense';
    bulle = '…';
    if (etape.forme !== 'oral' && !tempsEcoule) {
      sons.suspense();
      await pause(1300);
    }
    bonne = etape.bonne;
    revele = true;
    etape.resultat = { correct, choisi };
    partie.phase = "revelation";
    gain = correct ? pointsEtape(manche.id, etape) : 0;
    sauver();
    if (correct) {
      humeur = 'fete';
      bulle = auHasard(PHRASES_BONNE);
      sons.bonne();
      setTimeout(() => sons.points(), 400);
      vibrer(80);
      petitesConfettis();
    } else {
      humeur = 'decu';
      bulle = tempsEcoule ? 'Le temps est écoulé !' : auHasard(PHRASES_MAUVAISE);
      sons.mauvaise();
      vibrer([60, 60, 60]);
    }
    dire(bulle + (etape.revelation ? ` En vrai : ${etape.revelation}` : ''));
  }

  function suivant() {
    if (partie.pos.e < manche.etapes.length - 1) {
      partie.pos.e++;
      allerA('annonce');
    } else {
      allerA('scores');
    }
  }

  function apresScores() {
    if (derniereManche) return allerA('podium');
    partie.pos.m++;
    partie.pos.e = 0;
    allerA('titre');
  }

  async function finRafale(resultats) {
    tourRafale.resultats = resultats;
    await sauver();
    phase = 'rafale-bilan';
    const n = resultats.filter((r) => r.correct).length;
    humeur = n >= 5 ? 'fete' : n > 0 ? 'content' : 'decu';
    bulle = n ? `${n} bonne${n > 1 ? 's' : ''} réponse${n > 1 ? 's' : ''} pour ${actif.nom} !` : 'Aucune bonne réponse… dur dur !';
    sons.applaudissements(n ? 2 : 0.6);
    dire(bulle);
  }

  function suiteRafale() {
    if (partie.pos.e < manche.joueurs.length - 1) {
      partie.pos.e++;
      allerA('rafale-annonce');
    } else {
      allerA('scores');
    }
  }

  let historiqueEnregistre = false;
  $effect(() => {
    if (phase === 'podium' && partie && !historiqueEnregistre) {
      historiqueEnregistre = true;
      ajouterHistorique(entreesHistorique(partie)).then(() => terminerPartie(partie.id));
    }
  });

  function quitter() {
    sauver();
    accueil();
  }

  const libelleGain = $derived(gain ? `+${gain}` : '');
</script>

{#if partie && phase !== 'chargement'}
  <section class="emission">
    {#if !['generique', 'candidats', 'podium'].includes(phase)}
      <header class="barre">
        <BandeauScores {partie} {parId} {scores} actifId={actif?.id} />
        <button class="pause" aria-label="Pause" onclick={() => (enPause = true)}>⏸</button>
      </header>
    {/if}

    {#if phase === 'generique'}
      <div class="centre generique">
        <div class="etoiles">✨</div>
        <h1 class="logo">Family<br /><span>Quiz</span></h1>
        <Mascotte {humeur} {bulle} taille={170} />
        <Bouton taille="grand" onclick={() => allerA('candidats')}>Présenter les candidats 🎤</Bouton>
      </div>
    {:else if phase === 'candidats'}
      <div class="centre">
        <Mascotte {humeur} {bulle} taille={120} />
        {#if partie.equipes}
          <div class="equipes">
            {#each partie.equipes as e, i}
              <div class="equipe" style="--couleur: {e.couleur}; --i: {i}">
                <strong>{e.emoji} {e.nom}</strong>
                <div class="membres">
                  {#each e.joueurs as id, k}
                    <div class="entre" style="--k: {i * 3 + k}"><Avatar joueur={parId[id]} taille={72} nom /></div>
                  {/each}
                </div>
              </div>
              {#if i === 0}<span class="vs">VS</span>{/if}
            {/each}
          </div>
        {:else}
          <div class="candidats">
            {#each partie.joueurs as id, k}
              <div class="entre" style="--k: {k}"><Avatar joueur={parId[id]} taille={92} nom saute /></div>
            {/each}
          </div>
        {/if}
        <Bouton taille="grand" onclick={() => allerA('titre')}>Que le jeu commence ! 🎬</Bouton>
      </div>
    {:else if phase === 'titre'}
      <div class="centre">
        <div class="numero">Manche {infoManche.numero}</div>
        <div class="titre-manche">
          <span class="emoji">{infoManche.emoji}</span>
          <h1>{infoManche.titre}</h1>
        </div>
        <Mascotte {humeur} {bulle} taille={130} />
        <Bouton taille="grand" onclick={commencerManche}>On y va ! ▶️</Bouton>
      </div>
    {:else if phase === 'annonce' && actif}
      {#key partie.pos.m + '-' + partie.pos.e}
        <Annonce
          {actif}
          sujet={manche.id === 'qui' ? null : sujet}
          candidats={candidatsRoulette()}
          onpret={() => allerA('question', false)}
        />
      {/key}
    {:else if (phase === 'question' || phase === 'revelation') && etape}
      <div class="question">
        <div class="infos">
          <div class="qui-joue">
            <Avatar joueur={actif} taille={40} />
            <span>{actif.nom}</span>
            {#if manche.id !== 'qui' && sujet}
              <span class="fleche">→</span>
              <Avatar joueur={sujet} taille={40} />
              <span>{sujet.nom}</span>
            {/if}
          </div>
          {#if phase === 'question' && etape.forme !== 'oral'}
            <Chrono secondes={secondesPourRepondre(actif)} enMarche={!enPause} onfin={tempsFini} taille={72} />
          {:else if phase === 'question'}
            <Chrono secondes={secondesPourRepondre(actif) + 10} enMarche={!enPause} onfin={aiRepondu} taille={72} />
          {/if}
        </div>

        <div class="categorie">{categorieParId[etape.categorie]?.emoji} {infoManche.titre}</div>
        <h1 class="texte" class:long={etape.texte.length > 80}>{typo(etape.texte)}</h1>
        {#if manche.id === 'vraifaux'}<p class="sous">Vrai ou faux ?</p>{/if}
        {#if manche.id === 'qui' && etape.rappel}<p class="sous">Question posée : « {etape.rappel} »</p>{/if}

        {#if etape.forme === 'oral'}
          {#if phase === 'question'}
            <div class="oral">
              <p>🗣️ Réponds à voix haute !</p>
              <p class="aide">{sujet.nom} validera ta réponse.</p>
              <Bouton taille="grand" onclick={aiRepondu}>J’ai répondu ✋</Bouton>
            </div>
          {/if}
        {:else}
          <GrilleChoix
            options={etape.options}
            avatars={etape.forme === 'avatars'}
            colonnes={etape.options.length > 4 ? 3 : 2}
            {choisi}
            {bonne}
            verrouille={phase !== 'question'}
            onchoix={repondre}
          />
        {/if}

        {#if phase === 'revelation'}
          <div class="reaction">
            <Mascotte {humeur} {bulle} taille={100} />
            {#if libelleGain}
              {#key libelleGain}<div class="gain">{libelleGain}</div>{/key}
            {/if}
            {#if etape.revelation && revele}
              <p class="vraie-reponse">En vrai : {etape.revelation}</p>
            {/if}
            {#if etape.forme === 'oral' && revele}
              <p class="vraie-reponse">Réponse de {sujet.nom} : « {etape.reponseOrigine} »</p>
            {/if}
            {#if revele}
              <Bouton taille="grand" onclick={suivant}>Suivant ➡️</Bouton>
            {/if}
          </div>
        {/if}
      </div>
    {:else if phase === 'validation'}
      <Relais
        joueur={sujet}
        titre="Tends la tablette à"
        emoji="👉"
        consigne={`${actif.nom} a répondu à voix haute. ${sujet.nom}, c’est toi qui juges !`}
        bouton="Je juge ⚖️"
        onpret={() => allerA('jugement', false)}
      />
    {:else if phase === 'jugement'}
      <div class="centre jugement">
        <p class="sous">{etape.texte}</p>
        <p>Ta réponse au questionnaire :</p>
        <div class="origine">« {etape.reponseOrigine} »</div>
        <p>{actif.nom} a-t-{accord(actif, 'il', 'elle')} trouvé ?</p>
        <div class="verdict">
          <button class="oui" onclick={() => reveler(true)}>✔<span>Bonne réponse</span></button>
          <button class="non" onclick={() => reveler(false)}>✘<span>Raté</span></button>
        </div>
      </div>
    {:else if phase === 'rafale-annonce' && actif}
      {#key partie.pos.e}
        <Relais
          joueur={actif}
          titre="Rafale ! Au tour de"
          emoji="⚡"
          consigne={`${tourRafale.secondes} secondes pour enchaîner un maximum de bonnes réponses. Points doublés !`}
          bouton={accord(actif, 'Je suis prêt !', 'Je suis prête !')}
          onpret={() => allerA('rafale', false)}
        />
      {/key}
    {:else if phase === 'rafale'}
      {#key partie.pos.e}
        <Rafale tour={tourRafale} {parId} {enPause} onfin={finRafale} />
      {/key}
    {:else if phase === 'rafale-bilan'}
      <div class="centre">
        <Avatar joueur={actif} taille={100} nom saute />
        <Mascotte {humeur} {bulle} taille={130} />
        <div class="gain fixe">+{tourRafale.resultats.reduce((s, r) => s + r.points, 0)} pts</div>
        <Bouton taille="grand" onclick={suiteRafale}>{partie.pos.e < manche.joueurs.length - 1 ? 'Candidat suivant ➡️' : 'Voir les scores 📊'}</Bouton>
      </div>
    {:else if phase === 'scores'}
      <ScoresManche
        {partie}
        {parId}
        {scores}
        titre={`Fin de la manche ${infoManche.numero}`}
        bouton={derniereManche ? 'Le podium ! 🏆' : 'Manche suivante ▶️'}
        onsuite={apresScores}
      />
    {:else if phase === 'podium'}
      <Podium {partie} {parId} {scores} onrejouer={() => aller('nouvelle', {}, { remplacer: true })} onaccueil={accueil} />
    {/if}

    {#if enPause}
      <div class="voile">
        <div class="panneau">
          <h2>⏸ Pause</h2>
          <Bouton taille="grand" large onclick={() => (enPause = false)}>▶️ Reprendre</Bouton>
          <Bouton variante="carte" large onclick={quitter}>🚪 Quitter l’émission</Bouton>
          <p class="aide">L’émission est sauvegardée : tu pourras la reprendre depuis l’accueil.</p>
        </div>
      </div>
    {/if}
  </section>
{/if}

<style>
  .emission {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: var(--e-5) var(--e-4) var(--e-5);
    gap: var(--e-3);
  }
  .barre {
    display: flex;
    align-items: center;
    gap: var(--e-2);
  }
  .barre :global(.bandeau) {
    flex: 1;
  }
  .pause {
    width: var(--cible);
    height: var(--cible);
    flex-shrink: 0;
    border-radius: 50%;
    border: 2px solid var(--bord);
    background: var(--carte);
    font-size: 20px;
  }
  .centre {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--e-5);
    text-align: center;
  }
  .logo {
    font-size: 72px;
    line-height: 0.9;
    color: var(--or);
    text-shadow: 0 6px 0 var(--or-fonce), 0 0 50px rgba(255, 200, 61, 0.5);
    animation: logo 1s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .logo span {
    color: var(--rose);
    text-shadow: 0 6px 0 var(--rose-fonce), 0 0 50px rgba(255, 79, 163, 0.5);
  }
  .etoiles {
    font-size: 48px;
    animation: tourne 3s linear infinite;
  }
  .candidats {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--e-5);
  }
  .entre {
    animation: entre 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    animation-delay: calc(0.4s + var(--k) * 0.45s);
  }
  .equipes {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--e-3);
    width: 100%;
  }
  .equipe {
    width: 100%;
    padding: var(--e-3);
    border-radius: var(--r-grand);
    border: 3px solid var(--couleur);
    background: color-mix(in srgb, var(--couleur) 20%, transparent);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--e-2);
  }
  .membres {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--e-4);
  }
  .vs {
    font-size: var(--t-titre);
    font-weight: 700;
    color: var(--or);
    animation: pulse 0.8s ease-in-out infinite alternate;
  }
  .numero {
    padding: var(--e-1) var(--e-5);
    border-radius: var(--r-rond);
    background: var(--rose);
    font-weight: 700;
    font-size: var(--t-moyen);
    animation: entre 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .titre-manche {
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: logo 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
  }
  .titre-manche .emoji {
    font-size: 80px;
  }
  .titre-manche h1 {
    font-size: var(--t-geant);
    line-height: 1;
    color: var(--or);
    text-shadow: 0 5px 0 var(--or-fonce);
  }
  .question {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
  }
  .infos {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--e-2);
  }
  .qui-joue {
    display: flex;
    align-items: center;
    gap: var(--e-2);
    font-weight: 600;
    flex-wrap: wrap;
  }
  .fleche {
    color: var(--or);
    font-size: var(--t-grand);
  }
  .categorie {
    align-self: center;
    padding: var(--e-1) var(--e-4);
    border-radius: var(--r-rond);
    background: var(--carte-forte);
    font-size: var(--t-petit);
    font-weight: 600;
  }
  .texte {
    text-align: center;
    font-size: var(--t-titre);
    line-height: 1.15;
    animation: entre 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .texte.long {
    font-size: var(--t-grand);
  }
  .sous {
    text-align: center;
    color: var(--texte-doux);
    font-size: var(--t-moyen);
  }
  .oral {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--e-3);
    padding: var(--e-5);
    border-radius: var(--r-grand);
    background: var(--carte);
    font-size: var(--t-grand);
    text-align: center;
  }
  .aide {
    font-size: var(--t-petit);
    color: var(--texte-doux);
  }
  .reaction {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--e-3);
    margin-top: var(--e-2);
    position: relative;
  }
  .gain {
    position: absolute;
    top: 0;
    right: 10%;
    font-size: var(--t-geant);
    font-weight: 700;
    color: var(--vert);
    text-shadow: 0 4px 0 rgba(0, 0, 0, 0.35);
    animation: gain 1.6s ease-out forwards;
    pointer-events: none;
  }
  .gain.fixe {
    position: static;
    animation: entre 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .vraie-reponse {
    padding: var(--e-2) var(--e-4);
    border-radius: var(--r-moyen);
    background: rgba(61, 220, 132, 0.2);
    border: 2px solid var(--vert);
    font-weight: 600;
    text-align: center;
  }
  .jugement .origine {
    padding: var(--e-4) var(--e-5);
    border-radius: var(--r-moyen);
    background: #fff;
    color: var(--texte-sur-or);
    font-size: var(--t-grand);
    font-weight: 700;
  }
  .verdict {
    display: flex;
    gap: var(--e-4);
    width: 100%;
  }
  .verdict button {
    flex: 1;
    min-height: 140px;
    border: none;
    border-radius: var(--r-grand);
    font-size: 64px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--e-1);
    box-shadow: var(--ombre);
  }
  .verdict span {
    font-size: var(--t-normal);
    font-weight: 600;
  }
  .verdict .oui {
    background: var(--vert);
  }
  .verdict .non {
    background: var(--rouge);
  }
  .verdict button:active {
    transform: scale(0.95);
  }
  .voile {
    position: fixed;
    inset: 0;
    z-index: 10;
    background: rgba(10, 4, 30, 0.8);
    backdrop-filter: blur(6px);
    display: grid;
    place-items: center;
    padding: var(--e-5);
    animation: fondu var(--d-normale);
  }
  .panneau {
    width: 100%;
    max-width: 420px;
    padding: var(--e-6) var(--e-5);
    border-radius: var(--r-grand);
    background: var(--fond-2);
    border: 2px solid var(--bord);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--e-4);
    text-align: center;
  }
  .panneau h2 {
    font-size: var(--t-titre);
  }
  @keyframes logo {
    from { transform: scale(0) rotate(-12deg); opacity: 0; }
    to { transform: none; opacity: 1; }
  }
  @keyframes entre {
    from { transform: translateY(40px) scale(0.6); opacity: 0; }
    to { transform: none; opacity: 1; }
  }
  @keyframes tourne {
    from { transform: rotate(0); }
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    from { transform: scale(1); }
    to { transform: scale(1.2); }
  }
  @keyframes gain {
    0% { transform: translateY(0) scale(0.5); opacity: 0; }
    20% { transform: translateY(-20px) scale(1.2); opacity: 1; }
    100% { transform: translateY(-140px) scale(1); opacity: 0; }
  }
  @keyframes fondu {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
