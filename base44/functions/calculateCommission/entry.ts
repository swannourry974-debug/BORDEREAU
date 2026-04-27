import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Calcule la commission voyageur selon le format/poids du livre.
 * S (< 300g) → 3€ | M (300–700g) → 5€ | L (> 700g) → 10€
 * Bonus quantité : +2€ par livre si le voyageur accepte > 5 livres au total.
 *
 * @param {Array<{type: 'S'|'M'|'L'}>} livres - liste des livres avec leur taille
 * @param {number} livresDejaActifs - livres déjà dans la valise du voyageur
 */

const BASE_COMMISSION = { S: 3, M: 5, L: 10 };
const BONUS_QUANTITE = 2;
const SEUIL_BONUS = 5;

function getBaseCommission(type) {
  return BASE_COMMISSION[type] ?? 5;
}

function calculerCommissions(livres, livresDejaActifs = 0) {
  const totalLivres = (livresDejaActifs || 0) + livres.length;
  const bonusActif = totalLivres > SEUIL_BONUS;

  const breakdown = livres.map((livre, i) => {
    const base = getBaseCommission(livre.type);
    const bonus = bonusActif ? BONUS_QUANTITE : 0;
    return {
      rank: (livresDejaActifs || 0) + i + 1,
      type: livre.type,
      base,
      bonus,
      commission: base + bonus,
    };
  });

  const total = breakdown.reduce((sum, l) => sum + l.commission, 0);
  return { breakdown, total: Math.round(total * 100) / 100, bonusActif };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { livres, livresDejaActifs, action } = body;

    if (action === 'preview') {
      // Calcul pour 1 livre avec son type
      const type = livres?.[0]?.type || 'M';
      const nbActifs = livresDejaActifs || 0;
      const base = getBaseCommission(type);
      const totalApres = nbActifs + 1;
      const bonusActif = totalApres > SEUIL_BONUS;
      const commission = base + (bonusActif ? BONUS_QUANTITE : 0);

      return Response.json({
        type,
        base,
        bonus: bonusActif ? BONUS_QUANTITE : 0,
        commission,
        bonusActif,
        totalLivresApres: totalApres,
        message: bonusActif
          ? `Livre ${type} : ${base}€ + ${BONUS_QUANTITE}€ bonus quantité = ${commission}€`
          : `Livre ${type} : ${commission}€ (bonus à partir de ${SEUIL_BONUS + 1} livres)`,
      });
    }

    // action === 'full' : calcul complet pour une liste de livres
    const result = calculerCommissions(livres || [], livresDejaActifs || 0);

    return Response.json(result);

  } catch (error) {
    console.error('calculateCommission error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});