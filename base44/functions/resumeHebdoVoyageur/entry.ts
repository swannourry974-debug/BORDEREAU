import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Récupérer tous les voyageurs actifs (avec un vol ou une mission récente)
    const [tousVoyageurs, toutesMissions, tousVoyages, tousWallets] = await Promise.all([
      base44.asServiceRole.entities.User.list(),
      base44.asServiceRole.entities.MissionVoyageur.list('-updated_date', 500),
      base44.asServiceRole.entities.Voyage.list('-created_date', 200),
      base44.asServiceRole.entities.VoyageurWallet.list(),
    ]);

    // Missions disponibles (pas encore assignées)
    const missionsDisponibles = toutesMissions.filter(m => m.statut === 'disponible');

    // Identifier les voyageurs actifs (ceux ayant au moins une mission ou un vol)
    const emailsVoyageurs = new Set([
      ...toutesMissions.filter(m => m.voyageur_email).map(m => m.voyageur_email),
      ...tousVoyages.filter(v => v.voyageur_email).map(v => v.voyageur_email),
    ]);

    let envoyes = 0;
    const erreurs = [];

    for (const email of emailsVoyageurs) {
      const voyageurUser = tousVoyageurs.find(u => u.email === email);
      if (!voyageurUser) continue;

      const prenom = voyageurUser.full_name?.split(' ')[0] || 'Voyageur';

      // Missions de ce voyageur
      const mesMissions = toutesMissions.filter(m => m.voyageur_email === email);
      const livrees = mesMissions.filter(m => m.statut === 'livree');
      const enCours = mesMissions.filter(m => ['acceptee', 'engagee'].includes(m.statut));

      // Wallet
      const wallet = tousWallets.find(w => w.user_email === email);
      const solde = wallet?.solde_disponible ?? 0;
      const previsionnel = wallet?.gains_previsionnels ?? 0;

      // Gains des 7 derniers jours
      const il_y_a_7j = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const gainsRecents = livrees.filter(m => {
        const d = m.updated_date || m.created_date;
        return d && new Date(d) >= il_y_a_7j;
      });
      const gainsRecentsTotal = gainsRecents.reduce((s, m) => s + (m.commission || 0), 0);
      const gainsTotal = livrees.reduce((s, m) => s + (m.commission || 0), 0);

      // Prochains vols
      const maintenant = new Date();
      const mesVoyages = tousVoyages
        .filter(v => v.voyageur_email === email && v.actif && new Date(v.date_vol) >= maintenant)
        .sort((a, b) => new Date(a.date_vol) - new Date(b.date_vol))
        .slice(0, 3);

      // Opportunités disponibles (missions sans voyageur)
      const opportunites = missionsDisponibles.slice(0, 5);

      // Construire le corps de l'email
      const lignesEnCours = enCours.length > 0
        ? enCours.map(m => `  • ${m.livre}${m.ville_destination ? ` → ${m.ville_destination}` : ''} (${m.statut === 'acceptee' ? 'à valider' : 'en cours'})`).join('\n')
        : '  Aucune mission en cours.';

      const lignesVols = mesVoyages.length > 0
        ? mesVoyages.map(v => {
            const d = new Date(v.date_vol).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' });
            return `  • ${v.depart_ville} → ${v.arrivee_ville} — ${d}`;
          }).join('\n')
        : '  Aucun vol programmé.';

      const lignesOpportunites = opportunites.length > 0
        ? opportunites.map(m => {
            const commission = m.commission ? ` (+${m.commission.toFixed(2)} €)` : '';
            return `  • "${m.livre}"${m.ville_destination ? ` → ${m.ville_destination}` : ''}${commission}`;
          }).join('\n')
        : '  Aucune nouvelle opportunité pour le moment.';

      const sujet = `📬 Votre récapitulatif Bordero — semaine du ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;

      const corps = `Bonjour ${prenom},

═══════════════════════════════════
  RÉCAPITULATIF HEBDOMADAIRE
  Bordero — Livraisons Voyageur
═══════════════════════════════════

✦ VOS GAINS
  Solde disponible  : ${solde.toFixed(2)} €
  Gains prévisionnels : ${previsionnel.toFixed(2)} €
  Total cumulé       : ${gainsTotal.toFixed(2)} €
  Cette semaine      : +${gainsRecentsTotal.toFixed(2)} €

✈ VOS PROCHAINS VOLS
${lignesVols}

📚 MISSIONS EN COURS
${lignesEnCours}

🔍 OPPORTUNITÉS DISPONIBLES
  Des livres attendent un voyageur — pourquoi pas vous ?
${lignesOpportunites}

─────────────────────────────────
Pour accepter une mission, connectez-vous à votre espace voyageur.
Merci de faire voyager les livres !

L'équipe Bordero
═══════════════════════════════════`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: sujet,
        body: corps,
        from_name: 'Bordero — Livraisons',
      });

      envoyes++;
      console.log(`[resumeHebdo] Email envoyé à ${email}`);
    }

    console.log(`[resumeHebdo] Terminé — ${envoyes} emails envoyés.`);
    return Response.json({ success: true, envoyes });

  } catch (error) {
    console.error('[resumeHebdo] Erreur:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});