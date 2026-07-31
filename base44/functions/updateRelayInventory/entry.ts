import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const relais = (await base44.asServiceRole.entities.PointRelais.filter({ gerant_email: user.email }, '-created_date', 1))[0];

    const validated = user.role === 'admin' || (user.relais_valide === true && user.relais_validation_status === 'valide');
    const relaisValidated = relais && relais.actif === true && relais.validation_admin === 'valide';
    if (!validated || !relaisValidated) {
      return Response.json({ error: 'Relais non validé par l’administrateur' }, { status: 403 });
    }

    const updates = {};
    if (typeof payload.stock_actuel === 'number' && Number.isFinite(payload.stock_actuel)) {
      updates.stock_actuel = Math.max(0, Math.floor(payload.stock_actuel));
    }
    if (user.role === 'admin' && typeof payload.actif === 'boolean') {
      updates.actif = payload.actif;
    }

    const updatedRelais = Object.keys(updates).length > 0
      ? await base44.asServiceRole.entities.PointRelais.update(relais.id, updates)
      : relais;

    if (payload.notify === true) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: 'Mise à jour du stock relais',
        body: `Votre inventaire relais a été mis à jour : ${updatedRelais.stock_actuel ?? 0} colis enregistrés.`,
      });
    }

    return Response.json({ success: true, relais: updatedRelais });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}