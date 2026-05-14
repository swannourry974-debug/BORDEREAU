import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

const FORFAITS = {
  poche:  { name: 'Poche',       price: 890 },
  broche: { name: 'Broché',      price: 1490 },
  bd:     { name: 'BD',          price: 1290 },
  beau:   { name: 'Beau Livre',  price: 2490 },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const { book, forfait, transit, adresse, zone_id, zone_nom, poids_kg } = await req.json();

    const forfaitData = FORFAITS[forfait] || FORFAITS.poche;
    const transitDiscount = transit === 'collecte' ? -200 : 0;
    const totalCents = forfaitData.price + transitDiscount;

    // Calcul des économies : chercher le tarif de référence UPS pour cette zone/poids
    let fraisPortRef = 0;
    let fraisBordereau = Math.round(totalCents / 100 * 100) / 100;
    let economiRealisee = 0;
    const poids = poids_kg || 0.3; // poids par défaut 300g pour un livre poche

    if (zone_id || zone_nom) {
      const rates = await base44.entities.ShippingRates.list();
      const zoneRates = rates
        .filter(r => r.actif !== false && (r.zone_id === zone_id || r.zone_nom === zone_nom))
        .sort((a, b) => a.poids_max_kg - b.poids_max_kg);
      const matchRate = zoneRates.find(r => r.poids_max_kg >= poids) || zoneRates[zoneRates.length - 1];
      if (matchRate) {
        fraisPortRef = matchRate.prix_ups_express || 0;
        economiRealisee = Math.max(0, fraisPortRef - fraisBordereau);
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `📚 ${book.title}`,
            description: `Forfait ${forfaitData.name} · ${transit === 'collecte' ? 'Collecte carton' : 'Express individuel'} · Livraison : ${adresse || 'Point relais'}`,
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
        book_title: book.title,
        forfait,
        transit,
        adresse: adresse || '',
        zone_nom: zone_nom || '',
        frais_port_ref: String(fraisPortRef),
        frais_bordereau: String(fraisBordereau),
        economie_realisee: String(economiRealisee),
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});