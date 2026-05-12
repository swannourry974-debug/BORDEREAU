import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    // Récupérer la commande concernée
    const commande = data;
    if (!commande) {
      return Response.json({ error: 'Commande introuvable dans le payload' }, { status: 400 });
    }

    // On notifie uniquement si la commande est payée ou en transit
    const statutsConcernes = ['payee', 'en_transit', 'au_relais'];
    if (!statutsConcernes.includes(commande.statut)) {
      return Response.json({ skipped: true, raison: 'Statut non concerné' });
    }

    // Trouver le point relais associé
    let relaisEmail = null;
    let relaisNom = 'Point Relais';

    if (commande.point_relais_id) {
      const relaisList = await base44.asServiceRole.entities.PointRelais.filter({ id: commande.point_relais_id });
      const relais = relaisList[0];
      if (relais) {
        relaisEmail = relais.gerant_email;
        relaisNom = relais.nom;
      }
    }

    if (!relaisEmail) {
      console.log('Aucun email de relais trouvé pour la commande', commande.id);
      return Response.json({ skipped: true, raison: 'Pas de relais email' });
    }

    // Construire le message selon le statut
    let sujet = '';
    let corps = '';

    if (commande.statut === 'payee' || commande.statut === 'en_transit') {
      sujet = `📚 Nouveau livre en route — ${commande.livre_titre}`;
      corps = `
Bonjour ${relaisNom},

Un nouveau livre est en attente de dépôt dans votre point relais.

📖 Titre : ${commande.livre_titre || '—'}
✍️ Auteur : ${commande.livre_auteur || '—'}
👤 Lecteur : ${commande.lecteur_email || '—'}
🚚 Mode : ${commande.mode_livraison === 'express' ? 'Express' : 'Collectif'}

Veuillez vous préparer à réceptionner ce colis prochainement.

— L'équipe Bordereau
      `.trim();
    } else if (commande.statut === 'au_relais') {
      sujet = `📦 Livre disponible au retrait — ${commande.livre_titre}`;
      corps = `
Bonjour ${relaisNom},

Le livre suivant est désormais disponible au retrait dans votre point relais.

📖 Titre : ${commande.livre_titre || '—'}
✍️ Auteur : ${commande.livre_auteur || '—'}
👤 Lecteur : ${commande.lecteur_email || '—'}
${commande.date_limite_collecte ? `📅 Date limite de retrait : ${commande.date_limite_collecte}` : ''}

Merci de prévenir le lecteur si ce n'est pas déjà fait.

— L'équipe Bordereau
      `.trim();
    }

    // Envoyer l'email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: relaisEmail,
      subject: sujet,
      body: corps,
      from_name: 'Bordereau',
    });

    console.log(`Notification envoyée à ${relaisEmail} pour commande ${commande.id} (statut: ${commande.statut})`);
    return Response.json({ success: true, destinataire: relaisEmail });

  } catch (error) {
    console.error('Erreur notifierRelais:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});