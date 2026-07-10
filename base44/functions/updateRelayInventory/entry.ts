import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const updates = {};

    if (typeof payload.stock_actuel === 'number' && Number.isFinite(payload.stock_actuel)) {
      updates.stock_actuel = Math.max(0, Math.floor(payload.stock_actuel));
    }
    if (typeof payload.actif === 'boolean') {
      updates.actif = payload.actif;
    }

    let relais = null;
    const existing = await base44.asServiceRole.entities.PointRelais.filter({ gerant_email: user.email }, '-created_date', 1);

    if (existing[0]) {
      relais = existing[0];
      if (Object.keys(updates).length > 0) {
        relais = await base44.asServiceRole.entities.PointRelais.update(relais.id, updates);
      }
    } else {
      relais = await base44.asServiceRole.entities.PointRelais.create({
        nom: user.full_name ? `Relais ${user.full_name}` : 'Relais Bordero',
        ville: 'À configurer',
        pays_code: 'FR',
        gerant_email: user.email,
        stock_actuel: updates.stock_actuel ?? 0,
        actif: updates.actif ?? true,
      });
    }

    if (payload.notify === true) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: 'Mise à jour du stock relais',
        body: `Votre inventaire relais a été mis à jour : ${relais.stock_actuel ?? 0} colis enregistrés. Statut du relais : ${relais.actif !== false ? 'actif' : 'inactif'}.`,
      });
    }

    return Response.json({ success: true, relais });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});