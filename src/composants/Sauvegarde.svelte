<script>
  import Bouton from './Bouton.svelte';
  import { exporterDonnees, importerDonnees } from '../lib/db.js';
  import { sons } from '../lib/audio.js';

  // Export et import de toutes les données (candidats, réponses, palmarès, questions de la famille).
  let message = $state('');
  let fichierEnAttente = $state(null);
  let champFichier;

  function nomFichier() {
    return `family-quiz-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
  }

  async function fichierSauvegarde() {
    const donnees = await exporterDonnees();
    const resume = `${donnees.joueurs.length} candidats, ${donnees.reponses.length} réponses`;
    const fichier = new File([JSON.stringify(donnees)], nomFichier(), { type: 'application/json' });
    return { fichier, resume };
  }

  async function telecharger() {
    const { fichier, resume } = await fichierSauvegarde();
    const url = URL.createObjectURL(fichier);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = fichier.name;
    lien.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    sons.bonne();
    message = `✅ Sauvegarde téléchargée (${resume}). Garde-la précieusement !`;
  }

  const partageFichiers = typeof navigator !== 'undefined' && !!navigator.canShare;

  async function partager() {
    const { fichier, resume } = await fichierSauvegarde();
    if (!navigator.canShare?.({ files: [fichier] })) return telecharger();
    try {
      await navigator.share({ files: [fichier], title: 'Sauvegarde Family Quiz' });
      message = `✅ Sauvegarde partagée (${resume}).`;
    } catch {
      /* partage annulé */
    }
  }

  async function choisirFichier(e) {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!f) return;
    try {
      const donnees = JSON.parse(await f.text());
      if (donnees?.application !== 'family-quiz') throw new Error();
      fichierEnAttente = donnees;
      message = '';
    } catch {
      message = '❌ Ce fichier n’est pas une sauvegarde Family Quiz.';
    }
  }

  async function confirmerImport() {
    try {
      await importerDonnees(fichierEnAttente);
      sons.fanfare();
      message = '✅ Sauvegarde restaurée ! Redémarrage…';
      setTimeout(() => location.reload(), 1200);
    } catch (e) {
      message = `❌ ${e.message}`;
    }
    fichierEnAttente = null;
  }
</script>

<div class="sauvegarde">
  <p class="titre">💾 Sauvegarde</p>
  <p class="aide">Les données ne sont que sur cet appareil. Fais une sauvegarde de temps en temps, pour ne rien perdre ou pour passer sur une autre tablette.</p>
  <div class="ligne">
    <Bouton variante="carte" taille="petit" onclick={telecharger}>⬇️ Exporter</Bouton>
    {#if partageFichiers}<Bouton variante="carte" taille="petit" onclick={partager}>📤 Partager</Bouton>{/if}
    <Bouton variante="carte" taille="petit" onclick={() => champFichier.click()}>⬆️ Importer</Bouton>
  </div>
  <input bind:this={champFichier} type="file" accept="application/json,.json" hidden onchange={choisirFichier} />

  {#if fichierEnAttente}
    <div class="confirmer">
      <p>
        Remplacer toutes les données de cet appareil par cette sauvegarde du
        {new Date(fichierEnAttente.date).toLocaleDateString('fr-FR')} ({fichierEnAttente.joueurs.length} candidats, {fichierEnAttente.reponses?.length ?? 0} réponses) ?
      </p>
      <div class="ligne">
        <Bouton variante="carte" onclick={() => (fichierEnAttente = null)}>Annuler</Bouton>
        <Bouton variante="danger" onclick={confirmerImport}>Remplacer</Bouton>
      </div>
    </div>
  {/if}
  {#if message}<p class="message">{message}</p>{/if}
</div>

<style>
  .sauvegarde {
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
  .titre {
    font-weight: 600;
  }
  .aide {
    color: var(--texte-doux);
    font-size: var(--t-petit);
  }
  .ligne {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--e-2);
  }
  .confirmer {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    padding: var(--e-3);
    border: 2px solid var(--rouge);
    border-radius: var(--r-moyen);
    background: rgba(255, 90, 90, 0.15);
  }
  .message {
    font-weight: 600;
  }
</style>
