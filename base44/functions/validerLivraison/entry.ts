import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

function parseAttemptState(value = '') {
  const attempts = Number(String(value).match(/livraison_code_echecs:(\d+)/)?.[1] || 0);
  const lockedUntil = String(value).match(/verrouille_jusqua:([^;]+)/)?.[1] || '';
  return { attempts: Number.isFinite(attempts) ? attempts : 0, lockedUntil };
}

function buildAttemptState(attempts, lockedUntil = '') {
  return `livraison_code_echecs:${attempts};verrouille_jusqua:${lockedUntil}`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const commandeId = String(body.commandeId || '');
    const missionId = body.missionId ? String(body.missionId) : '';
    const code = String(body.code || '').trim().toUpperCase();

    if (!commandeId || !/^[A-Z0-9]{6}$/.test(code)) {
      return Response.json({ error: 'Code invalide.' }, { status: 400 });
    }

    const commande = await base44.asServiceRole.entities.Commande.get(commandeId).catch(() => null);
    if (!commande) return Response.json({ error: 'Commande introuvable.' }, { status: 404 });

    if (user.role !== 'admin' && commande.voyageur_email !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const attemptState = parseAttemptState(commande.alerte_securite_bordero);
    if (attemptState.lockedUntil && new Date(attemptState.lockedUntil) > new Date()) {
      return Response.json({ error: 'Validation temporairement verrouillée. Réessayez plus tard.' }, { status: 429 });
    }

    if (String(commande.code_secret || '').toUpperCase() !== code) {
      const attempts = attemptState.attempts + 1;
      const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : '';
      await base44.asServiceRole.entities.Commande.update(commande.id, {
        alerte_securite_bordero: buildAttemptState(attempts, lockedUntil),
        derniere_alerte_securite: new Date().toISOString(),
      });
      return Response.json({ error: lockedUntil ? 'Trop de tentatives. Validation verrouillée 15 minutes.' : 'Code incorrect. Vérifiez avec le lecteur.' }, { status: lockedUntil ? 429 : 400 });
    }

    await base44.asServiceRole.entities.Commande.update(commande.id, {
      statut: 'livree',
      alerte_securite_bordero: '',
      derniere_alerte_securite: new Date().toISOString(),
    });

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
}