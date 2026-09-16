/**
 * stripeWebhook — Webhook Stripe pour confirmer les commandes après paiement réel
 *
 * Écoute l'événement checkout.session.completed.
 * Crée la Commande en base et met son statut à "payee" de manière fiable,
 * indépendamment de la redirection navigateur (qui peut échouer si l'onglet est fermé).
 *
 * À enregistrer dans le Dashboard Stripe :
 *   URL : https://bordero.base44.app/api/functions/stripeWebhook
 *   Événements : checkout.session.completed
 */
import { createServiceRoleClient } from 'npm:@base44/sdk@0.8.44';
import Stripe from 'npm:stripe@14.21.0';

function genererQrToken(commandeId: string, lecteurEmail: string, format: string, secret: string): string {
  return btoa(`${commandeId}:${lecteurEmail}:${format}:${secret}`).replace(/=/g, '');
}

export default async function(req: Request): Promise<Response> {
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!stripeSecret) {
    return Response.json({ error: 'Stripe non configuré' }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret);
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') || '';

  let event: Stripe.Event;
  try {
    if (webhookSecret) {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } else {
      // Fallback sans vérification de signature (à éviter en production)
      event = JSON.parse(body);
      console.warn('[stripeWebhook] Signature non vérifiée — STRIPE_WEBHOOK_SECRET manquant');
    }
  } catch (err) {
    console.error('[stripeWebhook] Signature invalide:', err.message);
    return Response.json({ error: 'Signature invalide' }, { status: 400 });
  }

  // On ne traite que cet événement
  if (event.type !== 'checkout.session.completed') {
    return Response.json({ received: true, skipped: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const meta = session.metadata || {};

  const base44 = createServiceRoleClient();

  // Idempotence : éviter de créer deux fois la même commande
  const existing = await base44.entities.Commande.filter({ stripe_session_id: session.id }, '-created_date', 1).catch(() => []);
  if (existing?.length > 0) {
    console.log(`[stripeWebhook] Session ${session.id} déjà traitée — commande ${existing[0].id}`);
    return Response.json({ received: true, idempotent: true, commande_id: existing[0].id });
  }

  const userEmail = meta.user_email || '';
  const bookTitle = meta.book_title || 'Livre';
  const bookAuthor = meta.book_author || '';
  const zoneId = meta.zone_id || 'international';
  const zoneNom = meta.zone_nom || 'International';
  const modeLivraison = meta.mode_livraison === 'collectif' ? 'collectif' : 'express';
  const adresse = meta.adresse || '';
  const prixLivre = parseFloat(meta.prix_livre || '0');
  const fraisLivraison = parseFloat(meta.frais_livraison || '0');
  const montantTotal = parseFloat(meta.montant_total || '0') || (session.amount_total || 0) / 100;
  const codeSecret = meta.code_secret || '';
  const partVoyageur = parseFloat(meta.part_voyageur || '0');
  const partRelais = parseFloat(meta.part_relais || '0');
  const partAdmin = parseFloat(meta.part_admin || '0');
  const economieRealisee = parseFloat(meta.economie_realisee || '0');
  const prixLivreARembourser = meta.prix_livre_a_rembourser === 'true';
  const factureRef = meta.facture_reference || `BORD-${new Date().getFullYear()}-${codeSecret}`;
  const suiviMode = meta.suivi_facturation_mode === 'email' ? 'email' : 'application';

  // Créer la commande en base avec statut "payee"
  let commande;
  try {
    commande = await base44.entities.Commande.create({
      lecteur_email: userEmail,
      livre_titre: bookTitle,
      livre_auteur: bookAuthor,
      livre_type: 'Poche', // Sera affiné via forfait dans une version future
      zone_id: zoneId,
      zone_nom: zoneNom,
      mode_livraison: modeLivraison,
      montant_paye: montantTotal,
      stripe_session_id: session.id,
      statut: 'payee',
      code_secret: codeSecret,
      prix_livre_neuf: prixLivre,
      prix_livre_a_rembourser: prixLivreARembourser,
      frais_port_ref: fraisLivraison,
      frais_bordereau: fraisLivraison,
      economie_realisee: economieRealisee,
      part_voyageur: partVoyageur,
      part_relais: partRelais,
      part_admin: partAdmin,
      suivi_facturation_mode: suiviMode,
      suivi_active: true,
      facture_reference: factureRef,
      facture_emise_le: new Date().toISOString(),
      notification_lecteur_envoyee: false,
      validation_admin: 'en_attente',
      scan_valide_par_voyageur: false,
      penalite_retard: 0,
      jours_retard: 0,
    });
  } catch (err) {
    console.error('[stripeWebhook] Erreur création commande:', err.message);
    return Response.json({ error: 'Erreur création commande' }, { status: 500 });
  }

  console.log(`[stripeWebhook] ✅ Commande créée: ${commande.id} | ${bookTitle} | ${userEmail} | ${montantTotal}€`);

  // Déclencher la notification lecteur en arrière-plan (non bloquant)
  base44.functions.invoke('notifierSuiviCommande', { commande_id: commande.id }).catch(e =>
    console.warn('[stripeWebhook] Notification suivi échouée:', e.message)
  );

  return Response.json({ received: true, commande_id: commande.id });
}
