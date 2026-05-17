import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Fonction appelée dès qu'un livre passe au statut "au_relais".
 * Envoie un email d'alerte urgent au lecteur et enregistre la date d'arrivée.
 * Déclenchée par une automation Entity sur Commande (statut → au_relais).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const commande = payload.data;

    if (!commande || commande.statut !== 'au_relais') {
      return Response.json({ skipped: true, raison: 'Statut non au_relais' });
    }

    // Enregistrer la date d'arrivée si pas encore définie
    if (!commande.date_arrivee_relais) {
      await base44.asServiceRole.entities.Commande.update(commande.id, {
        date_arrivee_relais: new Date().toISOString(),
        date_limite_collecte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    }

    if (!commande.lecteur_email) {
      console.log('Pas d\'email lecteur pour commande', commande.id);
      return Response.json({ skipped: true, raison: 'Pas de lecteur_email' });
    }

    // Email ultra-pressant au lecteur
    const dateLimite = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: commande.lecteur_email,
      from_name: 'Bordereau — Alerte Arrivée',
      subject: `📦 Votre livre est arrivé ! Récupérez-le sous 48h — ${commande.livre_titre}`,
      body: `Bonjour,

🎉 Votre livre est arrivé à votre point relais !

📖 ${commande.livre_titre}${commande.livre_auteur ? ` — ${commande.livre_auteur}` : ''}

⚠️ IMPORTANT : Merci de le récupérer sous 48h pour libérer de l'espace chez votre commerçant.

📅 Date limite sans pénalité : ${dateLimite}
💸 Passé ce délai de 7 jours : 0,50 € de pénalité par jour supplémentaire, reversée directement au commerçant.

Présentez simplement votre email ou le bordereau imprimé au commerçant.

— L'équipe Bordereau`.trim(),
    });

    console.log(`Alerte arrivée envoyée à ${commande.lecteur_email} pour "${commande.livre_titre}"`);
    return Response.json({ success: true, lecteur: commande.lecteur_email });

  } catch (error) {
    console.error('Erreur alerterLecteurArrivee:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});