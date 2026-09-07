import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAdmin } from '../../shared/adminAuth.ts';

// Envoie un rappel email aux voyageurs dont la date limite de livraison approche (J-3, J-1)
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAdmin(base44);
    if (auth.response) return auth.response;

    const payload = await req.json().catch(() => ({}));
    const dryRun = payload?.dry_run === true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Récupérer toutes les commandes en transit (pas encore livrées au relais ou au lecteur)
    const commandes = await base44.asServiceRole.entities.Commande.filter(
      { statut: 'en_transit' }, '-created_date', 200
    );

    let envois = 0;
    const erreurs = [];

    for (const cmd of commandes) {
      if (!cmd.date_limite_collecte || !cmd.voyageur_email) continue;

      const dateLimite = new Date(cmd.date_limite_collecte);
      dateLimite.setHours(0, 0, 0, 0);
      const diffJours = Math.round((dateLimite - today) / (1000 * 60 * 60 * 24));

      // Rappel à J-3 et J-1 avant la date limite
      if (diffJours !== 3 && diffJours !== 1) continue;

      const urgence = diffJours === 1 ? '🚨 URGENT — ' : '⚠️ Rappel — ';
      const jourTexte = diffJours === 1 ? 'demain' : 'dans 3 jours';

      try {
        if (!dryRun) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: cmd.voyageur_email,
            subject: `${urgence}Livraison "${cmd.livre_titre}" attendue ${jourTexte}`,
            body: `
Bonjour,

Vous avez accepté de transporter le livre suivant pour Bordero :

📚 ${cmd.livre_titre}${cmd.livre_auteur ? ` — ${cmd.livre_auteur}` : ''}
📍 Destination : ${cmd.zone_nom || '—'}
📦 Mode : ${cmd.mode_livraison === 'express' ? 'Express' : 'Collectif'}

⏰ Date limite de dépôt au relais : ${new Date(cmd.date_limite_collecte).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} (${jourTexte})

Après ce délai, des pénalités de retard (0,50 €/jour) s'appliqueront et seront déduites de votre commission.

Pour rappel, votre commission sera versée dès confirmation de la réception par le point relais.

Merci de votre ponctualité !

L'équipe Bordero
            `.trim(),
            from_name: 'Bordero · Rappel Livraison',
          });
        }
        envois++;
        console.log(`${dryRun ? 'Simulation' : 'Rappel'} J-${diffJours} pour ${cmd.voyageur_email} — "${cmd.livre_titre}"`);
      } catch (e) {
        erreurs.push({ commandeId: cmd.id, error: e.message });
        console.error(`Erreur envoi rappel pour commande ${cmd.id}:`, e.message);
      }
    }

    return Response.json({
      ok: true,
      dry_run: dryRun,
      commandes_scannees: commandes.length,
      rappels_envoyes: envois,
      erreurs,
    });
  } catch (error) {
    console.error('Erreur rappelVoyageurs:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}