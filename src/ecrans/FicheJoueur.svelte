<script>
  import { tp } from '../lib/ecran.svelte.js';
  import EnTete from '../composants/EnTete.svelte';
  import Avatar from '../composants/Avatar.svelte';
  import Bouton from '../composants/Bouton.svelte';
  import { retour, aller } from '../lib/etat.svelte.js';
  import { db, listerJoueurs, enregistrerJoueur, supprimerJoueur, reponsesDe, viderReponses } from '../lib/db.js';
  import { AVATARS, ROLES, COULEURS, AGE_MIN, AGE_MAX, couleurLibre, tranche, TRANCHES } from '../lib/joueurs.js';
  import { sons } from '../lib/audio.js';

  let { id = null } = $props();

  let nom = $state('');
  let emoji = $state('🦁');
  let ageSaisi = $state(10);
  let role = $state(null);
  let couleur = $state(COULEURS[0]);
  let existant = $state(null);
  let confirmer = $state(false);
  let erreur = $state('');
  let nbReponses = $state(0);
  let confirmerVider = $state(false);

  listerJoueurs().then(async (joueurs) => {
    if (id) {
      existant = await db.joueurs.get(id);
      if (existant) {
        nbReponses = (await reponsesDe(id)).filter((r) => !r.passee).length;
        nom = existant.nom;
        emoji = existant.emoji;
        ageSaisi = new Date().getFullYear() - existant.anneeNaissance;
        role = existant.role;
        couleur = existant.couleur;
      }
    } else {
      couleur = couleurLibre(joueurs);
      const pris = new Set(joueurs.map((j) => j.emoji));
      emoji = AVATARS.find((a) => !pris.has(a)) ?? AVATARS[0];
    }
  });

  const apercu = $derived({ nom: nom || '…', emoji, couleur });
  const trancheLabel = $derived(TRANCHES.find((t) => t.id === tranche({ anneeNaissance: new Date().getFullYear() - ageSaisi })).label);

  function changerAge(delta) {
    ageSaisi = Math.min(AGE_MAX, Math.max(AGE_MIN, ageSaisi + delta));
    sons.clic();
  }

  async function sauver() {
    if (!nom.trim()) return !(erreur = 'Il manque le nom.');
    if (!role) return !(erreur = 'Choisis le rôle dans la famille.');
    existant = { ...(existant ?? {}), nom: nom.trim(), emoji, anneeNaissance: new Date().getFullYear() - ageSaisi, role, couleur };
    existant.id = await enregistrerJoueur($state.snapshot(existant));
    return true;
  }

  async function enregistrer() {
    if (!(await sauver())) return;
    sons.bonne();
    retour();
  }

  /** Enregistre la fiche, puis ouvre le questionnaire (ajout ou modification). */
  async function questionnaire(params) {
    if (!(await sauver())) return;
    aller('questionnaire', { joueurs: [existant.id], seul: true, ...params });
  }

  async function vider() {
    await viderReponses(existant.id);
    nbReponses = 0;
    confirmerVider = false;
    sons.whoosh();
  }

  async function basculerArchive() {
    if (!(await sauver())) return;
    existant.archive = !existant.archive;
    await enregistrerJoueur($state.snapshot(existant));
    sons.pop();
    retour();
  }


  async function supprimer() {
    await supprimerJoueur(existant.id);
    retour();
  }
</script>

<EnTete titre={existant ? 'Modifier le candidat' : 'Nouveau candidat'} />

<section class="fiche">
  <div class="apercu">
    {#key emoji + couleur}<div class="pop"><Avatar joueur={apercu} taille={tp(110)} /></div>{/key}
  </div>

  {#if existant?.id}
    <div class="bloc-reponses">
      <p class="titre-bloc">🗂️ Réponses au questionnaire : <strong>{nbReponses}</strong>{#if existant.archive} · 📦 archivé{/if}</p>
      <div class="actions-reponses">
        <Bouton variante="carte" taille="petit" onclick={() => questionnaire({})}>➕ Ajouter</Bouton>
        <Bouton variante="carte" taille="petit" desactive={!nbReponses} onclick={async () => (await sauver()) && aller('reponses', { id: existant.id })}>✏️ Modifier</Bouton>
        <Bouton variante="carte" taille="petit" desactive={!nbReponses} onclick={() => (confirmerVider = true)}>🧹 Vider</Bouton>
      </div>
      {#if confirmerVider}
        <div class="confirmer">
          <p>Effacer les {nbReponses} réponses de {existant.nom} ? Le profil est conservé.</p>
          <div class="ligne">
            <Bouton variante="carte" onclick={() => (confirmerVider = false)}>Annuler</Bouton>
            <Bouton variante="danger" onclick={vider}>Tout effacer</Bouton>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <label class="champ">
    <span>Nom</span>
    <input bind:value={nom} maxlength="16" placeholder="Papa, Emma, Mamie…" autocomplete="off" />
  </label>

  <div class="champ">
    <span>Rôle dans la famille</span>
    <div class="roles">
      {#each ROLES as r}
        <button class="role" class:actif={role === r.id} onclick={() => ((role = r.id), sons.pop())}>
          <span class="emoji">{r.emoji}</span>{r.label}
        </button>
      {/each}
    </div>
  </div>

  <div class="champ">
    <span>Âge</span>
    <div class="age">
      <button class="pas" aria-label="Moins" onclick={() => changerAge(-1)}>−</button>
      <div class="valeur"><strong>{ageSaisi}</strong> ans<small>{trancheLabel}</small></div>
      <button class="pas" aria-label="Plus" onclick={() => changerAge(1)}>+</button>
    </div>
  </div>

  <div class="champ">
    <span>Couleur</span>
    <div class="couleurs">
      {#each COULEURS as c}
        <button class="couleur" class:choisie={couleur === c} style="background: {c}" aria-label="Couleur" onclick={() => ((couleur = c), sons.pop())}></button>
      {/each}
    </div>
  </div>

  <div class="champ">
    <span>Avatar</span>
    <div class="galerie">
      {#each AVATARS as a}
        <button class="emoji-choix" class:actif={emoji === a} onclick={() => ((emoji = a), sons.pop())}>{a}</button>
      {/each}
    </div>
  </div>

  {#if erreur}<p class="erreur">{erreur}</p>{/if}

  <Bouton taille="grand" large onclick={enregistrer}>✅ Enregistrer</Bouton>

  {#if existant?.id}
    <Bouton variante="carte" large onclick={basculerArchive}>{existant.archive ? '📤 Remettre en jeu' : '📦 Archiver (absent des parties)'}</Bouton>
    {#if confirmer}
      <div class="confirmer">
        <p>Supprimer {existant.nom} et toutes ses réponses ?</p>
        <div class="ligne">
          <Bouton variante="carte" onclick={() => (confirmer = false)}>Annuler</Bouton>
          <Bouton variante="danger" onclick={supprimer}>Supprimer</Bouton>
        </div>
      </div>
    {:else}
      <Bouton variante="discret" onclick={() => (confirmer = true)}>🗑️ Supprimer ce candidat</Bouton>
    {/if}
  {/if}
</section>

<style>
  .fiche {
    display: flex;
    flex-direction: column;
    gap: var(--e-5);
    padding: var(--e-2) var(--e-4) var(--e-7);
  }
  .apercu {
    display: flex;
    justify-content: center;
    min-height: 130px;
  }
  .pop {
    animation: pop var(--d-normale) cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .champ {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
  }
  .champ > span {
    color: var(--texte-doux);
    font-weight: 600;
  }
  input {
    min-height: var(--cible);
    padding: 0 var(--e-4);
    border: 2px solid var(--bord);
    border-radius: var(--r-petit);
    background: var(--champ);
    color: var(--texte);
    font-size: var(--t-moyen);
  }
  input:focus {
    outline: none;
    border-color: var(--or);
  }
  .roles {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--e-2);
  }
  .role,
  .emoji-choix,
  .pas {
    border: 2px solid var(--bord);
    background: var(--carte);
    border-radius: var(--r-petit);
  }
  .role {
    min-height: 84px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--e-1);
    font-size: var(--t-petit);
    font-weight: 600;
  }
  .role .emoji {
    font-size: 34px;
  }
  .actif {
    border-color: var(--or) !important;
    background: var(--or-voile) !important;
    transform: scale(1.05);
  }
  .age {
    display: flex;
    align-items: center;
    gap: var(--e-3);
  }
  .pas {
    width: 64px;
    height: 64px;
    font-size: var(--t-titre);
    line-height: 1;
  }
  .valeur {
    flex: 1;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .valeur strong {
    font-size: var(--t-titre);
  }
  .valeur small {
    color: var(--texte-faible);
  }
  .couleurs {
    display: flex;
    flex-wrap: wrap;
    gap: var(--e-3);
  }
  .couleur {
    width: var(--cible);
    height: var(--cible);
    border-radius: 50%;
    border: 3px solid transparent;
  }
  .couleur.choisie {
    border-color: #fff !important;
    box-shadow: 0 0 0 3px var(--or);
  }
  .galerie {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
    gap: var(--e-2);
  }
  .emoji-choix {
    aspect-ratio: 1;
    font-size: 30px;
    transition: transform var(--d-rapide);
  }
  .bloc-reponses {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    padding: var(--e-3) var(--e-4);
    border: 2px solid var(--bord);
    border-radius: var(--r-moyen);
    background: var(--carte);
  }
  .titre-bloc {
    font-weight: 600;
    text-align: center;
  }
  .titre-bloc strong {
    color: var(--or);
  }
  .actions-reponses {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--e-2);
  }
  .erreur {
    color: var(--rouge);
    text-align: center;
    font-weight: 600;
  }
  .confirmer {
    padding: var(--e-4);
    border-radius: var(--r-moyen);
    background: rgba(255, 90, 90, 0.15);
    border: 2px solid var(--rouge);
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
  }
  .ligne {
    display: flex;
    gap: var(--e-3);
    justify-content: center;
  }
  @keyframes pop {
    from { transform: scale(0.6); }
    to { transform: scale(1); }
  }
</style>
