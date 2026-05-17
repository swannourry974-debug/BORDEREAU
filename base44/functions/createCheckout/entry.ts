import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

/**
 * BORDEREAU — Tunnel de paiement Stripe (Escrow)
 * Architecture tarifaire officielle :
 *   EXPRESS  : Europe 14,99€ | International 24,99€ | Grand Export 49,99€
 *   COLLECTIF: Coût moyen par livre selon malle
 * Code secret 3 chiffres généré et stocké sur la commande.
 */

// Grille tarifaire officielle (en centimes)
const TARIFS = {
  europe:       { express: 1499, collectif: 197 },
  international: { express: 2499, collectif: 497 },
  grand_export:  { express: 4999, collectif: 797 },
  maghreb:       { express: 2499, collectif: 497 },
};

// Ventilation express (pour métadonnées)
const VENTILATION_EXPRESS = {
  europe:       { part_voyageur: 6.00, part_relais: 3.00, part_admin: 5.99 },
  international: { part_voyageur: 10.00, part_relais: 5.00, part_admin: 9.99 },
  grand_export:  { part_voyageur: 20.00, part_relais: 10.00, part_admin: 19.99 },
  maghreb:       { part_voyageur: 10.00, part_relais: 5.00, part_admin: 9.99 },
};

function genererCodeSecret() {
  return String(Math.floor(100 + Math.random() * 900));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const { book, zone_id, zone_nom, mode_livraison, adresse, prix_livre } = await req.json();

    // Résoudre la zone
    const zoneKey = (zone_id || zone_nom || 'international').toLowerCase().replace(' ', '_');
    const tarif = TARIFS[zoneKey] || TARIFS.international;
    const ventilation = VENTILATION_EXPRESS[zoneKey] || VENTILATION_EXPRESS.international;

    const isExpress = mode_livraison !== 'collectif';
    const totalCents = isExpress ? tarif.express : tarif.collectif;
    const totalEuros = totalCents / 100;

    // Générer le code secret de validation (remise physique)
    const codeSecret = genererCodeSecret();

    // Calcul économies vs UPS (frais de référence estimés)
    const fraisPortRef = isExpress
      ? { europe: 18.50, international: 35.00, grand_export: 65.00, maghreb: 32.00 }[zoneKey] || 35.00
      : 0;
    const economiRealisee = Math.max(0, fraisPortRef - totalEuros);

    // Description dynamique
    const modeLabel = isExpress ? 'Express (Voyageur)' : 'Collectif (Malle)';
    const zoneLabel = { europe: 'Europe', international: 'International', grand_export: 'Grand Export', maghreb: 'Maghreb' }[zoneKey] || zone_nom || 'International';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `📚 ${book?.title || 'Livre'}`,
            description: `${modeLabel} · Zone ${zoneLabel}${adresse ? ` · ${adresse}` : ''}`,
          },
          unit_amount: totalCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.get('origin') || 'https://app.base44.com'}/?payment=success`,
      cancel_url: `${req.headers.get('origin') || 'https://app.base44.com'}/?payment=cancel`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        user_email: user.email,
        book_title: book?.title || '',
        book_author: book?.author || '',
        zone_id: zoneKey,
        zone_nom: zoneLabel,
        mode_livraison: isExpress ? 'express' : 'collectif',
        adresse: adresse || '',
        prix_livre: String(prix_livre || 0),
        code_secret: codeSecret,
        // Ventilation express
        part_voyageur: isExpress ? String(ventilation.part_voyageur) : '0',
        part_relais: isExpress ? String(ventilation.part_relais) : '0',
        part_admin: isExpress ? String(ventilation.part_admin) : String(totalEuros),
        frais_port_ref: String(fraisPortRef),
        economie_realisee: String(economiRealisee),
      },
    });

    console.log(`[createCheckout] Session créée: ${session.id} | Zone: ${zoneKey} | Mode: ${modeLabel} | Total: ${totalEuros}€ | Code: ${codeSecret}`);

    return Response.json({
      url: session.url,
      code_secret: codeSecret, // retourné pour créer la Commande côté frontend
      total_euros: totalEuros,
      zone_id: zoneKey,
    });
  } catch (error) {
    console.error('[createCheckout] Erreur:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});