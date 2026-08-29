import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import WalletCard from '@/components/missions/WalletCard';
import { SectionTitle, PerfoStrip } from '@/components/bordereau/shared';
import VoyageurStatsCard from './VoyageurStatsCard';
import PayoutRequestButtons from './PayoutRequestButtons';
import LangSwitcher from '@/components/shared/LangSwitcher';

export default function PanelAccueilVoyageur() {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (!u) { setLoading(false); return; }
      const [wallets, allMissions] = await Promise.all([
        base44.entities.VoyageurWallet.filter({ user_email: u.email }),
        base44.entities.MissionVoyageur.filter({ voyageur_email: u.email }),
      ]);
      setWallet(wallets[0] || { solde_disponible: 0, gains_previsionnels: 0, virement_suspendu: false });
      setMissions(allMissions || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const livresEnCours = missions.filter(m => ['acceptee', 'engagee'].includes(m.statut));
  const livresLivres = missions.filter(m => m.statut === 'livree');

  if (loading) {
    return <div className="text-center py-10 font-fell italic text-encre/45">Chargement…</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div className="font-playfair" style={{ fontSize: 22, fontWeight: 700, color: 'var(--encre)' }}>
          Bonjour {user?.full_name?.split(' ')[0] || 'Voyageur'} ✦
        </div>
        <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.5)', marginTop: 2 }}>
          Langue, niveau, livres et portefeuille
        </div>
      </div>

      <SectionTitle>Choix de la langue</SectionTitle>
      <div style={{ background: 'var(--papier)', border: '1.5px solid rgba(26,16,8,0.2)', padding: 16, marginBottom: 18, boxShadow: '3px 3px 0 rgba(26,16,8,0.10)' }}>
        <LangSwitcher />
      </div>

      <SectionTitle>Récapitulatif livres & niveau</SectionTitle>
      <VoyageurStatsCard missions={missions} />
      <div style={{ background: 'var(--papier)', border: '1.5px solid rgba(26,16,8,0.2)', padding: 16, marginBottom: 18, boxShadow: '3px 3px 0 rgba(26,16,8,0.10)' }}>
        <div className="font-special" style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 10 }}>
          Livres transportés
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'rgba(128,0,32,0.06)', padding: 12, textAlign: 'center' }}>
            <div className="font-playfair" style={{ fontSize: 26, color: 'var(--bordeaux)', fontWeight: 700 }}>{livresEnCours.length}</div>
            <div className="font-special" style={{ fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(26,16,8,0.45)' }}>En cours</div>
          </div>
          <div style={{ background: 'rgba(45,106,45,0.08)', padding: 12, textAlign: 'center' }}>
            <div className="font-playfair" style={{ fontSize: 26, color: '#2d6a2d', fontWeight: 700 }}>{livresLivres.length}</div>
            <div className="font-special" style={{ fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(26,16,8,0.45)' }}>Livrés</div>
          </div>
        </div>
      </div>

      <PerfoStrip />
      <SectionTitle>Portefeuille</SectionTitle>
      <WalletCard
        soldeDisponible={wallet?.solde_disponible ?? 0}
        gainsPrevisionnels={wallet?.gains_previsionnels ?? 0}
        virementSuspendu={wallet?.virement_suspendu ?? false}
      />
      <PayoutRequestButtons user={user} wallet={wallet} onUpdated={setWallet} />
    </div>
  );
}