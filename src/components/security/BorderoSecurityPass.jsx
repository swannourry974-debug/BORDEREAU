import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { base44 } from '@/api/base44Client';

export default function BorderoSecurityPass({ commande }) {
  const [secureCommande, setSecureCommande] = useState(commande);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!commande?.id || commande.statut !== 'au_relais') return;
    if (commande.qr_code_token && commande.visuel_bordero_url) return;
    setLoading(true);
    base44.functions.invoke('genererQrCommande', { commande_id: commande.id })
      .then(res => setSecureCommande(res.data.commande || commande))
      .catch(err => setError(err?.response?.data?.error || 'Visuel de sécurité indisponible.'))
      .finally(() => setLoading(false));
  }, [commande?.id]);

  if (commande?.statut !== 'au_relais') return null;
  const token = secureCommande?.qr_code_token;

  return (
    <div style={{ background: 'rgba(128,0,32,0.06)', border: '2px solid var(--bordeaux)', padding: 14, marginBottom: 14 }}>
      <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 8 }}>
        Authentification Bordero · Retrait sécurisé
      </div>
      {loading && <div className="font-fell italic text-[12px] text-foreground/50">Génération du visuel et du QR sécurisé…</div>}
      {error && <div className="font-fell italic text-[12px] text-bordeaux">{error}</div>}
      {!loading && secureCommande?.visuel_bordero_url && (
        <img src={secureCommande.visuel_bordero_url} alt={`Visuel Bordero ${secureCommande.visuel_bordero_serie || ''}`} style={{ width: '100%', border: '1.5px solid var(--encre)', marginBottom: 12 }} />
      )}
      {!loading && token && (
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: '#fff', padding: 10, border: '1.5px solid var(--encre)' }}>
            <QRCodeSVG value={token} size={142} bgColor="#ffffff" fgColor="#1a1008" level="M" />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div className="font-playfair" style={{ fontWeight: 700, fontSize: 16 }}>Présentez ce QR au point relais</div>
            <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.6)', lineHeight: 1.6, marginTop: 4 }}>
              Le badge {secureCommande.format_livre_bordero} correspond uniquement au format physique du livre.
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(26,16,8,0.45)', marginTop: 8, wordBreak: 'break-all' }}>
              {secureCommande.visuel_bordero_serie || 'Visuel'} · {secureCommande.id}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}