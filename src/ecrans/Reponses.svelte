<script>
  import EnTete from '../composants/EnTete.svelte';
  import Avatar from '../composants/Avatar.svelte';
  import { aller } from '../lib/etat.svelte.js';
  import { db, listerJoueurs, reponsesDe, supprimerReponse } from '../lib/db.js';
  import { questionParId, categorieParId, categories, choixParId } from '../lib/banque.js';
  import { remplir, majuscule, typo } from '../lib/grammaire.js';
  import { sons } from '../lib/audio.js';

  // Les réponses d'un candidat : les voir, les modifier ou les supprimer une par une.
  let { id } = $props();

  let joueur = $state(null);
  let tous = $state([]);
  let reponses = $state([]);
  let aSupprimer = $state(null);

  Promise.all([db.joueurs.get(id), listerJoueurs(), reponsesDe(id)]).then(([j, t, r]) => {
    joueur = j;
    tous = t;
    reponses = r.filter((x) => !x.passee && questionParId[x.questionId]);
  });

  function valeur(r) {
    const q = questionParId[r.questionId];
    if (r.texte) return `« ${r.texte} »`;
    if (r.membreId) {
      const m = tous.find((j) => j.id === r.membreId);
      return m ? `${m.emoji} ${m.nom}` : '(candidat supprimé)';
    }
    const c = choixParId(q, r.choixId);
    return c ? `${c.emoji} ${majuscule(c.label)}` : '?';
  }

  const groupes = $derived(
    categories
      .map((c) => ({ ...c, reponses: reponses.filter((r) => questionParId[r.questionId].categorie === c.id) }))
      .filter((g) => g.reponses.length)
  );

  async function supprimer(r) {
    await supprimerReponse(r.id);
    reponses = reponses.filter((x) => x.id !== r.id);
    aSupprimer = null;
    sons.whoosh();
  }

  function modifier(r) {
    aller('questionnaire', { joueurs: [id], seul: true, questions: [r.questionId] });
  }
</script>

<EnTete titre="Ses réponses" />

{#if joueur}
  <section class="reponses">
    <div class="qui">
      <Avatar {joueur} taille={44} />
      <strong>{joueur.nom}</strong>
      <span>{reponses.length} réponse{reponses.length > 1 ? 's' : ''}</span>
    </div>

    {#each groupes as g (g.id)}
      <h2>{g.emoji} {g.label}</h2>
      {#each g.reponses as r (r.id)}
        <div class="ligne">
          <div class="texte">
            <p class="question">{typo(remplir(questionParId[r.questionId].questionnaire, joueur))}</p>
            <p class="valeur">{valeur(r)}</p>
          </div>
          {#if aSupprimer === r.id}
            <div class="boutons">
              <button class="icone non" aria-label="Annuler" onclick={() => (aSupprimer = null)}>↩️</button>
              <button class="icone oui" aria-label="Confirmer la suppression" onclick={() => supprimer(r)}>🗑️</button>
            </div>
          {:else}
            <div class="boutons">
              <button class="icone" aria-label="Modifier" onclick={() => modifier(r)}>✏️</button>
              <button class="icone" aria-label="Supprimer" onclick={() => (aSupprimer = r.id)}>🗑️</button>
            </div>
          {/if}
        </div>
      {/each}
    {:else}
      <p class="vide">Aucune réponse enregistrée.</p>
    {/each}
  </section>
{/if}

<style>
  .reponses {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
    padding: var(--e-2) var(--e-4) var(--e-7);
  }
  .qui {
    display: flex;
    align-items: center;
    gap: var(--e-3);
    margin-bottom: var(--e-2);
  }
  .qui strong {
    font-size: var(--t-moyen);
  }
  .qui span {
    margin-left: auto;
    color: var(--texte-doux);
  }
  h2 {
    margin-top: var(--e-3);
    font-size: var(--t-moyen);
    color: var(--or);
  }
  .ligne {
    display: flex;
    align-items: center;
    gap: var(--e-3);
    padding: var(--e-3);
    border: 2px solid var(--bord);
    border-radius: var(--r-moyen);
    background: var(--carte);
    animation: apparait var(--d-normale) ease-out both;
  }
  .texte {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--e-1);
  }
  .question {
    color: var(--texte-doux);
    font-size: var(--t-petit);
  }
  .valeur {
    font-weight: 600;
    font-size: var(--t-normal);
  }
  .boutons {
    display: flex;
    gap: var(--e-2);
  }
  .icone {
    width: var(--cible);
    height: var(--cible);
    border-radius: 50%;
    border: 2px solid var(--bord);
    background: var(--carte);
    font-size: var(--t-moyen);
  }
  .icone.oui {
    background: var(--rouge);
    border-color: var(--rouge);
  }
  .vide {
    text-align: center;
    color: var(--texte-doux);
    padding: var(--e-6) 0;
  }
  @keyframes apparait {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: none; }
  }
</style>
