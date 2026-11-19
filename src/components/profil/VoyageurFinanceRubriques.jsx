import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import WalletCard from '@/components/missions/WalletCard';
import PayoutRequestButtons from '@/components/voyageur/PayoutRequestButtons';

export default function VoyageurFinanceRubriques({ user, sectionStyle }) {
  const [wallet, setWallet] = useState(null);
  const [walletStatus, setWalletStatus] = useState('loading');

  useEffect(() => {
    if (!user?.email) {
      setWallet(null);
      setWalletStatus('empty');
      return;
    }
    setWalletStatus('loading');
    base44.entities.VoyageurWallet.filter({ user_email: user.email }, '-updated_date', 1)
      .then(wallets => {
        const record = wallets?.[0];
        setWallet(record || null);
        setWalletStatus(record ? 'ready' : 'empty');
      })
      .catch(() => {
        setWallet(null);
        setWalletStatus('error');
      });
  }, [user?.email]);

  const hasWallet = walletStatus === 'ready';

  return (
    <>
      {hasWallet && (
        <div className="bordero-surface p-4" style={{ ...sectionStyle, boxShadow: 'var(--bordero-shadow-paper)' }}>
          <div className="bordero-heading-section mb-3">Réclamer mes gains</div>
          <PayoutRequestButtons user={user} wallet={wallet} onUpdated={setWallet} />
        </div>
      )}
      <div className="bordero-surface p-4" style={{ ...sectionStyle, boxShadow: 'var(--bordero-shadow-paper)' }}>
        <div className="bordero-heading-section mb-3">Portefeuille voyageur</div>
        <WalletCard soldeDisponible={wallet?.solde_disponible} gainsPrevisionnels={wallet?.gains_previsionnels} virementSuspendu={wallet?.virement_suspendu} hideTransfer status={walletStatus} />
      </div>
    </>
  );
}