import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function formatDate(dateValue) {
  if (!dateValue) return 'date inconnue';
  return new Date(dateValue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

function asList(items, mapper, emptyText) {
  if (!items.length) return `  ${emptyText}`;
  return items.map(mapper).join('\n');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const dryRun = payload?.dry_run === true;

    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [users, commandes, missions, relais] = await Promise.all([
      base44.asServiceRole.entities.User.list('-updated_date', 500),
      base44.asServiceRole.entities.Commande.list('-updated_date', 500),
      base44.asServiceRole.entities.MissionVoyageur.list('-updated_date', 500),
      base44.asServiceRole.entities.PointRelais.list('-updated_date', 300),
    ]);

    const destinataires = users.filter(u => ['admin', 'admin_secondaire'].includes(u.role) && u.email);
    const nouvellesCommandes = commandes.filter(c => c.created_date && new Date(c.created_date) >= since);
    const livraisonsActives = commandes.filter(c => ['payee', 'en_transit', 'au_relais', 'litige'].includes(c.statut));
    const livraisonsSemaine = commandes.filter(c => c.updated_date && new Date(c.updated_date) >= since && ['en_transit', 'au_relais', 'livree', 'litige'].includes(c.statut));
    const relaisEnAttente = relais.filter(r => r.validation_admin === 'en_attente');
    const envoisPrioritaires = commandes.filter(c => c.statut === 'payee' || !c.voyageur_email || c.validation_admin === 'en_attente').slice(0, 10);
    const missionsDisponibles = missions.filter(m => m.statut === 'disponible').slice(0, 8);
    const revenuSemaine = nouvellesCommandes.reduce((sum, c) => sum + (c.montant_paye || 0), 0);

    const lignesCommandes = asList(
      nouvellesCommandes.slice(0, 10),
      c => `  • ${c.livre_titre || 'Livre'} — ${c.zone_nom || 'zone ?'} — ${c.montant_paye ? `${c.montant_paye.toFixed(2)} €` : 'montant ?'}`,
      'Aucune nouvelle commande cette semaine.'
    );
    const lignesLivraisons = asList(
      livraisonsSemaine.slice(0, 10),
      c => `  • ${c.livre_titre || 'Livre'} — ${c.statut?.replace(/_/g, ' ')} — lecteur ${c.lecteur_email || '?'}`,
      'Aucune livraison mise à jour cette semaine.'
    );
    const lignesRelais = asList(
      relaisEnAttente.slice(0, 10),
      r => `  • ${r.nom || 'Relais'} — ${r.ville || 'ville ?'} — gérant ${r.gerant_email || '?'}`,
      'Aucune demande Point Relais en attente.'
    );
    const lignesPriorites = asList(
      envoisPrioritaires,
      c => `  • ${c.livre_titre || 'Livre'} — ${c.zone_nom || 'zone ?'} — ${!c.voyageur_email ? 'voyageur à assigner' : 'à surveiller'}`,
      'Aucun envoi prioritaire identifié.'
    );
    const lignesMissions = asList(
      missionsDisponibles,
      m => `  • ${m.livre || 'Livre'} → ${m.ville_destination || 'destination ?'}${m.commission ? ` (+${m.commission.toFixed(2)} €)` : ''}`,
      'Aucune mission disponible.'
    );

    const subject = `Rapport hebdomadaire Bordero — ${formatDate(since)} au ${formatDate(new Date())}`;
    const body = `Bonjour,

Voici le rapport hebdomadaire Bordero pour l'administrateur et l'Agent Bordeur.

═══════════════════════════════════
SYNTHÈSE
═══════════════════════════════════
• Nouvelles commandes : ${nouvellesCommandes.length}
• Revenu commandes semaine : ${revenuSemaine.toFixed(2)} €
• Livraisons actives : ${livraisonsActives.length}
• Points relais en attente : ${relaisEnAttente.length}
• Envois prioritaires : ${envoisPrioritaires.length}

NOUVELLES COMMANDES
${lignesCommandes}

ACTIVITÉS DE LIVRAISON
${lignesLivraisons}

POINTS RELAIS À SURVEILLER
${lignesRelais}

ENVOIS À FAIRE EN PRIORITÉ
${lignesPriorites}

MISSIONS DISPONIBLES
${lignesMissions}

Note : l'Agent Bordeur reçoit ce rapport en lecture/supervision. La validation des Points Relais reste réservée à l'administrateur principal.

L'équipe Bordero`;

    if (!dryRun) {
      for (const destinataire of destinataires) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: destinataire.email,
          subject,
          body,
          from_name: 'Bordero — Rapport Admin',
        });
      }
    }

    return Response.json({
      success: true,
      dry_run: dryRun,
      destinataires: destinataires.map(d => ({ email: d.email, role: d.role })),
      stats: {
        nouvelles_commandes: nouvellesCommandes.length,
        livraisons_actives: livraisonsActives.length,
        points_relais_en_attente: relaisEnAttente.length,
        envois_prioritaires: envoisPrioritaires.length,
        revenu_semaine: revenuSemaine,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}