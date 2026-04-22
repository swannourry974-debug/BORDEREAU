import React from 'react';
import { WelcomeCard, SectionTitle, BtnCoupon, EtagereItem } from './shared';

const STOCK = [
  { id: 1, icon: '📗', title: "L'Élégance du hérisson", sub: 'Déposé par : @marc.v · il y a 2j' },
  { id: 2, icon: '📘', title: 'Le Petit Prince', sub: 'Déposé par : @sophie.k · il y a 5j' },
  { id: 3, icon: '📕', title: 'Astérix T.2', sub: 'Déposé par : @thomas.r · il y a 1j' },
];

export default function PanelStock() {
  return (
    <div>
      <WelcomeCard
        eyebrow="Café Lumière · Miami, FL"
        title="Tableau de Bord<br>Point Relais"
        sub="Tiers de confiance certifié BORDEREAU"
      />

      {/* Stock header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: 'var(--papier)', border: '1.5px solid var(--encre)',
        padding: '14px 16px', marginBottom: 16, boxShadow: '2px 2px 0 rgba(26,16,8,0.12)',
      }}>
        <span style={{ fontSize: 36 }}>📚</span>
        <div>
          <div className="font-playfair" style={{ fontSize: 36, fontWeight: 700, color: 'var(--bordeaux)', lineHeight: 1 }}>3</div>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: 'rgba(26,16,8,0.5)' }}>Livres en attente</div>
        </div>
        {/* QR placeholder */}
        <div style={{
          width: 60, height: 60, background: 'var(--encre)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginLeft: 'auto',
        }}>
          <span className="font-special" style={{ color: 'var(--creme)', fontSize: 12, letterSpacing: 1 }}>QR</span>
        </div>
      </div>

      {/* Scan buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <BtnCoupon
          onClick={() => alert("Scanner le dépôt d'un voyageur")}
          style={{ padding: 16, fontSize: 11, textAlign: 'center', lineHeight: 1.6 }}
        >
          📥 Scanner<br /><span style={{ fontSize: 9, opacity: 0.7, letterSpacing: 1 }}>DÉPÔT</span>
        </BtnCoupon>
        <BtnCoupon
          secondary
          onClick={() => alert("Scanner le retrait d'un lecteur")}
          style={{ padding: 16, fontSize: 11, textAlign: 'center', lineHeight: 1.6 }}
        >
          📤 Scanner<br /><span style={{ fontSize: 9, opacity: 0.7, letterSpacing: 1 }}>RETRAIT</span>
        </BtnCoupon>
      </div>

      <SectionTitle>Stock actuel</SectionTitle>

      <div style={{ paddingLeft: 28 }}>
        {STOCK.map(item => (
          <EtagereItem
            key={item.id}
            icon={item.icon}
            statusClass="auRelais"
            title={item.title}
            sub={item.sub}
            stampColor="#8B6914"
            stampLabel="EN ATTENTE"
          />
        ))}
      </div>
    </div>
  );
}