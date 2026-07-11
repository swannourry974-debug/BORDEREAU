import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Validation de remise par code secret à 3 chiffres.
 * Débloque la ligne de paiement Stripe vers le voyageur/relais.
 */
export default function CodeSecretValidation({ mission, commande, onValidated, onCancel }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const commandeId = commande?.id || mission?.commande_id || mission?.commandeId;

  const handleValidate = async () => {
    setError('');
    if (code.length !== 3) {
      setError('Le code doit comporter 3 chiffres.');
      return;
    }
    if (!commandeId) {
      setError('Commande introuvable pour cette remise.');
      return;
    }
    setLoading(true);
    try {
      await base44.functions.invoke('validerLivraison', {
        commandeId,
        missionId: mission?.id,
        code,
      });
      setSuccess(true);
      setTimeout(() => onValidated?.(), 1500);
    } catch (e) {
      setError(e?.response?.data?.error || 'Code incorrect. Vérifiez avec le lecteur.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        background: 'rgba(45,106,45,0.1)', border: '2px solid #2d6a2d',
        padding: '24px', textAlign: 'center',
        animation: 'fadeSlideIn 0.3s ease',
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
        <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', color: '#2d6a2d' }}>
          Remise confirmée
        </div>
        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: '#2d6a2d', marginTop: 6 }}>
          Le paiement sera débloqué sous 24h.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--papier)', border: '2px solid var(--encre)',
      padding: 20, boxShadow: '5px 5px 0 rgba(26,16,8,0.15)',
    }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>
          🔐 Code de remise
        </div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 700, color: 'var(--encre)' }}>
          {mission?.livre || commande?.livre_titre || 'Livre'}
        </div>
        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 4, lineHeight: 1.5 }}>
          Demandez au lecteur son code secret à 3 chiffres pour valider la remise et débloquer le paiement.
        </div>
      </div>

      {/* Inputs 3 chiffres */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
        {[0, 1, 2].map(i => (
          <input
            key={i}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={code[i] || ''}
            onChange={e => {
              const v = e.target.value.replace(/\D/, '');
              const arr = code.split('');
              arr[i] = v;
              const newCode = arr.join('').slice(0, 3);
              setCode(newCode);
              setError('');
              // Auto-focus next
              if (v && i < 2) {
                const next = document.getElementById(`code-digit-${i + 1}`);
                if (next) next.focus();
              }
            }}
            id={`code-digit-${i}`}
            style={{
              width: 56, height: 68, textAlign: 'center',
              fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700,
              border: error ? '2px solid #b41414' : '2px solid hsl(var(--border))',
              background: 'var(--creme)', color: 'var(--encre)',
              outline: 'none',
            }}
          />
        ))}
      </div>

      {error && (
        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: '#b41414', textAlign: 'center', marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleValidate}
          disabled={loading || code.length !== 3}
          style={{
            flex: 1, padding: '12px 0',
            background: code.length === 3 ? 'var(--bordeaux)' : 'hsl(var(--muted))',
            color: code.length === 3 ? 'var(--creme)' : 'hsl(var(--muted-foreground))',
            border: 'none', fontFamily: 'Special Elite, monospace',
            fontSize: 12, letterSpacing: 3, textTransform: 'uppercase',
            cursor: code.length === 3 ? 'pointer' : 'not-allowed',
            boxShadow: code.length === 3 ? '3px 3px 0 var(--bordeaux-dark)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {loading ? '⟳ Validation...' : '✦ Valider la remise'}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '12px 16px', background: 'transparent',
            border: '1.5px dashed hsl(var(--border))',
            fontFamily: 'Special Elite, monospace', fontSize: 11, cursor: 'pointer',
            color: 'hsl(var(--muted-foreground))',
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}