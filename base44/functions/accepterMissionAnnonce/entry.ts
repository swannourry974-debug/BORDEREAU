import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

function rows(page) {
  return page?.items || page || [];
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const missionId = String(body.mission_id || body.missionId || '').trim();
    if (!missionId) return Response.json({ error: 'mission_id requis' }, { status: 400 });

    const mission = await base44.asServiceRole.entities.MissionVoyageur.get(missionId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!mission) return Response.json({ error: 'Annonce introuvable' }, { status: 404 });
    if (mission.mode_livraison !== 'express' || mission.statut !== 'disponible') {
      return Response.json({ error: 'Annonce indisponible', statut: mission.statut }, { status: 409 });
    }

    const voyages = rows(await base44.asServiceRole.entities.Voyage.filter({ voyageur_email: user.email }, '-updated_date', 20).catch(() => []));
    const voyageActif = voyages.find(voyage => voyage.actif && voyage.validation_admin === 'valide');
    if (!voyageActif && user.role !== 'admin') {
      return Response.json({ error: 'Vol voyageur validé requis' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const rang = Number(body.numero_ordre || mission.numero_ordre || 1);
    const commission = Number(body.commission || mission.commission || 0);
    const updatedMission = await base44.asServiceRole.entities.MissionVoyageur.update(mission.id, {
      voyageur_email: user.email,
      statut: 'engagee',
      numero_ordre: rang,
      commission,
      acceptee_at: now,
      trajet_label: voyageActif ? `${voyageActif.depart_ville || 'Départ'} → ${voyageActif.arrivee_ville || mission.ville_destination || 'Destination'}` : mission.ville_destination || 'Destination',
      depart_ville: voyageActif?.depart_ville || '',
    });

    if (mission.commande_id) {
      const commande = await base44.asServiceRole.entities.Commande.get(mission.commande_id).catch(() => null);
      if (commande) {
        await base44.asServiceRole.entities.Commande.update(commande.id, {
          statut: 'en_preparation',
          voyageur_email: user.email,
          mission_id: mission.id,
        });
        if (commande.lecteur_email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: commande.lecteur_email,
            from_name: 'Bordero — Missions',
            subject: `Mission prise — ${commande.livre_titre || mission.livre || 'Votre livre'}`,
            body: `Bonne nouvelle, votre annonce anonyme a été prise par un voyageur validé.\n\n📖 Livre : ${mission.livre || commande.livre_titre || '—'}\n🌍 Destination : ${mission.ville_destination || commande.zone_nom || '—'}\n🏷️ Relais : ${mission.point_relais_nom || commande.point_relais_nom || '—'}\n\nAucune donnée personnelle n’a été publiée dans l’annonce.`,
            category: 'transactional',
          }).catch(() => null);
        }
      }
    }

    return Response.json({ success: true, mission: updatedMission });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}