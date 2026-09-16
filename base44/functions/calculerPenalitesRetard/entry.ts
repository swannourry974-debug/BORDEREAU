import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { escapeHtml } from '../../shared/html.ts';

/**
 * Tâche planifiée (1×/jour) — Vérifie toutes les commandes "au_relais"
 * dont la date_arrivee_relais dépasse 7 jours.
 * Applique 0,50€/jour de pénalité, reversée au point relais.
 * Envoie un rappel email au lecteur si pénalité active.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const GRACE_JOURS = 7;
    const PENALITE_PAR_JOUR = 0.50; // €

    // Récupérer toutes les commandes en attente au relais
    const commandes = await base44.asServiceRole.entities.Commande.filter({ statut: 'au_relais' });

    const maintenant = new Date();
    let traitees = 0;
    let totalPenalites = 0;

    for (const cmd of commandes) {
      if (!cmd.date_arrivee_relais) continue;

      const dateArrivee = new Date(cmd.date_arrivee_relais);
      const joursEcoules = Math.floor((maintenant - dateArrivee) / (1000 * 60 * 60 * 24));

      if (joursEcoules <= GRACE_JOURS) continue; // Dans le délai de grâce

      const joursRetard = joursEcoules - GRACE_JOURS;
      const penaliteTotale = Math.round(joursRetard * PENALITE_PAR_JOUR * 100) / 100;
      const penaliteActuelle = cmd.penalite_retard || 0;

      // Mettre à jour uniquement si la pénalité a augmenté (un nouveau jour)
      if (penaliteTotale > penaliteActuelle) {
        await base44.asServiceRole.entities.Commande.update(cmd.id, {
          penalite_retard: penaliteTotale,
          jours_retard: joursRetard,
        });

        // Mise à jour du gain du relais
        if (cmd.point_relais_id) {
          const relaisList = await base44.asServiceRole.entities.PointRelais.filter({ id: cmd.point_relais_id });
          const relais = relaisList[0];
          if (relais) {
            // Envoyer un rappel au lecteur tous les 3 jours de retard
            if (joursRetard % 3 === 1 && cmd.lecteur_email) {
              const dateLimiteDepassee = new Date(dateArrivee.getTime() + GRACE_JOURS * 24 * 60 * 60 * 1000)
                .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

              const livreTitre = escapeHtml(cmd.livre_titre || 'Livre');
              const livreAuteur = escapeHtml(cmd.livre_auteur || '');
              const relaisNom = escapeHtml(relais.nom || 'Point relais');
              const relaisVille = escapeHtml(relais.ville || '');

              await base44.asServiceRole.integrations.Core.SendEmail({
                to: cmd.lecteur_email,
                from_name: 'Bordero — Rappel Urgent',
                subject: `⚠️ Pénalité de retard en cours — ${cmd.livre_titre} (${joursRetard}j de retard)`,
                body: `Bonjour,

Votre livre est toujours au point relais depuis ${joursEcoules} jours.

📖 ${livreTitre}${livreAuteur ? ` — ${livreAuteur}` : ''}
🏪 Relais : ${relaisNom} · ${relaisVille}

💸 Pénalité actuelle : ${penaliteTotale.toFixed(2)} € (${joursRetard} jour${joursRetard > 1 ? 's' : ''} × 0,50 €/jour)
📅 Délai de grâce expiré le : ${dateLimiteDepassee}

Cette pénalité est reversée directement au commerçant pour compenser l'espace occupé.

Merci de récupérer votre livre dès que possible.

— L'équipe Bordero`.trim(),
              });

              console.log(`Rappel pénalité envoyé à ${cmd.lecteur_email} — ${joursRetard}j retard — ${penaliteTotale}€`);
            }
          }
        }

        traitees++;
        totalPenalites += penaliteTotale - penaliteActuelle;
        console.log(`Commande ${cmd.id} : +${(penaliteTotale - penaliteActuelle).toFixed(2)}€ pénalité (total: ${penaliteTotale}€, ${joursRetard}j retard)`);
      }
    }

    return Response.json({
      success: true,
      commandes_traitees: traitees,
      nouvelles_penalites_euros: Math.round(totalPenalites * 100) / 100,
    });

  } catch (error) {
    console.error('Erreur calculerPenalitesRetard:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});