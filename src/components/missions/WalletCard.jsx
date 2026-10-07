import React from 'react';

export default function WalletCard({ soldeDisponible, gainsPrevisionnels, virementSuspendu, hideTransfer }) {
  const MIN_VIREMENT = 20;
  const peutVirer = soldeDisponible >= MIN_VIREMENT && !virementSuspendu;
  const manque = Math.max(0, MIN_VIREMENT - soldeDisponible).toFixed(2);

  return (
    <div style={{
      background: 'var(--encre)',
      color: 'var(--creme)',
      padding: '18px 20px',
      marginBottom: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decoration */}
      <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 80, opacity: 0.05, fontFamily: 'Playfair Display, serif' }}>€</span>

      <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.6, marginBottom: 14 }}>
        Portefeuille Voyageur
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.55, marginBottom: 4 }}>
            Solde disponible
          </div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, color: '#a8d5a2' }}>
            {soldeDisponible.toFixed(2)} €
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.55, marginBottom: 4 }}>
            Gains prévisionnels
          </div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, color: '#d4b896' }}>
            {gainsPrevisionnels.toFixed(2)} €
          </div>
        </div>
      </div>

      {!hideTransfer && (
        <button
          disabled={!peutVirer}
          onClick={() => alert('Transfert bancaire initié !')}
          style={{
            width: '100%',
            background: peutVirer ? '#a8d5a2' : 'rgba(253,252,240,0.1)',
            color: peutVirer ? '#1a1008' : 'rgba(253,252,240,0.35)',
            border: peutVirer ? 'none' : '1px dashed rgba(253,252,240,0.2)',
            padding: '12px 16px',
            fontFamily: 'Special Elite, monospace',
            fontSize: 10,
            letterSpacing: 3,
            textTransform: 'uppercase',
            cursor: peutVirer ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          {virementSuspendu
            ? '🔒 Virement suspendu (audit en cours)'
            : peutVirer
            ? '✦ Transférer vers ma banque'
            : `Encore ${manque} € pour débloquer votre virement`}
        </button>
      )}
    </div>
  );
}