import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { escapeHtml } from '../../shared/html.ts';

function formatDate(value) {
  if (!value) return 'date inconnue';
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysSince(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
}

function listLines(items, mapper, emptyText) {
  if (!items.length) return `  ${emptyText}`;
  return items.map(mapper).join('\n');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const dryRun = payload?.dry_run === true;

    const user = await base44.auth.me().catch(() => null);
    if (!user || !['admin', 'admin_secondaire'].includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [users, commandes, relais] = await Promise.all([
      base44.asServiceRole.entities.User.list('-updated_date', 500),
      base44.asServiceRole.entities.Commande.list('-updated_date', 500),
      base44.asServiceRole.entities.PointRelais.list('-updated_date', 300),
    ]);

    const destinataires = users.filter(u => ['admin', 'admin_secondaire'].includes(u.role) && u.email);
    const relaisById = new Map((relais || []).map(r => [r.id, r]));
    const commandesAuRelais = (commandes || []).filter(c => c.statut === 'au_relais');
    const alertesTroisJours = commandesAuRelais.filter(c => daysSince(c.date_arrivee_relais || c.updated_date || c.created_date) !== null && daysSince(c.date_arrivee_relais || c.updated_date || c.created_date) > 3);
    const litiges = (commandes || []).filter(c => c.statut === 'litige' || c.admin_notes || c.validation_admin === 'rejetee');

    const lignesAlertes = listLines(
      alertesTroisJours,
      c => {
        const relaisInfo = relaisById.get(c.point_relais_id);
        const attente = daysSince(c.date_arrivee_relais || c.updated_date || c.created_date);
        return `  • ${escapeHtml(c.livre_titre || 'Livre')} — ${escapeHtml(c.zone_nom || 'zone ?')} — ${escapeHtml(relaisInfo?.nom || 'relais ?')} — attente ${attente} jours — lecteur ${escapeHtml(c.lecteur_email || '?')}`;
      },
      'Aucun colis en attente depuis plus de 3 jours en point relais.'
    );

    const lignesLitiges = listLines(
      litiges.slice(0, 20),
      c => `  • ${escapeHtml(c.livre_titre || 'Livre')} — ${escapeHtml(c.zone_nom || 'zone ?')} — statut ${escapeHtml(c.statut || '?')} — ${escapeHtml(c.admin_notes || 'à vérifier')}`,
      'Aucun litige en cours.'
    );

    const subject = `Alerte quotidienne Bordero — ${alertesTroisJours.length} colis à surveiller`;
    const body = `Bonjour,

Voici le récapitulatif quotidien des alertes et litiges Bordero du ${formatDate(new Date())}.

═══════════════════════════════════
ALERTES POINTS RELAIS +3 JOURS
═══════════════════════════════════
${lignesAlertes}

LITIGES EN COURS
${lignesLitiges}

SYNTHÈSE
• Colis en attente en point relais : ${commandesAuRelais.length}
• Alertes au-delà de 3 jours : ${alertesTroisJours.length}
• Litiges ouverts : ${litiges.length}

L'équipe Bordero`;

    if (!dryRun) {
      for (const destinataire of destinataires) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: destinataire.email,
          subject,
          body,
          from_name: 'Bordero — Alertes Admin',
        });
      }
    }

    return Response.json({
      success: true,
      dry_run: dryRun,
      destinataires: destinataires.map(d => ({ email: d.email, role: d.role })),
      stats: {
        colis_au_relais: commandesAuRelais.length,
        alertes_plus_3_jours: alertesTroisJours.length,
        litiges_en_cours: litiges.length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}