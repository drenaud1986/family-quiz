<script>
  import { tp } from '../lib/ecran.svelte.js';
  import Relais from '../composants/Relais.svelte';
  import Avatar from '../composants/Avatar.svelte';
  import Bouton from '../composants/Bouton.svelte';
  import Mascotte from '../composants/Mascotte.svelte';
  import GrilleChoix from '../composants/GrilleChoix.svelte';
  import PhraseTrou from '../composants/PhraseTrou.svelte';
  import { aller, accueil, retour, intercepterRetour } from '../lib/etat.svelte.js';
  import { listerJoueurs, listerReponses, enregistrerReponse } from '../lib/db.js';
  import { preparerQuestionnaire, estPremiereFois } from '../lib/selection.js';
  import { categorieParId, choixParId, questionParId } from '../lib/banque.js';
  import { remplir, majuscule, typo } from '../lib/grammaire.js';
  import { tranche } from '../lib/joueurs.js';
  import { creerPartie } from '../lib/partie.js';
  import { dire, taire } from '../lib/appareil.js';
  import { sons } from '../lib/audio.js';
  import { onDestroy } from 'svelte';

  // seul : questionnaire lancé depuis la fiche d'un candidat (pas d'émission ensuite).
  // questions : liste imposée d'identifiants (modification de réponses).
  let { joueurs: idsPresents, mode, duree, supplement = false, seul = false, questions: idsQuestions = null, manches = null, rigolo = false } = $props();

  let tous = $state([]);
  let ordre = $state([]);
  let indexJoueur = $state(0);
  let phase = $state('chargement'); // relais | accueil | question | merci | lancement | manque
  let liste = $state([]);
  let indexQuestion = $state(0);
  let saisieLibre = $state('');
  let modeAutre = $state(false);
  let confirmationMiseAJour = $state(true);
  let premiereFois = $state(false);

  const joueur = $derived(ordre[indexJoueur]);
  const item = $derived(liste[indexQuestion]);
  const q = $derived(item?.question);
  const petit = $derived(joueur ? tranche(joueur) === '6-8' : false);

  const arreter = intercepterRetour(() => {
    taire();
    seul ? retour() : accueil();
  });
  onDestroy(() => {
    arreter();
    taire();
  });

  listerJoueurs().then((j) => {
    tous = j.filter((x) => !x.archive || idsPresents.includes(x.id));
    ordre = idsPresents.map((id) => j.find((x) => x.id === id)).filter(Boolean);
    phase = 'relais';
  });

  async function commencerJoueur() {
    const reponses = await listerReponses();
    premiereFois = estPremiereFois(joueur, reponses);
    liste = idsQuestions
      ? idsQuestions.map((id) => ({ question: questionParId[id] })).filter((x) => x.question)
      : preparerQuestionnaire(joueur, tous, reponses, seul ? 10 : supplement ? 5 : null, rigolo);
    indexQuestion = 0;
    if (!liste.length) {
      phase = 'merci';
      return;
    }
    phase = 'accueil';
    dire(texteAccueil());
  }

  function texteAccueil() {
    if (idsQuestions) return `${joueur.nom}, on modifie ta réponse ? Personne ne regarde !`;
    return premiereFois
      ? `Bienvenue ${joueur.nom} ! Réponds sincèrement à ces ${liste.length} questions. Personne ne regarde !`
      : `Re-bonjour ${joueur.nom} ! Voici ${liste.length} nouvelles questions rien que pour toi.`;
  }

  function demarrerQuestions() {
    phase = 'question';
    preparerQuestion();
  }

  function preparerQuestion() {
    saisieLibre = '';
    modeAutre = false;
    confirmationMiseAJour = !!item?.miseAJour;
    if (item) dire(item.miseAJour ? texteMiseAJour() : remplir(q.questionnaire, joueur));
  }

  function valeurAncienne() {
    const r = item.miseAJour;
    if (r.texte) return r.texte;
    if (r.membreId) return tous.find((j) => j.id === r.membreId)?.nom ?? '?';
    return majuscule(choixParId(q, r.choixId)?.label ?? '?');
  }

  function texteMiseAJour() {
    return `${remplir(q.questionnaire, joueur)} Tu avais répondu : ${valeurAncienne()}. C'est toujours vrai ?`;
  }

  async function repondre(valeur) {
    taire();
    await enregistrerReponse(joueur.id, q.id, valeur);
    suivante();
  }

  function passer() {
    taire();
    sons.clic();
    suivante();
  }

  function suivante() {
    if (indexQuestion < liste.length - 1) {
      indexQuestion++;
      sons.whoosh();
      preparerQuestion();
    } else {
      phase = 'merci';
      sons.applaudissements(1.5);
      dire(`Merci ${joueur.nom} !`);
    }
  }

  async function joueurSuivant() {
    if (seul) return retour();
    if (indexJoueur < ordre.length - 1) {
      indexJoueur++;
      phase = 'relais';
    } else {
      await lancerEmission();
    }
  }

  async function lancerEmission() {
    phase = 'lancement';
    const partieId = await creerPartie({ presents: ordre, mode, duree, manches, rigolo });
    if (!partieId) {
      phase = 'manque';
      return;
    }
    aller('emission', { partieId }, { remplacer: true });
  }

  function encorePlus() {
    aller('questionnaire', { joueurs: idsPresents, mode, duree, supplement: true, manches, rigolo }, { remplacer: true });
  }

  const optionsMembre = $derived(
    q?.type === 'membre'
      ? tous
          .filter((j) => q.inclureSoi || j.id !== joueur.id)
          .map((j) => ({ id: `j${j.id}`, label: j.id === joueur.id ? `${j.nom} (moi !)` : j.nom, emoji: j.emoji, couleur: j.couleur }))
      : []
  );
</script>

<section class="questionnaire">
  {#if phase === 'relais' && joueur}
    <Relais
      {joueur}
      consigne="Les autres, on ferme les yeux ou on regarde ailleurs ! Le questionnaire est secret."
      onpret={commencerJoueur}
      secondaire={seul ? null : { label: '⏭️ Passer les questions et lancer l’émission', onclick: lancerEmission }}
    />
  {:else if phase === 'accueil'}
    <div class="centre">
      <Mascotte humeur="parle" taille={tp(170)} bulle={texteAccueil()} />
      <Avatar {joueur} taille={tp(90)} nom />
      <Bouton taille="grand" onclick={demarrerQuestions}>C’est parti ! 🚀</Bouton>
    </div>
  {:else if phase === 'question' && q}
    <header class="haut">
      <Avatar {joueur} taille={44} />
      <div class="progression">
        <div class="barre" style="width: {((indexQuestion + 1) / liste.length) * 100}%"></div>
      </div>
      <span class="compte">{indexQuestion + 1}/{liste.length}</span>
    </header>

    {#key indexQuestion}
      <div class="carte">
        <div class="categorie">{categorieParId[q.categorie]?.emoji} {categorieParId[q.categorie]?.label}</div>
        {#if q.type === 'drole'}
          <p class="consigne-drole">😂 Quelle fin te fait le plus rire ?</p>
          <PhraseTrou phrase={q.questionnaire} />
        {:else}
        <h1 class="question" class:petit-texte={remplir(q.questionnaire, joueur).length > 55}>{typo(remplir(q.questionnaire, joueur))}</h1>
        {/if}

        {#if item.miseAJour && confirmationMiseAJour}
          <div class="mise-a-jour">
            <p>Tu avais répondu :</p>
            <strong>{valeurAncienne()}</strong>
            <p>C’est toujours vrai ?</p>
            <div class="ligne">
              <Bouton onclick={() => repondre({ ...item.miseAJour, id: undefined, date: undefined })}>👍 Oui</Bouton>
              <Bouton variante="carte" onclick={() => (confirmationMiseAJour = false)}>✏️ Non, je change</Bouton>
            </div>
          </div>
        {:else if q.type === 'drole'}
          <GrilleChoix options={q.choix.map((c) => ({ ...c, label: majuscule(c.label) }))} onchoix={(o) => repondre({ choixId: o.id })} />
        {:else if q.type === 'choix' && !modeAutre}
          <GrilleChoix options={q.choix.map((c) => ({ ...c, label: majuscule(c.label) }))} compact={q.choix.length > 6} onchoix={(o) => repondre({ choixId: o.id })} />
        {:else if q.type === 'duel'}
          <div class="duel">
            {#each q.choix as c, i}
              <button class="carte-duel" style="--i: {i}" onclick={() => (sons.pop(), repondre({ choixId: c.id }))}>
                <span class="emoji">{c.emoji}</span>
                <span>{majuscule(c.label)}</span>
              </button>
              {#if i === 0}<span class="ou">ou</span>{/if}
            {/each}
          </div>
        {:else if q.type === 'membre'}
          <GrilleChoix options={optionsMembre} avatars colonnes={optionsMembre.length > 4 ? 3 : 2} onchoix={(o) => repondre({ membreId: Number(o.id.slice(1)) })} />
        {:else}
          <!-- libre, ou « Autre… » d'un QCM -->
          <div class="libre">
            <!-- svelte-ignore a11y_autofocus -->
            <input
              bind:value={saisieLibre}
              maxlength={modeAutre ? 40 : 60}
              placeholder={q.exemple ? `Ex. : ${q.exemple}` : 'Ta réponse…'}
              autocomplete="off"
              autofocus
              onkeydown={(e) => e.key === 'Enter' && saisieLibre.trim() && repondre({ texte: saisieLibre.trim() })}
            />
            <Bouton large desactive={!saisieLibre.trim()} onclick={() => repondre({ texte: saisieLibre.trim() })}>Valider ✅</Bouton>
            {#if modeAutre}
              <Bouton variante="discret" onclick={() => (modeAutre = false)}>← Revenir aux choix</Bouton>
            {/if}
          </div>
        {/if}
      </div>
    {/key}

    <div class="bas">
      {#if q.type === 'choix' && q.autre && !petit && !modeAutre && !(item.miseAJour && confirmationMiseAJour)}
        <Bouton variante="carte" onclick={() => (modeAutre = true)}>✏️ Autre…</Bouton>
      {/if}
      <Bouton variante="carte" large onclick={passer}>⏭️ Passer</Bouton>
    </div>
  {:else if phase === 'merci'}
    <div class="centre">
      <div class="bravo">🎉</div>
      <Mascotte humeur="fete" taille={tp(160)} bulle={liste.length ? `Merci ${joueur.nom} ! Tes réponses sont bien cachées.` : `Rien de nouveau pour ${joueur.nom} aujourd'hui !`} />
      <Bouton taille="grand" onclick={joueurSuivant}>{seul ? 'Terminer ✅' : indexJoueur < ordre.length - 1 ? 'Candidat suivant ➡️' : 'Lancer l’émission ! 🎬'}</Bouton>
    </div>
  {:else if phase === 'lancement'}
    <div class="centre"><Mascotte humeur="suspense" taille={tp(160)} bulle="Je prépare les questions…" /></div>
  {:else if phase === 'manque'}
    <div class="centre">
      <Mascotte humeur="decu" taille={tp(150)} bulle="Il me manque des réponses pour préparer une belle émission. On répond à quelques questions de plus ?" />
      <Bouton taille="grand" onclick={encorePlus}>➕ Encore quelques questions</Bouton>
      <Bouton variante="discret" onclick={accueil}>Retour à l’accueil</Bouton>
    </div>
  {/if}
</section>

<style>
  .questionnaire {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: var(--e-3) var(--e-4) var(--e-2);
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
  .haut {
    display: flex;
    align-items: center;
    gap: var(--e-3);
    margin-bottom: var(--e-3);
  }
  .progression {
    flex: 1;
    height: 14px;
    border-radius: var(--r-rond);
    background: rgba(255, 255, 255, 0.15);
    overflow: hidden;
  }
  .barre {
    height: 100%;
    background: linear-gradient(90deg, var(--rose), var(--or));
    border-radius: var(--r-rond);
    transition: width var(--d-lente) ease-out;
  }
  .compte {
    font-weight: 600;
    color: var(--texte-doux);
  }
  .carte {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    animation: carte var(--d-normale) cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .categorie {
    align-self: center;
    padding: var(--e-1) var(--e-4);
    border-radius: var(--r-rond);
    background: var(--carte-forte);
    font-size: var(--t-petit);
    font-weight: 600;
  }
  .consigne-drole {
    text-align: center;
    font-weight: 700;
    font-size: var(--t-moyen);
    color: var(--or);
  }
  .question {
    text-align: center;
    font-size: var(--t-titre);
    line-height: 1.15;
    padding: 0 var(--e-2);
  }
  .question.petit-texte {
    font-size: var(--t-grand);
  }
  .duel {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--e-2);
  }
  .carte-duel {
    min-height: clamp(84px, 16vh, 140px);
    border: 3px solid var(--bord);
    border-radius: var(--r-grand);
    background: var(--carte-forte);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--e-2);
    font-size: var(--t-grand);
    font-weight: 600;
    animation: carte var(--d-normale) cubic-bezier(0.34, 1.56, 0.64, 1) both;
    animation-delay: calc(var(--i) * 120ms);
  }
  .carte-duel:active {
    transform: scale(0.96);
    border-color: var(--or);
  }
  .carte-duel .emoji {
    font-size: var(--t-emoji-grand);
  }
  .ou {
    align-self: center;
    font-size: var(--t-moyen);
    font-weight: 700;
    color: var(--or);
  }
  .libre {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
  }
  .libre input {
    min-height: 64px;
    padding: 0 var(--e-4);
    border: 3px solid var(--bord);
    border-radius: var(--r-moyen);
    background: var(--champ);
    color: var(--texte);
    font-size: var(--t-moyen);
  }
  .libre input:focus {
    outline: none;
    border-color: var(--or);
  }
  .mise-a-jour {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--e-3);
    padding: var(--e-5);
    border-radius: var(--r-moyen);
    background: var(--carte-forte);
    text-align: center;
  }
  .mise-a-jour strong {
    font-size: var(--t-grand);
    color: var(--or);
  }
  .ligne {
    display: flex;
    gap: var(--e-3);
    flex-wrap: wrap;
    justify-content: center;
  }
  .bas {
    position: sticky;
    bottom: 0;
    margin-top: auto;
    padding: var(--e-3) 0 var(--e-2);
    background: linear-gradient(transparent, var(--fond-1) 40%);
    gap: var(--e-2);
    display: flex;
    justify-content: center;
  }
  .bas :global(.bouton) {
    flex: 1;
  }
  .bravo {
    font-size: var(--t-emoji-grand);
    animation: bravo 0.8s ease-in-out infinite alternate;
  }
  @keyframes carte {
    from { opacity: 0; transform: translateX(60px) scale(0.95); }
    to { opacity: 1; transform: none; }
  }
  @keyframes bravo {
    from { transform: rotate(-12deg) scale(1); }
    to { transform: rotate(12deg) scale(1.15); }
  }
</style>
