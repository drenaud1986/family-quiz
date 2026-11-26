<script>
  import EnTete from '../composants/EnTete.svelte';
  import Avatar from '../composants/Avatar.svelte';
  import { db, listerJoueurs, listerHistorique } from '../lib/db.js';
  import { calculerScores, scoresEquipes, MODES } from '../lib/jeu.js';

  // Palmarès de toutes les émissions et tableau « qui connaît le mieux qui ».
  let joueurs = $state([]);
  let parties = $state([]);
  let historique = $state([]);
  let charge = $state(false);

  Promise.all([listerJoueurs(), db.parties.where('terminee').equals(1).toArray(), listerHistorique()]).then(([j, p, h]) => {
    joueurs = j;
    parties = p.filter((x) => !x.abandonnee).sort((a, b) => b.date - a.date);
    historique = h;
    charge = true;
  });

  const parId = $derived(Object.fromEntries(joueurs.map((j) => [j.id, j])));
  const modeLabel = Object.fromEntries(MODES.map((m) => [m.id, `${m.emoji} ${m.label}`]));

  /** Résumé de chaque émission : date, mode, gagnant(s). */
  const resumes = $derived(
    parties.map((p) => {
      const scores = calculerScores(p);
      const equipes = scoresEquipes(p, scores);
      let gagnants;
      if (equipes) {
        const max = Math.max(...equipes.map((e) => e.score));
        gagnants = equipes.filter((e) => e.score === max).flatMap((e) => e.joueurs);
      } else {
        const max = Math.max(...p.joueurs.map((id) => scores[id] ?? 0));
        gagnants = p.joueurs.filter((id) => (scores[id] ?? 0) === max);
      }
      return { p, scores, equipes, gagnants };
    })
  );

  /** Bilan par candidat : émissions, victoires, record. */
  const bilans = $derived(
    joueurs
      .map((j) => {
        const jouees = resumes.filter((r) => r.p.joueurs.includes(j.id));
        return {
          j,
          jouees: jouees.length,
          victoires: jouees.filter((r) => r.gagnants.includes(j.id)).length,
          record: Math.max(0, ...jouees.map((r) => r.scores[j.id] ?? 0))
        };
      })
      .filter((b) => b.jouees)
      .sort((a, b) => b.victoires - a.victoires || b.record - a.record)
  );

  /** Taux de bonnes réponses de chaque candidat (ligne) sur chaque candidat (colonne). */
  const matrice = $derived.by(() => {
    const cases = {};
    for (const h of historique) {
      if (h.sujetId == null || h.joueurActifId == null || h.sujetId === h.joueurActifId) continue;
      const c = (cases[`${h.joueurActifId}|${h.sujetId}`] ??= { ok: 0, total: 0 });
      c.total++;
      if (h.correct) c.ok++;
    }
    return cases;
  });
  const concernes = $derived(joueurs.filter((j) => Object.keys(matrice).some((k) => k.split('|').map(Number).includes(j.id))));

  function taux(actif, sujet) {
    const c = matrice[`${actif}|${sujet}`];
    return c?.total ? Math.round((c.ok / c.total) * 100) : null;
  }

  /** Pour chaque candidat, la personne qui le connaît le mieux. */
  const meilleursConnaisseurs = $derived(
    concernes
      .map((s) => {
        let meilleur = null;
        for (const a of concernes) {
          const t = taux(a.id, s.id);
          const c = matrice[`${a.id}|${s.id}`];
          if (t !== null && c.total >= 3 && (!meilleur || t > meilleur.t)) meilleur = { a, t };
        }
        return meilleur ? { s, ...meilleur } : null;
      })
      .filter(Boolean)
  );

  const couleur = (t) => (t === null ? 'transparent' : `hsl(${Math.round(t * 1.2)}, 70%, 45%)`);
  const date = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
</script>

<EnTete titre="Palmarès" />

<section class="palmares">
  {#if charge && !parties.length}
    <p class="vide">🏆 Aucune émission terminée pour l’instant.<br />Le palmarès se remplira au fil des parties !</p>
  {/if}

  {#if bilans.length}
    <h2>🏆 Le classement</h2>
    <div class="bilans">
      {#each bilans as b, i (b.j.id)}
        <div class="bilan" style="--i: {i}">
          <span class="rang">{['🥇', '🥈', '🥉'][i] ?? i + 1}</span>
          <Avatar joueur={b.j} taille={40} />
          <div class="infos">
            <strong>{b.j.nom}</strong>
            <span>{b.victoires} victoire{b.victoires > 1 ? 's' : ''} · {b.jouees} émission{b.jouees > 1 ? 's' : ''} · record {b.record} pts</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if concernes.length >= 2}
    <h2>🔍 Qui connaît le mieux qui ?</h2>
    {#if meilleursConnaisseurs.length}
      <div class="connaisseurs">
        {#each meilleursConnaisseurs as m (m.s.id)}
          <p><Avatar joueur={m.a} taille={28} /> connaît le mieux <Avatar joueur={m.s} taille={28} /> <strong>{m.t} %</strong></p>
        {/each}
      </div>
    {/if}
    <div class="tableau">
      <table>
        <thead>
          <tr>
            <th><small>répond sur →</small></th>
            {#each concernes as s (s.id)}<th><Avatar joueur={s} taille={28} /></th>{/each}
          </tr>
        </thead>
        <tbody>
          {#each concernes as a (a.id)}
            <tr>
              <th><Avatar joueur={a} taille={28} /></th>
              {#each concernes as s (s.id)}
                {@const t = a.id === s.id ? null : taux(a.id, s.id)}
                <td style="background: {couleur(t)}">{a.id === s.id ? '—' : t === null ? '·' : `${t} %`}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="aide">Pourcentage de bonnes réponses de chaque candidat (en ligne) sur chaque autre (en colonne), toutes émissions confondues.</p>
  {/if}

  {#if resumes.length}
    <h2>📺 Les émissions</h2>
    {#each resumes as r (r.p.id)}
      <div class="emission">
        <div class="entete-emission">
          <span>{date(r.p.date)}</span>
          <span class="mode">{r.p.rigolo ? '😂 Rigolote · ' : ''}{modeLabel[r.p.mode] ?? ''}{r.p.cible && parId[r.p.cible] ? ` ${parId[r.p.cible].nom}` : ''}</span>
        </div>
        <div class="scores">
          {#each [...r.p.joueurs].sort((a, b) => (r.scores[b] ?? 0) - (r.scores[a] ?? 0)) as id (id)}
            {#if parId[id]}
              <span class="score" class:gagnant={r.gagnants.includes(id)}>
                {r.gagnants.includes(id) ? '👑' : ''}{parId[id].emoji} {parId[id].nom} <strong>{r.scores[id] ?? 0}</strong>
              </span>
            {/if}
          {/each}
        </div>
      </div>
    {/each}
  {/if}
</section>

<style>
  .palmares {
    display: flex;
    flex-direction: column;
    gap: var(--e-3);
    padding: var(--e-2) var(--e-4) var(--e-7);
  }
  h2 {
    margin-top: var(--e-3);
    font-size: var(--t-moyen);
    color: var(--or);
  }
  .vide {
    text-align: center;
    color: var(--texte-doux);
    padding: var(--e-6) 0;
    line-height: 1.5;
  }
  .bilans {
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
  }
  .bilan {
    display: flex;
    align-items: center;
    gap: var(--e-3);
    padding: var(--e-2) var(--e-3);
    border-radius: var(--r-moyen);
    background: var(--carte);
    animation: arrive var(--d-lente) cubic-bezier(0.34, 1.56, 0.64, 1) both;
    animation-delay: calc(var(--i) * 80ms);
  }
  .rang {
    width: 32px;
    text-align: center;
    font-size: var(--t-grand);
    font-weight: 700;
  }
  .infos {
    display: flex;
    flex-direction: column;
  }
  .infos span {
    color: var(--texte-doux);
    font-size: var(--t-petit);
  }
  .connaisseurs p {
    display: flex;
    align-items: center;
    gap: var(--e-2);
    flex-wrap: wrap;
    padding: var(--e-1) 0;
  }
  .connaisseurs strong {
    color: var(--or);
  }
  .tableau {
    overflow-x: auto;
  }
  table {
    border-collapse: separate;
    border-spacing: 4px;
    margin: 0 auto;
  }
  th,
  td {
    text-align: center;
    font-weight: 600;
    font-size: var(--t-petit);
  }
  td {
    min-width: 52px;
    height: 40px;
    border-radius: var(--r-petit);
    background: var(--carte);
  }
  th small {
    color: var(--texte-faible);
    font-weight: 400;
  }
  .aide {
    color: var(--texte-faible);
    font-size: var(--t-petit);
    text-align: center;
  }
  .emission {
    padding: var(--e-3);
    border: 2px solid var(--bord);
    border-radius: var(--r-moyen);
    background: var(--carte);
    display: flex;
    flex-direction: column;
    gap: var(--e-2);
  }
  .entete-emission {
    display: flex;
    justify-content: space-between;
    gap: var(--e-2);
    color: var(--texte-doux);
    font-size: var(--t-petit);
  }
  .scores {
    display: flex;
    flex-wrap: wrap;
    gap: var(--e-2);
  }
  .score {
    padding: 2px var(--e-2);
    border-radius: var(--r-rond);
    background: rgba(0, 0, 0, 0.25);
    font-size: var(--t-petit);
  }
  .score.gagnant {
    background: var(--or-voile);
    border: 1px solid var(--or);
  }
  @keyframes arrive {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: none; }
  }
</style>
