import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { relaisId } = await req.json().catch(() => ({}));
    if (!relaisId) return Response.json({ error: 'Relais requis' }, { status: 400 });

    const relais = await base44.entities.PointRelais.get(String(relaisId)).catch(() => null);
    if (!relais || relais.gerant_email !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const relaisValides = await base44.asServiceRole.entities.PointRelais.filter({ validation_admin: 'valide', actif: true }, '-updated_date', 200);
    const notifications = [
      base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: 'Créer votre mot de passe Point Relais Bordero',
        body: `Bonjour,\n\nVotre demande Point Relais Bordero a bien été reçue.\n\nPour créer ou réinitialiser votre mot de passe, ouvrez l’écran sécurisé de connexion Bordero puis utilisez votre adresse ${user.email}.\n\nVotre accès scanner, stock et profils relais sera ouvert après validation administrateur.\n\nL’équipe Bordero`,
      }),
      ...relaisValides
        .filter(r => r.gerant_email && r.gerant_email !== user.email)
        .map(r => base44.asServiceRole.integrations.Core.SendEmail({
          to: r.gerant_email,
          subject: 'Nouvelle demande Point Relais Bordero',
          body: `Bonjour,\n\nUne nouvelle demande Point Relais vient d’être envoyée sur Bordero.\n\nCommerce : ${relais.nom}\nVille : ${relais.ville}\nPays : ${relais.pays_nom}\n\nCette demande reste soumise à validation administrateur avant ouverture des accès scanner, stock et profils relais.\n\nL’équipe Bordero`,
        }))
    ];

    const results = await Promise.allSettled(notifications);
    return Response.json({ success: true, sent: results.filter(r => r.status === 'fulfilled').length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}