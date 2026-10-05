import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { groupAllEligibleCollecte, groupRelayCollecte } from '../../shared/collecteBatching.ts';
import { requireAdmin } from '../../shared/adminAuth.ts';

export default async function(req) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const { response } = await requireAdmin(base44);
    if (response) return response;

    const payload = await req.json().catch(() => ({}));
    const commandeId = payload?.commande_id || payload?.commandeId || '';
    const pointRelaisId = payload?.point_relais_id || payload?.pointRelaisId || '';

    if (commandeId) {
      const commande = await base44.asServiceRole.entities.Commande.get(commandeId);
      if (!commande) return Response.json({ error: 'Commande introuvable' }, { status: 404 });
      if (commande.mode_livraison !== 'collectif' || commande.statut !== 'payee' || !commande.point_relais_id) {
        return Response.json({ ok: true, skipped: true, reason: 'Commande non éligible Collecte payée avec relais' });
      }
      const result = await groupRelayCollecte(base44, commande.point_relais_id);
      return Response.json({ ok: true, result });
    }

    if (pointRelaisId) {
      const result = await groupRelayCollecte(base44, pointRelaisId);
      return Response.json({ ok: true, result });
    }

    const results = await groupAllEligibleCollecte(base44);
    return Response.json({ ok: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}