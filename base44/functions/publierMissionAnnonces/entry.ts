import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { ensureMissionAnnouncementsForCommande } from '../../shared/missionAnnouncements.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const commandeId = String(body.commande_id || body.commandeId || '').trim();
    if (!commandeId) return Response.json({ error: 'commande_id requis' }, { status: 400 });

    const commande = await base44.asServiceRole.entities.Commande.get(commandeId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!commande) return Response.json({ error: 'Commande introuvable' }, { status: 404 });

    const result = await ensureMissionAnnouncementsForCommande(base44, commande, {
      notifyReader: body.notify_reader !== false,
      notifyTravelers: body.notify_travelers !== false,
    });
    return Response.json({ success: true, commande_id: commande.id, ...result, anonymous: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}