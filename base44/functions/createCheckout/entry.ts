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

    const { book, forfait, transit, adresse } = await req.json();

    const forfaitData = FORFAITS[forfait] || FORFAITS.poche;
    const transitDiscount = transit === 'collecte' ? -200 : 0;
    const totalCents = forfaitData.price + transitDiscount;

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
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});