import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAdmin } from '../../shared/adminAuth.ts';
import { escapeHtml } from '../../shared/html.ts';

const GENERIC_STATUS_MESSAGES = {
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

const COLLECTE_STATUS_MESSAGES = {
  payee: {
    subject: 'Collecte Bordero confirmée',
    title: 'Votre livre entre dans la Collecte Bordero',
    detail: 'Votre commande est confirmée. Bordero va la regrouper avec les autres livres destinés au même point relais.',
  },
  en_preparation: {
    subject: 'Votre livre est dans une malle Collecte',
    title: 'Malle Collecte en préparation',
    detail: 'Votre livre est rattaché à une malle Bordero. Elle se remplit jusqu’à 20 kg avant son acheminement.',
  },
  en_transit: {
    subject: 'Votre malle Collecte est en route',
    title: 'Acheminement Bordero lancé',
    detail: 'La malle Collecte contenant votre livre a quitté la préparation et se dirige vers le point relais.',
  },
  au_relais: {
    subject: 'Votre livre Collecte est disponible au relais',
    title: 'Disponible au point relais',
    detail: 'La malle Collecte est arrivée. Votre livre peut être récupéré au point relais indiqué.',
  },
  livree: {
    subject: 'Retrait Collecte confirmé',
    title: 'Livre remis',
    detail: 'Votre livre Collecte a bien été remis. Merci d’avoir utilisé Bordero.',
  },
};

function buildCollecteDetails(commande) {
  return [
    commande.malle_id ? `📦 Malle Collecte : ${escapeHtml(commande.malle_id)}` : '',
    commande.transporteur_assigne ? `🚚 Transporteur : ${escapeHtml(commande.transporteur_assigne)}` : '',
    commande.reference_suivi_collecte ? `🔎 Suivi : ${escapeHtml(commande.reference_suivi_collecte)}` : '',
    commande.visuel_bordero_serie ? `🎟️ Visuel Bordero : ${escapeHtml(commande.visuel_bordero_serie)}` : '',
  ].filter(Boolean).join('\n');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAdmin(base44);
    if (auth.response) return auth.response;

    const payload = await req.json();
    const commande = payload.data;
    const oldCommande = payload.old_data;
    const isCollecte = commande?.mode_livraison === 'collectif';
    const messages = isCollecte ? COLLECTE_STATUS_MESSAGES : GENERIC_STATUS_MESSAGES;

    if (!commande || !messages[commande.statut]) {
      return Response.json({ skipped: true, raison: 'Statut non suivi' });
    }
    if (oldCommande?.statut === commande.statut) {
      return Response.json({ skipped: true, raison: 'Statut inchangé' });
    }

    if (!isCollecte && commande.suivi_facturation_mode !== 'email') {
      return Response.json({ success: true, canal: 'application', statut: commande.statut });
    }
    if (!commande.lecteur_email) {
      return Response.json({ skipped: true, raison: 'Pas de lecteur_email' });
    }

    const message = messages[commande.statut];
    const factureReference = escapeHtml(commande.facture_reference || commande.id);
    const collecteDetails = isCollecte ? buildCollecteDetails(commande) : '';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: commande.lecteur_email,
      from_name: 'Bordero — Suivi de commande',
      subject: `${message.subject} — ${commande.livre_titre || 'Votre livre'}`,
      body: `Bonjour,

${message.title}

${message.detail}

📖 Livre : ${escapeHtml(commande.livre_titre || '—')}${commande.livre_auteur ? ` — ${escapeHtml(commande.livre_auteur)}` : ''}
🌍 Destination : ${escapeHtml(commande.zone_nom || '—')}
💶 Total facture : ${Number(commande.montant_paye || 0).toFixed(2)} €
🧾 Référence facture : ${factureReference}${collecteDetails ? `\n${collecteDetails}` : ''}

${isCollecte ? 'Vous recevrez un email à chaque étape clé de la Collecte Bordero.' : 'La facture et le suivi sont activés pour cette commande.'}

— L'équipe Bordero`.trim(),
    });

    return Response.json({ success: true, canal: 'email', mode: commande.mode_livraison, statut: commande.statut, lecteur: commande.lecteur_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}