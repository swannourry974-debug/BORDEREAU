import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

const MOTIFS = [
  { id: 'horaires', label: 'Arrivé après la fermeture' },
  { id: 'agressif', label: 'Ton agressif / impolitesse' },
  { id: 'livre_abime', label: 'Livre abîmé / non conforme' },
  { id: 'no_show', label: 'Ne s\'est pas présenté' },
  { id: 'autre', label: 'Autre comportement' },
];

export default function SignalementPanel({ data, onBack, onClose }) {
  const [selected, setSelected] = useState(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = () => {
    if (!selected) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1000);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 101,
      background: 'var(--creme)',
      display: 'flex', flexDirection: 'column',
      padding: '30px 20px',
      maxWidth: 480, margin: '0 auto'
    }}>
      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'Special Elite, monospace', fontSize: 11,
        letterSpacing: 2, textTransform: 'uppercase',
        color: 'rgba(26,16,8,0.5)', marginBottom: 24, padding: 0
      }}>
        <ArrowLeft size={14} /> Retour
      </button>

      <div style={{
        background: 'rgba(128,0,32,0.08)', border: '1px dashed #800020',
        padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start'
      }}>
        <AlertTriangle size={16} color="#800020" style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 11, lineHeight: 1.7, color: 'var(--encre)' }}>
          Ce signalement sera envoyé à l'équipe Bordero. Après <strong>2 signalements</strong>, le compte de l'utilisateur sera suspendu pour vérification.
        </div>
      </div>

      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
        Signaler un comportement
      </div>
      <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 11, color: 'rgba(26,16,8,0.5)', marginBottom: 24, letterSpacing: 1 }}>
        {data.utilisateur} · Réf #{data.ref}
      </div>

      {!sent ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {MOTIFS.map(m => (
              <button
                key={m.id}
                onClick={() => setSelected(m.id)}
                style={{
                  background: selected === m.id ? 'rgba(128,0,32,0.08)' : 'transparent',
                  border: selected === m.id ? '1.5px solid #800020' : '1px dashed rgba(26,16,8,0.25)',
                  padding: '12px 16px', textAlign: 'left', cursor: 'pointer',
                  fontFamily: 'Special Elite, monospace', fontSize: 13,
                  color: selected === m.id ? '#800020' : 'var(--encre)',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10
                }}
              >
                <span style={{
                  width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                  border: selected === m.id ? '4px solid #800020' : '1.5px solid rgba(26,16,8,0.3)',
                  transition: 'all 0.15s'
                }} />
                {m.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleSend}
            disabled={!selected || loading}
            style={{
              background: selected ? '#800020' : 'rgba(26,16,8,0.1)',
              color: selected ? '#FDFCF0' : 'rgba(26,16,8,0.4)',
              border: 'none', padding: '14px 24px', width: '100%',
              fontFamily: 'Special Elite, monospace', fontSize: 11,
              letterSpacing: 3, textTransform: 'uppercase', cursor: selected ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Envoi...' : 'Envoyer le signalement'}
          </button>
        </>
      ) : (
        <div style={{ textAlign: 'center', paddingTop: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#800020' }}>
            Signalement envoyé
          </div>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 11, color: 'rgba(26,16,8,0.5)', lineHeight: 1.8, marginBottom: 28 }}>
            L'équipe Bordero a été alertée.<br />Merci de protéger la communauté.
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px dashed rgba(26,16,8,0.3)',
            padding: '10px 20px', fontFamily: 'Special Elite, monospace',
            fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
            cursor: 'pointer', color: 'var(--encre)'
          }}>
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}