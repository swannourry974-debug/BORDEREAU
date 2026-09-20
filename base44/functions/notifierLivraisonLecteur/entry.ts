import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAdmin } from '../../shared/adminAuth.ts';
import { escapeHtml } from '../../shared/html.ts';

/**
 * Déclenché par automation Entity sur Commande quand statut passe à "livree".
 * Envoie un email de confirmation de livraison au lecteur.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAdmin(base44);
    if (auth.response) return auth.response;

    const payload = await req.json().catch(() => ({}));
    const event = payload.event || {};

    if (event.entity_name !== 'Commande' || event.type !== 'update') {
      return Response.json({ skipped: true, raison: 'Evenement non concerne' });
    }

    if (!event.entity_id) {
      return Response.json({ skipped: true, raison: 'Commande non identifiee' });
    }

    const commande = await base44.asServiceRole.entities.Commande.get(event.entity_id).catch(() => null);

    if (!commande || commande.statut !== 'livree') {
      return Response.json({ skipped: true, raison: 'Statut non livree' });
    }

    if (commande.notification_lecteur_envoyee) {
      return Response.json({ skipped: true, raison: 'Notification deja envoyee' });
    }

    if (!commande.lecteur_email) {
      console.log('Pas d\'email lecteur pour commande', commande.id);
      return Response.json({ skipped: true, raison: 'Pas de lecteur_email' });
    }

    const dateJour = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: commande.lecteur_email,
      from_name: 'Bordero — Livraison Confirmée',
      subject: `🎉 Livraison confirmée — ${commande.livre_titre}`,
      body: `Bonjour,

Votre livre a bien été remis entre vos mains ! Nous espérons que la lecture sera au rendez-vous. ✨

📖 ${escapeHtml(commande.livre_titre || 'Livre')}${commande.livre_auteur ? ` — ${escapeHtml(commande.livre_auteur)}` : ''}
📅 Remis le : ${dateJour}
🌍 Destination : ${escapeHtml(commande.zone_nom || '—')}

Merci d'avoir fait confiance à Bordero pour voyager avec vos livres.

Si vous êtes satisfait(e) de la livraison, n'oubliez pas de noter votre voyageur directement depuis votre profil — cela les encourage à continuer !

— L'équipe Bordero`.trim(),
    });

    await base44.asServiceRole.entities.Commande.update(commande.id, {
      notification_lecteur_envoyee: true,
    });

    console.log(`Notification livraison envoyée à ${commande.lecteur_email} pour "${commande.livre_titre}"`);
    return Response.json({ success: true, lecteur: commande.lecteur_email });

  } catch (error) {
    console.error('Erreur notifierLivraisonLecteur:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}