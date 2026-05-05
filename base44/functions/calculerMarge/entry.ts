import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FRAIS_STRIPE_TAUX = 0.029; // 2.9%
const FRAIS_STRIPE_FIXE = 0.30;  // 0.30€

/**
 * Calcule la marge nette Bordereau selon le mode de livraison.
 * 
 * Payload attendu:
 * {
 *   zone_id: string,           // ID ZonesTarifs
 *   mode: "express"|"collectif",
 *   nb_livres_carton: number,  // Uniquement pour mode collectif (défaut: 20)
 *   poids_moyen_kg: number     // Poids moyen par livre en kg (défaut: 0.3)
 * }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const { zone_id, mode = 'express', nb_livres_carton = 20, poids_moyen_kg = 0.3 } = body;

    if (!zone_id) {
      return Response.json({ error: 'zone_id requis' }, { status: 400 });
    }

    // Récupérer la zone tarifaire
    const zones = await base44.entities.ZonesTarifs.filter({ id: zone_id });
    if (!zones || zones.length === 0) {
      return Response.json({ error: 'Zone introuvable' }, { status: 404 });
    }
    const zone = zones[0];

    let fraisLecteur, partVoyageur, coutTransport, detail;

    if (mode === 'express') {
      fraisLecteur = zone.frais_lecteur_express;
      partVoyageur = zone.part_voyageur_express;
      coutTransport = 0; // Le voyageur gère son transport

      const fraisStripe = Math.round((fraisLecteur * FRAIS_STRIPE_TAUX + FRAIS_STRIPE_FIXE) * 100) / 100;
      const margeNette = Math.round((fraisLecteur - partVoyageur - zone.part_relais - zone.taxe_assurance - fraisStripe) * 100) / 100;

      detail = {
        mode: 'Express',
        zone: zone.zone_nom,
        pays: zone.pays_nom,
        devise: zone.devise,
        frais_lecteur: fraisLecteur,
        part_voyageur: partVoyageur,
        part_relais: zone.part_relais,
        taxe_assurance: zone.taxe_assurance,
        frais_stripe: fraisStripe,
        marge_nette_bordereau: margeNette,
        taux_marge: Math.round((margeNette / fraisLecteur) * 100) + '%',
      };

    } else if (mode === 'collectif') {
      fraisLecteur = zone.frais_lecteur_collectif;
      partVoyageur = 0; // Pas de voyageur en mode collectif
      const poidsTotalCarton = poids_moyen_kg * nb_livres_carton;
      coutTransport = Math.round((zone.cout_fret_estime_kg * poidsTotalCarton / nb_livres_carton) * 100) / 100;

      const fraisStripe = Math.round((fraisLecteur * FRAIS_STRIPE_TAUX + FRAIS_STRIPE_FIXE) * 100) / 100;
      const margeNette = Math.round((fraisLecteur - coutTransport - zone.part_relais - zone.taxe_assurance - fraisStripe) * 100) / 100;

      const margeComparativeExpress = Math.round((zone.frais_lecteur_express - zone.part_voyageur_express - zone.part_relais - zone.taxe_assurance - (zone.frais_lecteur_express * FRAIS_STRIPE_TAUX + FRAIS_STRIPE_FIXE)) * 100) / 100;

      detail = {
        mode: 'Collectif',
        zone: zone.zone_nom,
        pays: zone.pays_nom,
        devise: zone.devise,
        nb_livres_carton,
        poids_moyen_kg,
        frais_lecteur: fraisLecteur,
        cout_transport_par_livre: coutTransport,
        part_relais: zone.part_relais,
        taxe_assurance: zone.taxe_assurance,
        frais_stripe: fraisStripe,
        marge_nette_bordereau: margeNette,
        taux_marge: Math.round((margeNette / fraisLecteur) * 100) + '%',
        comparaison_express: {
          marge_express: margeComparativeExpress,
          gain_collectif_vs_express: Math.round((margeNette - margeComparativeExpress) * 100) / 100,
        },
        simulation_carton: {
          nb_livres: nb_livres_carton,
          revenu_total: Math.round(fraisLecteur * nb_livres_carton * 100) / 100,
          marge_totale_carton: Math.round(margeNette * nb_livres_carton * 100) / 100,
        }
      };
    } else {
      return Response.json({ error: 'Mode invalide (express ou collectif)' }, { status: 400 });
    }

    console.log(`[calculerMarge] Zone: ${zone.zone_nom}, Mode: ${mode}, Marge: ${detail.marge_nette_bordereau}€`);

    return Response.json({ success: true, calcul: detail });

  } catch (error) {
    console.error('[calculerMarge] Erreur:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});