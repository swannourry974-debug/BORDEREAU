import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import WalletCard from '@/components/missions/WalletCard';
import PayoutRequestButtons from '@/components/voyageur/PayoutRequestButtons';

export default function VoyageurFinanceRubriques({ user, sectionStyle }) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.VoyageurWallet.filter({ user_email: user.email }, '-updated_date', 1)
      .then(wallets => setWallet(wallets?.[0] || { solde_disponible: 0, gains_previsionnels: 0, virement_suspendu: false }))
      .finally(() => setLoading(false));
  }, [user?.email]);

  if (loading) {
    return <div style={sectionStyle} className="bordero-empty-state font-body italic">Chargement du portefeuille…</div>;
  }

  return (
    <>
      <div className="bordero-surface p-4" style={{ ...sectionStyle, boxShadow: 'var(--bordero-shadow-paper)' }}>
        <div className="bordero-heading-section mb-3">Réclamer mes gains</div>
        <PayoutRequestButtons user={user} wallet={wallet} onUpdated={setWallet} />
      </div>
      <div className="bordero-surface p-4" style={{ ...sectionStyle, boxShadow: 'var(--bordero-shadow-paper)' }}>
        <div className="bordero-heading-section mb-3">Portefeuille voyageur</div>
        <WalletCard soldeDisponible={wallet?.solde_disponible ?? 0} gainsPrevisionnels={wallet?.gains_previsionnels ?? 0} virementSuspendu={wallet?.virement_suspendu ?? false} hideTransfer />
      </div>
    </>
  );
}