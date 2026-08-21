import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { base44 } from '@/api/base44Client';

export default function ConfirmationBordero({ commandeId, bookTitle, onClose }) {
  const [token, setToken] = useState(commandeId);

  useEffect(() => {
    if (!commandeId) return;
    base44.functions.invoke('genererQrCommande', { commande_id: commandeId })
      .then(res => setToken(res.data.token || commandeId))
      .catch(() => setToken(commandeId));
  }, [commandeId]);

  return (
    <div style={{
      background: 'var(--papier)', border: '2px solid var(--encre)',
      padding: 24, marginBottom: 20, textAlign: 'center',
      boxShadow: '5px 5px 0 rgba(26,16,8,0.15)',
      animation: 'fadeSlideIn 0.4s ease both',
    }}>
      <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(26,16,8,0.45)', marginBottom: 8 }}>
        Commande enregistrée
      </div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
        {bookTitle}
      </div>
      <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.55)', marginBottom: 20 }}>
        Présentez ce QR code au point relais lors du dépôt ou du retrait
      </div>

      {/* QR Code */}
      <div style={{
        display: 'inline-block', padding: 16,
        background: 'white', border: '2px solid var(--encre)',
        marginBottom: 16,
      }}>
        <QRCodeSVG
          value={token}
          size={180}
          bgColor="#ffffff"
          fgColor="#1a1008"
          level="M"
        />
      </div>

      <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, color: 'rgba(26,16,8,0.4)', marginBottom: 20 }}>
        {token}
      </div>

      <button
        onClick={onClose}
        style={{
          background: 'var(--bordeaux)', color: 'var(--creme)',
          border: 'none', padding: '12px 28px',
          fontFamily: 'Special Elite, monospace', fontSize: 10,
          letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer',
        }}
      >
        Fermer
      </button>
    </div>
  );
}