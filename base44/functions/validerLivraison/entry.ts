import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const commandeId = String(body.commandeId || '');
    const missionId = body.missionId ? String(body.missionId) : '';
    const code = String(body.code || '');

    if (!commandeId || !/^\d{3}$/.test(code)) {
      return Response.json({ error: 'Code invalide.' }, { status: 400 });
    }

    const commande = await base44.asServiceRole.entities.Commande.get(commandeId);
    if (!commande) {
      return Response.json({ error: 'Commande introuvable.' }, { status: 404 });
    }

    if (user.role !== 'admin' && commande.voyageur_email !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (String(commande.code_secret || '') !== code) {
      return Response.json({ error: 'Code incorrect. Vérifiez avec le lecteur.' }, { status: 400 });
    }

    await base44.asServiceRole.entities.Commande.update(commande.id, { statut: 'livree' });

    const linkedMissionId = missionId || commande.mission_id || '';
    if (linkedMissionId) {
      const mission = await base44.asServiceRole.entities.MissionVoyageur.get(linkedMissionId).catch(() => null);
      if (mission && (user.role === 'admin' || mission.voyageur_email === user.email)) {
        await base44.asServiceRole.entities.MissionVoyageur.update(mission.id, { statut: 'livree' });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});