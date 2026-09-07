import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import Stripe from 'npm:stripe@14.21.0';

function genererCodeSecret() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint32Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, value => alphabet[value % alphabet.length]).join('');
}

async function getTrustedBookPrice(book = {}) {
  const isbn = book?.isbn || book?.industryIdentifiers?.find?.(i => i.type?.includes('ISBN'))?.identifier || '';
  const title = String(book?.title || '').trim();
  const author = String(book?.author || book?.authors?.[0] || '').trim();
  const query = isbn ? `isbn:${isbn}` : [title, author].filter(Boolean).join(' ');
  if (!query) return 0;

  const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1&printType=books`);
  if (!response.ok) return 0;
  const data = await response.json();
  const saleInfo = data?.items?.[0]?.saleInfo || {};
  const price = saleInfo.retailPrice || saleInfo.listPrice;
  if (!price || price.currencyCode !== 'EUR') return 0;
  const amount = Number(price.amount);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

const APP_BASE_URL = 'https://bordero.base44.app';

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

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecret) return Response.json({ error: 'Stripe non configuré' }, { status: 500 });
    const stripe = new Stripe(stripeSecret);

    const { book, zone_id, zone_nom, mode_livraison, transit, adresse, suivi_facturation_mode } = await req.json();

    const modeInput = String(mode_livraison || transit || 'express').toLowerCase();
    if (!['express', 'collectif', 'collecte'].includes(modeInput)) {
      return Response.json({ error: 'Mode de livraison invalide' }, { status: 400 });
    }

    const zones = await base44.asServiceRole.entities.ZonesTarifs.filter({ actif: true }, '-updated_date', 200);
    const normalize = (value = '') => normalizeDestination(value).replace(/[^a-z0-9]+/g, ' ').trim();
    const requested = normalize(`${zone_nom || ''} ${adresse || ''}`);
    const zone = zones.find(z => z.id === zone_id)
      || zones.find(z => normalize(z.zone_nom) && requested.includes(normalize(z.zone_nom)))
      || zones.find(z => normalize(z.pays_nom) && requested.includes(normalize(z.pays_nom)))
      || zones.find(z => normalize(z.pays_code) && requested.includes(normalize(z.pays_code)));

    if (!zone) return Response.json({ error: 'Zone tarifaire invalide' }, { status: 400 });

    const adresseNorm = normalize(adresse);
    const zoneNomNorm = normalize(zone.zone_nom);
    if (adresseNorm && zoneNomNorm && !adresseNorm.includes(zoneNomNorm) && !zoneNomNorm.includes(adresseNorm)) {
      return Response.json({ error: 'Adresse incohérente avec la zone tarifaire' }, { status: 400 });
    }

    const isExpress = modeInput === 'express';
    const prixLivraison = isExpress ? Number(zone.frais_lecteur_express) : Number(zone.frais_lecteur_collectif);
    const prixLivre = await getTrustedBookPrice(book);
    const prixLivreARembourser = prixLivre <= 0;
    const totalEuros = prixLivre + prixLivraison;

    if (!Number.isFinite(totalEuros) || totalEuros <= 0) {
      return Response.json({ error: 'Tarif indisponible pour cette zone' }, { status: 400 });
    }
    const totalCents = Math.round(totalEuros * 100);

    const codeSecret = genererCodeSecret();
    const comparative = getComparativeRate(`${zone.zone_nom || ''} ${zone.pays_nom || ''} ${adresse || ''}`);
    const fraisPortRef = Math.min(comparative.colissimo, comparative.dhlMin, comparative.fretMin);
    const economieRealisee = Math.max(0, fraisPortRef - prixLivraison);

    const modeLabel = isExpress ? 'Express (Voyageur)' : 'Collectif (Malle)';
    const zoneKey = zone.id;
    const zoneLabel = zone.zone_nom || zone_nom || 'International';
    const partVoyageur = isExpress ? Number(zone.part_voyageur_express || 0) : 0;
    const partRelais = isExpress ? Number(zone.part_relais || 0) : Number(zone.part_relais || 0);
    const partAdmin = Math.max(0, prixLivraison - partVoyageur - partRelais);

    const session = await stripe.checkout.sessions.create({
      automatic_payment_methods: { enabled: true },
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `📚 ${book?.title || 'Livre'}`,
            description: `${modeLabel} · Livre ${prixLivre.toFixed(2)}€ + livraison ${prixLivraison.toFixed(2)}€ · Zone ${zoneLabel}${adresse ? ` · ${adresse}` : ''}`,
          },
          unit_amount: totalCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${APP_BASE_URL}/?payment=success`,
      cancel_url: `${APP_BASE_URL}/?payment=cancel`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_email: user.email,
        book_title: book?.title || '',
        book_author: book?.author || '',
        zone_id: zoneKey,
        zone_nom: zoneLabel,
        mode_livraison: isExpress ? 'express' : 'collectif',
        suivi_facturation_mode: suivi_facturation_mode === 'email' ? 'email' : 'application',
        suivi_active: 'true',
        facture_reference: `BORD-${new Date().getFullYear()}-${codeSecret}`,
        adresse: adresse || '',
        prix_livre: String(prixLivre),
        frais_livraison: String(prixLivraison),
        prix_livre_a_rembourser: prixLivreARembourser ? 'true' : 'false',
        montant_total: String(totalEuros),
        code_secret: codeSecret,
        part_voyageur: String(partVoyageur),
        part_relais: String(partRelais),
        part_admin: String(partAdmin),
        frais_port_ref: String(prixLivraison),
        economie_realisee: String(economieRealisee),
        destination_comparative: comparative.destination,
        ref_colissimo: String(comparative.colissimo),
        ref_dhl_express: String(comparative.dhlMin),
        ref_fret_maritime: String(comparative.fretMin),
      },
    });

    console.log(`[createCheckout] Session créée: ${session.id} | Livre: ${prixLivre}€ | Livraison: ${prixLivraison}€ | Total: ${totalEuros}€`);

    return Response.json({
      url: session.url,
      total_euros: totalEuros,
      prix_livre: prixLivre,
      frais_livraison: prixLivraison,
      zone_id: zoneKey,
    });
  } catch (error) {
    console.error('[createCheckout] Erreur:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}