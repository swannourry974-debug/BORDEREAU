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
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import Stripe from 'npm:stripe@14.21.0';
import { waitUntil } from 'base44:runtime';

export default async function(req: Request): Promise<Response> {
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!stripeSecret) {
    return Response.json({ error: 'Stripe non configuré' }, { status: 500 });
  }
  if (!webhookSecret) {
    console.error('[stripeWebhook] STRIPE_WEBHOOK_SECRET manquant — webhook refusé');
    return Response.json({ error: 'Webhook Stripe non configuré' }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret);
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') || '';

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
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

  // Le webhook n'a pas de cookie utilisateur — on crée un client à partir de la requête
  // et on utilise asServiceRole pour les opérations d'écriture
  const base44 = createClientFromRequest(req);

  // Idempotence : éviter de créer deux fois la même commande
  const existing = await base44.asServiceRole.entities.Commande.filter({ stripe_session_id: session.id }, '-created_date', 1).catch(() => []);
  if (existing?.length > 0) {
    console.log(`[stripeWebhook] Session ${session.id} déjà traitée — commande ${existing[0].id}`);
    return Response.json({ received: true, idempotent: true, commande_id: existing[0].id });
  }

  const userEmail = meta.user_email || '';
  const bookTitle = meta.book_title || 'Livre';
  const bookAuthor = meta.book_author || '';
  const zoneId = meta.zone_id || 'international';
  const zoneNom = meta.zone_nom || 'International';
  const pointRelaisId = meta.point_relais_id || '';
  const pointRelaisNom = meta.point_relais_nom || '';
  const livreType = meta.livre_type || 'Poche';
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
  const campagnePromoId = meta.campagne_promo_id || '';
  const codePromoCollecte = meta.code_promo_collecte || '';
  const montantReductionCollecte = parseFloat(meta.montant_reduction_collecte || '0');

  // Créer la commande en base avec statut "payee"
  let commande;
  try {
    commande = await base44.asServiceRole.entities.Commande.create({
      lecteur_email: userEmail,
      livre_titre: bookTitle,
      livre_auteur: bookAuthor,
      livre_type: livreType,
      zone_id: zoneId,
      zone_nom: zoneNom,
      point_relais_id: pointRelaisId,
      point_relais_nom: pointRelaisNom,
      mode_livraison: modeLivraison,
      collecte_batch_statut: modeLivraison === 'collectif' ? 'en_attente_40' : undefined,
      montant_paye: montantTotal,
      stripe_session_id: session.id,
      campagne_promo_id: campagnePromoId,
      code_promo_collecte: codePromoCollecte,
      montant_reduction_collecte: Number.isFinite(montantReductionCollecte) ? montantReductionCollecte : 0,
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

  // Déclencher les suites de paiement en arrière-plan (non bloquant)
  waitUntil(Promise.all([
    base44.asServiceRole.functions.invoke('notifierSuiviCommande', { commande_id: commande.id }).catch(e =>
      console.warn('[stripeWebhook] Notification suivi échouée:', e.message)
    ),
    base44.asServiceRole.functions.invoke('grouperCollectePayee', { commande_id: commande.id }).catch(e =>
      console.warn('[stripeWebhook] Regroupement Collecte échoué:', e.message)
    ),
    campagnePromoId ? base44.asServiceRole.entities.CampagnePromoCollecte.get(campagnePromoId)
      .then(c => c ? base44.asServiceRole.entities.CampagnePromoCollecte.update(c.id, { nombre_utilisations: Number(c.nombre_utilisations || 0) + 1 }) : null)
      .catch(e => console.warn('[stripeWebhook] Comptage promo échoué:', e.message)) : Promise.resolve(null),
  ]));

  return Response.json({ received: true, commande_id: commande.id });
}