import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const MIN_PAYOUT = 20;

/**
 * Demande de virement voyageur.
 * Avant : le navigateur mettait lui-même à jour son VoyageurWallet (solde_disponible inclus),
 * donc n'importe quel compte pouvait s'octroyer un solde puis réclamer un paiement.
 * Ici, le montant vient du portefeuille en base, jamais du client.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const methode = body?.methode === 'stripe' ? 'stripe' : 'paypal';

    const wallets = await base44.asServiceRole.entities.VoyageurWallet.filter(
      { user_email: user.email },
      '-updated_date',
      1
    );
    const wallet = wallets?.[0];
    if (!wallet) {
      return Response.json({ error: 'Aucun portefeuille associé à ce compte.' }, { status: 404 });
    }
    if (wallet.virement_suspendu) {
      return Response.json({ error: 'Virements suspendus. Contactez le support.' }, { status: 403 });
    }
    if (wallet.demande_virement_statut === 'en_attente') {
      return Response.json({ error: 'Une demande de virement est déjà en attente.' }, { status: 409 });
    }

    const solde = Number(wallet.solde_disponible || 0);
    if (!Number.isFinite(solde) || solde < MIN_PAYOUT) {
      return Response.json({ error: `Le solde minimum est de ${MIN_PAYOUT} €.` }, { status: 400 });
    }

    const updated = await base44.asServiceRole.entities.VoyageurWallet.update(wallet.id, {
      demande_virement_methode: methode,
      demande_virement_statut: 'en_attente',
      demande_virement_montant: solde,
      demande_virement_le: new Date().toISOString(),
    });

    return Response.json({ success: true, wallet: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
