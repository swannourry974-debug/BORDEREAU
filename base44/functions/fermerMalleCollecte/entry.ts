import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const WEIGHTS = { S: 0.22, M: 0.56, L: 0.92 };

function resolveFormat(order) {
  if (order.format_livre_bordero) return order.format_livre_bordero;
  if (order.livre_type === 'Poche') return 'S';
  if (order.livre_type === 'BD' || order.livre_type === 'Relié') return 'L';
  return 'M';
}

export default async function(req) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const payload = await req.json();
    const malleId = payload?.malleId;
    if (!malleId) return Response.json({ error: 'malleId is required' }, { status: 400 });

    const malle = await base44.asServiceRole.entities.MalleCollecte.get(malleId);
    if (!malle) return Response.json({ error: 'Malle not found' }, { status: 404 });

    const commandes = await base44.asServiceRole.entities.Commande.filter({
      malle_id: malleId,
      mode_livraison: 'collectif'
    }, '-created_date', 500);

    const visuels = await base44.asServiceRole.entities.VisuelBordero.filter({ actif: true }, 'serie', 500);
    const visuelsBySize = visuels.reduce((acc, item) => {
      const key = item.taille || 'M';
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});

    const counters = { S: 0, M: 0, L: 0 };
    const updates = commandes.map((commande) => {
      const format = resolveFormat(commande);
      const pool = visuelsBySize[format] || [];
      const visuel = pool.length ? pool[counters[format] % pool.length] : null;
      counters[format] += 1;
      return {
        id: commande.id,
        statut: 'en_preparation',
        format_livre_bordero: format,
        visuel_bordero_id: visuel?.id || commande.visuel_bordero_id || '',
        visuel_bordero_url: visuel?.image_url || commande.visuel_bordero_url || '',
        visuel_bordero_serie: visuel?.serie || commande.visuel_bordero_serie || '',
        transporteur_assigne: malle.transporteur_assigne || '',
        reference_suivi_collecte: malle.reference_suivi || ''
      };
    });

    if (updates.length) {
      await base44.asServiceRole.entities.Commande.bulkUpdate(updates);
    }

    const poids = commandes.reduce((sum, commande) => sum + (WEIGHTS[resolveFormat(commande)] || 0.56), 0);
    const now = new Date().toISOString();
    const updatedMalle = await base44.asServiceRole.entities.MalleCollecte.update(malleId, {
      statut: 'en_preparation',
      date_fermeture: malle.date_fermeture || now,
      poids_actuel_kg: Math.round(poids * 100) / 100,
      nombre_commandes: commandes.length
    });

    return Response.json({ ok: true, malle: updatedMalle, commandes: commandes.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}