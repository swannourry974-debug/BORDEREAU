import React, { useState } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import SignalementPanel from './SignalementPanel';

export default function ScanResult({ data, onConfirm, onClose }) {
  const [showSignalement, setShowSignalement] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDepot = data.type === 'depot';

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setConfirmed(true);
      if (navigator.vibrate) navigator.vibrate(200);
    }, 1200);
  };

  if (showSignalement) {
    return (
      <SignalementPanel
        data={data}
        onBack={() => setShowSignalement(false)}
        onClose={onClose}
      />
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'var(--creme)',
      display: 'flex', flexDirection: 'column',
      padding: '40px 20px 30px',
      maxWidth: 480, margin: '0 auto', overflowY: 'auto'
    }}>
      {/* Badge type */}
      <div style={{
        display: 'inline-block', alignSelf: 'flex-start',
        background: isDepot ? '#800020' : '#2d5a27',
        color: '#FDFCF0',
        padding: '4px 14px',
        fontFamily: 'Special Elite, monospace',
        fontSize: 10, letterSpacing: 4, textTransform: 'uppercase',
        marginBottom: 8
      }}>
        {isDepot ? '▼ DÉPÔT DÉTECTÉ' : '▲ RETRAIT DÉTECTÉ'}
      </div>

      {/* Titre */}
      <div style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: 28, fontWeight: 700,
        color: 'var(--encre)', lineHeight: 1.2, marginBottom: 24
      }}>
        {isDepot ? 'Réception d\'un colis' : 'Remise à l\'usager'}
      </div>

      {/* Fiche bordereau */}
      <div style={{
        background: 'var(--papier)',
        border: '1px solid var(--papier-fonce)',
        padding: 20, marginBottom: 20
      }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(26,16,8,0.5)', marginBottom: 4 }}>Ouvrage</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 700, fontStyle: 'italic', color: 'var(--encre)' }}>{data.livre}</div>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 11, color: 'rgba(26,16,8,0.6)', marginTop: 2 }}>{data.auteur}</div>
        </div>

        <div style={{ borderTop: '1px dashed rgba(26,16,8,0.15)', paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(26,16,8,0.5)', marginBottom: 4 }}>
              {isDepot ? 'Voyageur' : 'Lecteur'}
            </div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 14, color: 'var(--encre)' }}>{data.utilisateur}</div>
          </div>
          {data.emplacement && !isDepot && (
            <div>
              <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(26,16,8,0.5)', marginBottom: 4 }}>Emplacement</div>
              <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 14, color: 'var(--encre)' }}>{data.emplacement}</div>
            </div>
          )}
          <div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(26,16,8,0.5)', marginBottom: 4 }}>Référence</div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 12, color: 'rgba(26,16,8,0.6)' }}>#{data.ref}</div>
          </div>
        </div>
      </div>

      {/* Instruction */}
      <div style={{
        background: isDepot ? 'rgba(128,0,32,0.06)' : 'rgba(45,90,39,0.06)',
        border: `1px dashed ${isDepot ? '#800020' : '#2d5a27'}`,
        padding: '14px 16px', marginBottom: 24,
        fontFamily: 'IM Fell English, serif', fontStyle: 'italic',
        fontSize: 14, color: 'var(--encre)', lineHeight: 1.6
      }}>
        {isDepot
          ? 'Placer le livre sur l\'étagère de stockage et confirmer sa réception.'
          : `Remettre le livre "${data.livre}" à l'utilisateur qui se présente.`}
      </div>

      {/* Bouton confirmation */}
      {!confirmed ? (
        <button
          onClick={handleConfirm}
          disabled={loading}
          style={{
            background: '#800020', color: '#FDFCF0', border: 'none',
            padding: '16px 24px', width: '100%',
            fontFamily: 'Special Elite, monospace', fontSize: 12,
            letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer',
            outline: '2px dashed #800020', outlineOffset: 3,
            opacity: loading ? 0.7 : 1, transition: 'all 0.2s'
          }}
        >
          {loading ? 'Validation en cours...' : (isDepot ? '✓ Confirmer la réception' : '✓ Valider la remise')}
        </button>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <CheckCircle size={48} color="#2d5a27" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: '#2d5a27', marginBottom: 6 }}>
            {isDepot ? 'Réception confirmée !' : 'Remise validée !'}
          </div>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 11, color: 'rgba(26,16,8,0.5)', marginBottom: 24 }}>
            {isDepot ? 'Le lecteur a été notifié. Votre commission est enregistrée.' : 'Les fonds du voyageur ont été débloqués.'}
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

      {/* Signalement */}
      {!confirmed && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={() => setShowSignalement(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'IM Fell English, serif', fontStyle: 'italic',
              fontSize: 12, color: 'rgba(26,16,8,0.4)', textDecoration: 'underline',
              textDecorationStyle: 'dotted'
            }}
          >
            Un problème avec cet utilisateur ?
          </button>
        </div>
      )}
    </div>
  );
}