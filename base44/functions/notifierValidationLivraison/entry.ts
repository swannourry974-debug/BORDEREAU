import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAdmin } from '../../shared/adminAuth.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAdmin(base44);
    if (auth.response) return auth.response;

    const { commandeId } = await req.json().catch(() => ({}));
    if (!commandeId) return Response.json({ error: 'Commande requise' }, { status: 400 });

    const commande = await base44.asServiceRole.entities.Commande.get(String(commandeId)).catch(() => null);
    if (!commande) return Response.json({ error: 'Commande introuvable' }, { status: 404 });
    if (commande.validation_admin !== 'validee') return Response.json({ skipped: true, raison: 'Commande non validee' });
    if (!commande.lecteur_email) return Response.json({ skipped: true, raison: 'Pas de lecteur_email' });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: commande.lecteur_email,
      subject: `✅ Votre livre "${commande.livre_titre}" est en route !`,
      body: `Bonjour,\n\nBonne nouvelle ! L'achat de votre livre "${commande.livre_titre}" a été validé par notre équipe.\n\nVotre voyageur est maintenant engagé et transportera votre livre vers ${commande.zone_nom}.\n\nVous pouvez suivre l'état de votre commande dans votre espace Bordero.\n\nMerci de votre confiance,\nL'équipe Bordero`,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}