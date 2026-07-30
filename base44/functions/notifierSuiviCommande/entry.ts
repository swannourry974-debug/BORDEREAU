import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requireAdmin } from '../../shared/adminAuth.ts';

const STATUS_MESSAGES = {
  payee: {
    subject: 'Commande confirmée — suivi et facture activés',
    title: 'Votre commande est en préparation',
    detail: 'La facture est générée et le suivi de votre livre est maintenant actif.',
  },
  en_transit: {
    subject: 'Votre livre est en cours d’acheminement',
    title: 'Expédié / En cours d’acheminement',
    detail: 'Votre livre a quitté son point de départ et poursuit son trajet vers le relais.',
  },
  au_relais: {
    subject: 'Votre livre est disponible en point relais',
    title: 'Disponible en point relais',
    detail: 'Votre livre est arrivé : vous pouvez le récupérer au point relais indiqué.',
  },
  livree: {
    subject: 'Livraison confirmée',
    title: 'Livre livré',
    detail: 'Votre livre a bien été remis. Merci d’avoir utilisé Bordero.',
  },
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAdmin(base44);
    if (auth.response) return auth.response;

    const payload = await req.json();
    const commande = payload.data;
    const oldCommande = payload.old_data;

    if (!commande || !STATUS_MESSAGES[commande.statut]) {
      return Response.json({ skipped: true, raison: 'Statut non suivi' });
    }
    if (oldCommande?.statut === commande.statut) {
      return Response.json({ skipped: true, raison: 'Statut inchangé' });
    }

    if (commande.suivi_facturation_mode !== 'email') {
      return Response.json({ success: true, canal: 'application', statut: commande.statut });
    }
    if (!commande.lecteur_email) {
      return Response.json({ skipped: true, raison: 'Pas de lecteur_email' });
    }

    const message = STATUS_MESSAGES[commande.statut];
    const factureReference = commande.facture_reference || commande.id;
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: commande.lecteur_email,
      from_name: 'Bordero — Suivi de commande',
      subject: `${message.subject} — ${commande.livre_titre || 'Votre livre'}`,
      body: `Bonjour,

${message.title}

${message.detail}

📖 Livre : ${commande.livre_titre || '—'}${commande.livre_auteur ? ` — ${commande.livre_auteur}` : ''}
🌍 Destination : ${commande.zone_nom || '—'}
💶 Total facture : ${Number(commande.montant_paye || 0).toFixed(2)} €
🧾 Référence facture : ${factureReference}

La facture et le suivi sont activés pour cette commande.

— L'équipe Bordero`.trim(),
    });

    return Response.json({ success: true, canal: 'email', statut: commande.statut, lecteur: commande.lecteur_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}