import React from 'react';

export default function WalletCard({ soldeDisponible, gainsPrevisionnels, virementSuspendu, hideTransfer }) {
  const MIN_VIREMENT = 20;
  const peutVirer = soldeDisponible >= MIN_VIREMENT && !virementSuspendu;
  const manque = Math.max(0, MIN_VIREMENT - soldeDisponible).toFixed(2);

  return (
    <div className="mb-5 overflow-hidden" style={{
      background: 'var(--encre)',
      color: 'var(--creme)',
      padding: '18px 20px',
      position: 'relative',
      borderRadius: 'var(--bordero-radius-md)',
      boxShadow: 'var(--bordero-shadow-soft)',
      border: '1px solid rgba(199,161,90,0.32)',
    }}>
      <span aria-hidden="true" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 80, opacity: 0.06, fontFamily: "'Playfair Display', serif" }}>€</span>

      <div className="bordero-ui" style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.66, marginBottom: 14 }}>
        Portefeuille Voyageur
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <div className="bordero-ui" style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.6, marginBottom: 4 }}>
            Solde disponible
          </div>
          <div className="bordero-title" style={{ fontSize: 26, color: 'var(--sepia)' }}>
            {soldeDisponible.toFixed(2)} €
          </div>
        </div>
        <div>
          <div className="bordero-ui" style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.6, marginBottom: 4 }}>
            Gains prévisionnels
          </div>
          <div className="bordero-title" style={{ fontSize: 26, color: 'var(--or-clair)' }}>
            {gainsPrevisionnels.toFixed(2)} €
          </div>
        </div>
      </div>

      {!hideTransfer && (
        <button
          type="button"
          disabled={!peutVirer}
          onClick={() => alert('Transfert bancaire initié !')}
          className="bordero-ui"
          style={{
            width: '100%',
            minHeight: 44,
            background: peutVirer ? 'var(--cta-orange)' : 'rgba(253,252,240,0.10)',
            color: peutVirer ? 'var(--cta-foreground)' : 'rgba(253,252,240,0.5)',
            border: peutVirer ? '1px solid var(--cta-orange-dark)' : '1px dashed rgba(253,252,240,0.2)',
            padding: '12px 16px',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: 'uppercase',
            cursor: peutVirer ? 'pointer' : 'not-allowed',
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
