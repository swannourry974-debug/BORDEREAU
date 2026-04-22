import React, { useState } from 'react';
import { WelcomeCard, SectionTitle, BtnCoupon, PerfoStrip } from './shared';

const INITIAL_MISSIONS = [
  { id: 1, ville: 'MIAMI, FL', date: "Accepte jusqu'au 26 avril · Vol Air France AF038", book: 'Le Petit Prince', type: 'Poche', weight: '180g', commission: '10 €', engaged: false },
  { id: 2, ville: 'MIAMI, FL', date: "Accepte jusqu'au 26 avril", book: "L'Élégance du hérisson", type: 'Poche', weight: '310g', commission: '10 €', engaged: false },
  { id: 3, ville: 'MIAMI, FL', date: 'Ticket scanné · Achat confirmé', book: 'Astérix T.1', type: 'BD', weight: '250g', commission: '10 €', engaged: true },
];

function MissionCard({ mission, onAccept }) {
  const [loading, setLoading] = useState(false);

  const accept = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onAccept(mission.id);
      alert("Mission acceptée !\n\n📌 Scannez votre ticket de caisse pour confirmer l'achat et verrouiller la commande.");
    }, 800);
  };

  return (
    <div style={{
      background: 'var(--papier)',
      border: '1.5px solid var(--encre)',
      padding: 16,
      marginBottom: 12,
      position: 'relative',
      boxShadow: '3px 3px 0 rgba(26,16,8,0.12)',
      animation: 'fadeSlideIn 0.4s ease both',
      opacity: mission.engaged ? 0.75 : 1,
    }}>
      {/* Corner triangle */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        borderStyle: 'solid', borderWidth: '0 32px 32px 0',
        borderColor: `transparent var(--bordeaux) transparent transparent`,
      }} />

      <div className="font-special" style={{ fontSize: 18, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>
        {mission.ville}
      </div>
      <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.55)', marginBottom: 12 }}>
        {mission.date}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(26,16,8,0.6)' }}>
        📚 <em>{mission.book}</em> · {mission.type} · {mission.weight}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed rgba(26,16,8,0.2)', paddingTop: 10, marginTop: 8 }}>
        <div>
          <span className="font-playfair" style={{ fontSize: 22, fontWeight: 700, color: mission.engaged ? 'rgba(26,16,8,0.4)' : 'var(--bordeaux)' }}>
            {mission.commission}
          </span>
          <span style={{ fontSize: 9, color: 'rgba(26,16,8,0.5)', letterSpacing: 1, display: 'block', marginTop: -2 }}>
            {mission.engaged ? 'En séquestre' : 'Commission'}
          </span>
        </div>
        {mission.engaged ? (
          <BtnCoupon secondary disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>ENGAGÉ</BtnCoupon>
        ) : (
          <BtnCoupon onClick={accept}>{loading ? '⟳ ...' : 'Accepter'}</BtnCoupon>
        )}
      </div>

      {mission.engaged && (
        <div className="font-special animate-stamp" style={{
          position: 'absolute', right: 14, top: '50%',
          transform: 'translateY(-50%) rotate(-12deg)',
          border: '3px solid #1a3a5c', color: '#1a3a5c',
          fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
          padding: '4px 8px', opacity: 0.7, pointerEvents: 'none',
        }}>ENGAGÉ</div>
      )}
    </div>
  );
}

export default function PanelMissions() {
  const [missions, setMissions] = useState(INITIAL_MISSIONS);

  const acceptMission = (id) => {
    setMissions(m => m.map(mission =>
      mission.id === id
        ? { ...mission, engaged: true, date: 'Ticket scanné · Achat confirmé' }
        : mission
    ));
  };

  return (
    <div>
      <WelcomeCard
        eyebrow="Votre prochain vol"
        title="Paris → Miami<br>28 Avril 2026"
        sub="💰 Portefeuille : 40,00 € · 4 missions complètes"
      />

      <SectionTitle>Missions disponibles</SectionTitle>

      {missions.map(m => (
        <MissionCard key={m.id} mission={m} onAccept={acceptMission} />
      ))}

      <PerfoStrip />

      <SectionTitle>Déclarer un nouveau vol</SectionTitle>

      <div style={{ background: 'var(--papier)', border: '1.5px dashed rgba(26,16,8,0.3)', padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✈️</div>
        <div className="font-fell" style={{ fontSize: 12, color: 'rgba(26,16,8,0.5)', marginBottom: 14, fontStyle: 'italic' }}>
          Vous avez un autre voyage prévu ?
        </div>
        <BtnCoupon onClick={() => alert('Formulaire de déclaration de vol')}>+ Déclarer un vol</BtnCoupon>
      </div>
    </div>
  );
}