import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Calcule la commission incrémentale selon le rang du livre dans la valise.
 * Livre 1 → 5,00€ | Livre 2 → 6,50€ | Livres 3-10 → 8,00€
 */
function calculateVoyageurCommission(livresDejaValides) {
  const rank = livresDejaValides + 1; // rang du prochain livre
  if (rank === 1) return 5.00;
  if (rank === 2) return 6.50;
  if (rank >= 3 && rank <= 10) return 8.00;
  return 0; // au-delà de 10 : interdit
}

function getTotalCommission(nombreLivres) {
  let total = 0;
  for (let i = 0; i < nombreLivres; i++) {
    total += calculateVoyageurCommission(i);
  }
  return Math.round(total * 100) / 100;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { livresActifs, action } = body;

    if (action === 'preview') {
      // Retourne la commission du prochain livre et le total si on en ajoute un
      const nextCommission = calculateVoyageurCommission(livresActifs || 0);
      const totalActuel = getTotalCommission(livresActifs || 0);
      const totalApres = getTotalCommission((livresActifs || 0) + 1);
      const rank = (livresActifs || 0) + 1;

      return Response.json({
        nextCommission,
        totalActuel,
        totalApres,
        rank,
        isLimitReached: rank > 10,
        message: rank === 2
          ? `Ajoutez un 2ème livre pour gagner +6,50 € au lieu de 5 € !`
          : rank > 10
          ? 'Limite de sécurité atteinte (10 livres max) pour garantir un passage serein en douane.'
          : `Livre n°${rank} : +${nextCommission.toFixed(2)} € de gratification.`
      });
    }

    // action === 'full' : calcul complet pour N livres
    const count = parseInt(livresActifs) || 0;
    const breakdown = [];
    for (let i = 0; i < count; i++) {
      const c = calculateVoyageurCommission(i);
      breakdown.push({ rank: i + 1, commission: c });
    }

    return Response.json({
      total: getTotalCommission(count),
      breakdown,
      livresActifs: count,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});