import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

const MIN_PAYOUT = 20;

export default function PayoutRequestButtons({ user, wallet, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const solde = wallet?.solde_disponible ?? 0;
  const canRequest = solde >= MIN_PAYOUT && !wallet?.virement_suspendu;
  const hasPending = wallet?.demande_virement_statut === 'en_attente';

  const requestPayPal = async () => {
    if (!user || !canRequest || hasPending || loading) return;
    setLoading(true);
    const payload = {
      user_email: user.email,
      demande_virement_methode: 'paypal',
      demande_virement_statut: 'en_attente',
      demande_virement_montant: solde,
      demande_virement_le: new Date().toISOString(),
    };
    const updated = wallet?.id
      ? await base44.entities.VoyageurWallet.update(wallet.id, payload)
      : await base44.entities.VoyageurWallet.create({ ...payload, solde_disponible: solde, gains_previsionnels: wallet?.gains_previsionnels ?? 0 });
    onUpdated?.(updated);
    setLoading(false);
  };

  return (
    <div style={{ background: 'var(--papier)', border: '1.5px dashed rgba(26,16,8,0.2)', padding: 14, marginTop: 12, marginBottom: 18 }}>
      <div className="font-special" style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--encre)', marginBottom: 6 }}>
        Réclamer mes gains
      </div>
      <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.52)', marginBottom: 12 }}>
        Minimum requis : 20 € par voyageur.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button
          type="button"
          onClick={requestPayPal}
          disabled={!canRequest || hasPending || loading}
          className="font-special"
          style={{ background: canRequest && !hasPending ? '#0070BA' : 'rgba(26,16,8,0.12)', color: canRequest && !hasPending ? '#fff' : 'rgba(26,16,8,0.38)', border: 'none', padding: '12px 10px', fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', cursor: canRequest && !hasPending ? 'pointer' : 'not-allowed' }}
        >
          {loading ? 'Envoi…' : hasPending ? 'PayPal demandé' : 'Réclamer par PayPal'}
        </button>
        <button
          type="button"
          disabled
          className="font-special"
          style={{ background: 'rgba(26,16,8,0.10)', color: 'rgba(26,16,8,0.35)', border: '1px dashed rgba(26,16,8,0.20)', padding: '12px 10px', fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', cursor: 'not-allowed' }}
        >
          Stripe indisponible
        </button>
      </div>
      {!canRequest && !hasPending && (
        <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 11, color: 'rgba(128,0,32,0.65)', marginTop: 10 }}>
          Solde disponible insuffisant ou virement suspendu.
        </div>
      )}
    </div>
  );
}