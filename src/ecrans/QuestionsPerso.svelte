<script>
  import EnTete from '../composants/EnTete.svelte';
  import Bouton from '../composants/Bouton.svelte';
  import Avatar from '../composants/Avatar.svelte';
  import { listerPerso, enregistrerPerso, supprimerPerso, listerJoueurs } from '../lib/db.js';
  import { integrerPerso } from '../lib/banque.js';
  import { sons } from '../lib/audio.js';

  // Questions écrites par la famille :
  // - « questionnaire » : posée à chaque candidat pendant le questionnaire secret ;
  // - « souvenir » : question à réponse connue (blague interne, anecdote), posée pendant le quiz.
  let onglet = $state('questionnaire');
  let liste = $state([]);
  let joueurs = $state([]);
  let edition = $state(null);
  let aSupprimer = $state(null);
  let erreur = $state('');

  async function charger() {
    liste = await listerPerso();
    integrerPerso(liste);
  }
  charger();
  listerJoueurs().then((j) => (joueurs = j));

  const affichees = $derived(liste.filter((p) => (onglet === 'souvenir' ? p.type === 'souvenir' : p.type !== 'souvenir')));
  const parId = $derived(Object.fromEntries(joueurs.map((j) => [j.id, j])));

  function nouvelle() {
    erreur = '';
    edition =
      onglet === 'souvenir'
        ? { type: 'souvenir', texte: '', bonne: '', fausses: ['', '', ''], concerneId: null }
        : { type: 'questionnaire', texte: '', format: 'choix', ages: 'tous', exemple: '', choix: [{ label: '', emoji: '' }, { label: '', emoji: '' }, { label: '', emoji: '' }, { label: '', emoji: '' }] };
  }

  function modifier(p) {
    erreur = '';
    edition = JSON.parse(JSON.stringify(p));
    if (edition.type !== 'souvenir' && edition.choix?.length < 6) edition.choix = [...edition.choix];
  }

  async function enregistrer() {
    const e = edition;
    if (!e.texte.trim()) return (erreur = 'Écris la question.');
    if (e.type === 'souvenir') {
      if (!e.bonne.trim()) return (erreur = 'Indique la bonne réponse.');
      if (e.fausses.filter((f) => f.trim()).length < 1) return (erreur = 'Ajoute au moins une fausse réponse.');
    } else if (e.format === 'choix' && e.choix.filter((c) => c.label.trim()).length < 2) {
      return (erreur = 'Il faut au moins 2 choix de réponse.');
    }
    await enregistrerPerso($state.snapshot(e));
    sons.bonne();
    edition = null;
    await charger();
  }

  async function supprimer(id) {
    await supprimerPerso(id);
    aSupprimer = null;
    sons.whoosh();
    await charger();
  }

  function ajouterChoix() {
    if (edition.choix.length < 6) edition.choix.push({ label: '', emoji: '' });
  }
</script>

<EnTete titre="Nos questions" />

<section class="perso">
  {#if !edition}
    <div class="onglets">
      <button class:actif={onglet === 'questionnaire'} onclick={() => ((onglet = 'questionnaire'), sons.pop())}>🙋 Pour le questionnaire</button>
      <button class:actif={onglet === 'souvenir'} onclick={() => ((onglet = 'souvenir'), sons.pop())}>💭 Souvenirs</button>
    </div>
    <p class="aide">
      {#if onglet === 'souvenir'}
        Une anecdote, une blague de famille, un surnom… Tu donnes la bonne réponse et des fausses : la question sera posée pendant le quiz.
      {:else}
        Une question posée à chaque candidat pendant son questionnaire secret. Écris-la comme si tu parlais au candidat : « Quel est ton… ? »
      {/if}
    </p>

    <Bouton taille="grand" large onclick={nouvelle}>➕ Nouvelle question</Bouton>

    {#each affichees as p (p.id)}
      <div class="ligne">
        <div class="texte">
          <p class="question">{p.texte}</p>
          {#if p.type === 'souvenir'}
            <p class="detail">✅ {p.bonne}{#if p.concerneId && parId[p.concerneId]} · sur {parId[p.concerneId].emoji} {parId[p.concerneId].nom}{/if}</p>
          {:else}
            <p class="detail">{p.format === 'libre' ? '✏️ Réponse libre' : p.choix.filter((c) => c.label).map((c) => `${c.emoji || '•'} ${c.label}`).join('  ')}</p>
          {/if}
        </div>
        {#if aSupprimer === p.id}
          <button class="icone" aria-label="Annuler" onclick={() => (aSupprimer = null)}>↩️</button>
          <button class="icone rouge" aria-label="Confirmer la suppression" onclick={() => supprimer(p.id)}>🗑️</button>
        {:else}
          <button class="icone" aria-label="Modifier" onclick={() => modifier(p)}>✏️</button>
          <button class="icone" aria-label="Supprimer" onclick={() => (aSupprimer = p.id)}>🗑️</button>
        {/if}
      </div>
    {:else}
      <p class="vide">Aucune question pour l’instant.</p>
    {/each}
  {:else}
    <div class="formulaire">
      <label class="champ">
        <span>{edition.type === 'souvenir' ? 'La question' : 'La question (en disant « tu »)'}</span>
        <textarea bind:value={edition.texte} rows="2" maxlength="140" placeholder={edition.type === 'souvenir' ? 'Comment s’appelait le premier chat de la famille ?' : 'Quelle est ta chanson pour la voiture ?'}></textarea>
      </label>

      {#if edition.type === 'souvenir'}
        <label class="champ"><span>✅ La bonne réponse</span><input bind:value={edition.bonne} maxlength="50" /></label>
        <div class="champ">
          <span>❌ Les fausses réponses</span>
          {#each edition.fausses as _, i}<input bind:value={edition.fausses[i]} maxlength="50" placeholder={`Fausse réponse ${i + 1}`} />{/each}
        </div>
        <div class="champ">
          <span>Elle parle de… (facultatif)</span>
          <div class="membres">
            <button class="membre" class:actif={!edition.concerneId} onclick={() => (edition.concerneId = null)}>👨‍👩‍👧‍👦 Toute la famille</button>
            {#each joueurs as j (j.id)}
              <button class="membre" class:actif={edition.concerneId === j.id} onclick={() => (edition.concerneId = j.id)}><Avatar joueur={j} taille={28} /> {j.nom}</button>
            {/each}
          </div>
          <small class="aide">La personne concernée ne recevra pas cette question.</small>
        </div>
      {:else}
        <div class="champ">
          <span>Type de réponse</span>
          <div class="segments">
            <button class:actif={edition.format === 'choix'} onclick={() => (edition.format = 'choix')}>🔘 Choix</button>
            <button class:actif={edition.format === 'libre'} onclick={() => (edition.format = 'libre')}>✏️ Réponse libre (dès 9 ans)</button>
          </div>
        </div>
        {#if edition.format === 'choix'}
          <div class="champ">
            <span>Les choix (2 à 6) — emoji facultatif</span>
            {#each edition.choix as c, i}
              <div class="choix">
                <input class="emoji" bind:value={c.emoji} maxlength="4" placeholder="🙂" aria-label="Emoji" />
                <input bind:value={c.label} maxlength="40" placeholder={`Choix ${i + 1}`} />
              </div>
            {/each}
            {#if edition.choix.length < 6}<Bouton variante="discret" onclick={ajouterChoix}>➕ Un choix de plus</Bouton>{/if}
          </div>
          <div class="champ">
            <span>Pour qui ?</span>
            <div class="segments">
              <button class:actif={edition.ages !== '9+'} onclick={() => (edition.ages = 'tous')}>Tout le monde</button>
              <button class:actif={edition.ages === '9+'} onclick={() => (edition.ages = '9+')}>Dès 9 ans</button>
            </div>
          </div>
        {:else}
          <label class="champ"><span>Exemple de réponse (facultatif)</span><input bind:value={edition.exemple} maxlength="50" /></label>
        {/if}
      {/if}

      {#if erreur}<p class="erreur">{erreur}</p>{/if}
      <Bouton taille="grand" large onclick={enregistrer}>✅ Enregistrer</Bouton>
      <Bouton variante="carte" large onclick={() => (edition = null)}>Annuler</Bouton>
    </div>
  {/if}
</section>

<style>
  .perso {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    padding: var(--e-2) var(--e-4) var(--e-7);
  }
  .onglets,
  .segments {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--e-2);
  }
  .onglets button,
  .segments button {
    min-height: var(--cible);
    padding: var(--e-2);
    border: 2px solid var(--bord);
    border-radius: var(--r-petit);
    background: var(--carte);
    font-size: var(--t-petit);
    font-weight: 600;
  }
  .actif {
    border-color: var(--or) !important;
    background: var(--or-voile) !important;
  }
  .aide {
    color: var(--texte-doux);
    font-size: var(--t-petit);
    text-align: center;
  }
  .ligne {
    display: flex;
    align-items: center;
    gap: var(--e-2);
    padding: var(--e-3);
    border: 2px solid var(--bord);
    border-radius: var(--r-moyen);
    background: var(--carte);
  }
  .texte {
    flex: 1;
    min-width: 0;
  }
  .question {
    font-weight: 600;
  }
  .detail {
    color: var(--texte-doux);
    font-size: var(--t-petit);
  }
  .icone {
    flex-shrink: 0;
    width: var(--cible);
    height: var(--cible);
    border-radius: 50%;
    border: 2px solid var(--bord);
    background: var(--carte);
    font-size: var(--t-moyen);
  }
  .icone.rouge {
    background: var(--rouge);
    border-color: var(--rouge);
  }
  .vide {
    text-align: center;
    color: var(--texte-doux);
    padding: var(--e-5) 0;
  }
  .formulaire {
    display: flex;
    flex-direction: column;
    gap: var(--e-4);
  }
  .champ {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
  }
  .champ > span {
    font-weight: 600;
    color: var(--texte-doux);
  }
  input,
  textarea {
    min-height: var(--cible);
    padding: var(--e-2) var(--e-3);
    border: 2px solid var(--bord);
    border-radius: var(--r-petit);
    background: var(--champ);
    color: var(--texte);
    font-size: var(--t-normal);
    resize: none;
  }
  input:focus,
  textarea:focus {
    outline: none;
    border-color: var(--or);
  }
  .choix {
    display: grid;
    grid-template-columns: var(--cible) 1fr;
    gap: var(--e-2);
  }
  .choix .emoji {
    text-align: center;
    padding: 0;
    font-size: var(--t-moyen);
  }
  .membres {
    display: flex;
    flex-wrap: wrap;
    gap: var(--e-2);
  }
  .membre {
    min-height: 44px;
    display: flex;
    align-items: center;
    gap: var(--e-2);
    padding: var(--e-1) var(--e-3);
    border: 2px solid var(--bord);
    border-radius: var(--r-rond);
    background: var(--carte);
    font-weight: 600;
  }
  .erreur {
    color: var(--rouge);
    font-weight: 600;
    text-align: center;
  }
</style>
