import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import WalletCard from '@/components/missions/WalletCard';
import { SectionTitle, PerfoStrip } from '@/components/bordereau/shared';
import HistoriqueVoyageur from './HistoriqueVoyageur';

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
      setMissions(allMissions);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const aValider = missions.filter(m => m.statut === 'acceptee');
  const aDeposer = missions.filter(m => m.statut === 'engagee');

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.4)' }}>
          Chargement…
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Bonjour */}
      <div style={{ marginBottom: 20 }}>
        <div className="font-playfair" style={{ fontSize: 22, fontWeight: 700, color: 'var(--encre)' }}>
          Bonjour {user?.full_name?.split(' ')[0] || 'Voyageur'} ✦
        </div>
        <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.5)', marginTop: 2 }}>
          Votre tableau de bord voyageur
        </div>
      </div>

      {/* Portefeuille */}
      <SectionTitle>Portefeuille</SectionTitle>
      <WalletCard
        soldeDisponible={wallet?.solde_disponible ?? 0}
        gainsPrevisionnels={wallet?.gains_previsionnels ?? 0}
        virementSuspendu={wallet?.virement_suspendu ?? false}
      />

      <PerfoStrip />

      {/* Mes Actions */}
      <SectionTitle>Mes Actions</SectionTitle>

      {/* Livres à valider */}
      <div style={{
        background: 'var(--papier)',
        border: '1.5px solid rgba(26,16,8,0.2)',
        padding: 16,
        marginBottom: 12,
        boxShadow: '3px 3px 0 rgba(26,16,8,0.10)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: aValider.length > 0 ? 12 : 0 }}>
          <div>
            <div className="font-special" style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--encre)' }}>
              📷 Livres à valider
            </div>
            <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.5)', marginTop: 3 }}>
              Scanner le ticket & code-barres
            </div>
          </div>
          <div style={{
            background: aValider.length > 0 ? 'var(--bordeaux)' : 'rgba(26,16,8,0.1)',
            color: aValider.length > 0 ? 'var(--creme)' : 'rgba(26,16,8,0.4)',
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Special Elite, monospace', fontSize: 14, fontWeight: 700,
          }}>
            {aValider.length}
          </div>
        </div>
        {aValider.length > 0 && aValider.map(m => (
          <div key={m.id} style={{
            borderTop: '1px dashed rgba(26,16,8,0.15)',
            paddingTop: 10,
            fontFamily: 'IM Fell English, serif',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--encre)',
          }}>
            📚 {m.livre} → {m.ville_destination}
          </div>
        ))}
        {aValider.length === 0 && (
          <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.35)', marginTop: 4 }}>
            Aucun livre en attente de validation.
          </div>
        )}
      </div>

      {/* Historique des trajets */}
      <PerfoStrip />
      <SectionTitle>Historique & Réputation</SectionTitle>
      <HistoriqueVoyageur userEmail={user?.email} />

      <PerfoStrip />

      {/* Livres à déposer */}
      <div style={{
        background: 'var(--papier)',
        border: '1.5px solid rgba(26,16,8,0.2)',
        padding: 16,
        marginBottom: 12,
        boxShadow: '3px 3px 0 rgba(26,16,8,0.10)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: aDeposer.length > 0 ? 12 : 0 }}>
          <div>
            <div className="font-special" style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--encre)' }}>
              📦 Livres à déposer
            </div>
            <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.5)', marginTop: 3 }}>
              À remettre au point relais à destination
            </div>
          </div>
          <div style={{
            background: aDeposer.length > 0 ? '#1a3a5c' : 'rgba(26,16,8,0.1)',
            color: aDeposer.length > 0 ? 'var(--creme)' : 'rgba(26,16,8,0.4)',
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Special Elite, monospace', fontSize: 14, fontWeight: 700,
          }}>
            {aDeposer.length}
          </div>
        </div>
        {aDeposer.length > 0 && aDeposer.map(m => (
          <div key={m.id} style={{
            borderTop: '1px dashed rgba(26,16,8,0.15)',
            paddingTop: 10,
            fontFamily: 'IM Fell English, serif',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--encre)',
          }}>
            📚 {m.livre} → {m.ville_destination}
          </div>
        ))}
        {aDeposer.length === 0 && (
          <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.35)', marginTop: 4 }}>
            Aucun livre à déposer pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}