import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

/**
 * BORDERO — Tunnel de paiement Stripe (Escrow)
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

const COMPARATIVE_RATES = {
  conakry: { destination: 'Conakry', colissimo: 256.89, dhlMin: 380, fretMin: 250 },
  new_york: { destination: 'New York', colissimo: 256.89, dhlMin: 220, fretMin: 300 },
  quebec: { destination: 'Québec', colissimo: 256.89, dhlMin: 240, fretMin: 320 },
  miami: { destination: 'Miami', colissimo: 256.89, dhlMin: 220, fretMin: 300 },
  cape_town: { destination: 'Cape Town', colissimo: 256.89, dhlMin: 390, fretMin: 350 },
};

function normalizeDestination(value = '') {
  return value.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function getComparativeRate(destination = '') {
  const value = normalizeDestination(destination);
  if (value.includes('conakry') || value.includes('guinee') || value.includes('guinea')) return COMPARATIVE_RATES.conakry;
  if (value.includes('new york') || value.includes('nyc')) return COMPARATIVE_RATES.new_york;
  if (value.includes('quebec') || value.includes('canada')) return COMPARATIVE_RATES.quebec;
  if (value.includes('cape town') || value.includes('capetown') || value.includes('afrique du sud') || value.includes('south africa')) return COMPARATIVE_RATES.cape_town;
  if (value.includes('miami') || value.includes('usa') || value.includes('fl')) return COMPARATIVE_RATES.miami;
  return COMPARATIVE_RATES.miami;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const { book, zone_id, zone_nom, mode_livraison, transit, adresse, prix_livre } = await req.json();

    // Résoudre la zone
    const zoneKey = (zone_id || zone_nom || 'international').toLowerCase().replace(' ', '_');
    const tarif = TARIFS[zoneKey] || TARIFS.international;
    const ventilation = VENTILATION_EXPRESS[zoneKey] || VENTILATION_EXPRESS.international;

    const modeLivraison = mode_livraison || transit || 'express';
    const isExpress = modeLivraison !== 'collectif' && modeLivraison !== 'collecte';
    const totalCents = isExpress ? tarif.express : tarif.collectif;
    const totalEuros = totalCents / 100;

    // Générer le code secret de validation (remise physique)
    const codeSecret = genererCodeSecret();

    // Calcul économies vs solutions classiques selon la grille comparative 20 kg
    const comparative = getComparativeRate(`${zone_nom || ''} ${adresse || ''}`);
    const fraisPortRef = Math.min(comparative.colissimo, comparative.dhlMin, comparative.fretMin);
    const economiRealisee = Math.max(0, fraisPortRef - totalEuros);

    // Description dynamique
    const modeLabel = isExpress ? 'Express (Voyageur)' : 'Collectif (Malle)';
    const zoneLabel = { europe: 'Europe', international: 'International', grand_export: 'Grand Export', maghreb: 'Maghreb' }[zoneKey] || zone_nom || 'International';

    const session = await stripe.checkout.sessions.create({
      automatic_payment_methods: { enabled: true },
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
        destination_comparative: comparative.destination,
        ref_colissimo: String(comparative.colissimo),
        ref_dhl_express: String(comparative.dhlMin),
        ref_fret_maritime: String(comparative.fretMin),
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