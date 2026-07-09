import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import QrScannerModal from './QrScannerModal';

export default function PanelScanner() {
  const [scanning, setScanning] = useState(false);
  const [commande, setCommande] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionDone, setActionDone] = useState(false);
  const [user, setUser] = useState(null);
  const [relais, setRelais] = useState(null);
  const [manualId, setManualId] = useState('');
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (!u) return;
      const r = await base44.entities.PointRelais.filter({ gerant_email: u.email });
      setRelais(r[0] || null);
    }).catch(() => {});
  }, []);

  const handleScan = async (text) => {
    setScanning(false);
    setError(null);
    setCommande(null);
    setActionDone(false);
    setLoading(true);
    try {
      // Le QR code contient l'ID de la commande
      const cmdId = text.trim();
      const results = await base44.entities.Commande.filter({ id: cmdId });
      if (!results || results.length === 0) {
        // Essayer par stripe_session_id ou qr_code_depot
        const byQr = await base44.entities.Commande.list('-created_date', 200);
        const found = byQr.find(c => c.qr_code_depot === cmdId || c.stripe_session_id === cmdId || c.id === cmdId);
        if (!found) {
          setError('Bordero introuvable. Vérifiez le QR code.');
          setLoading(false);
          return;
        }
        setCommande(found);
      } else {
        setCommande(results[0]);
      }
    } catch (e) {
      setError('Erreur lors de la lecture du bordero.');
    }
    setLoading(false);
  };

  const handleDepot = async () => {
    if (!commande) return;
    setLoading(true);
    const now = new Date();
    const dateLimite = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await base44.entities.Commande.update(commande.id, {
      statut: 'au_relais',
      date_arrivee_relais: now.toISOString(),
      date_limite_collecte: dateLimite,
    });
    if (relais) {
      await base44.entities.PointRelais.update(relais.id, {
        stock_actuel: (relais.stock_actuel || 0) + 1,
      });
    }
    setActionDone('depot');
    setLoading(false);
  };

  const handleRetrait = async () => {
    if (!commande) return;
    setLoading(true);
    await base44.entities.Commande.update(commande.id, { statut: 'livree' });
    if (relais && relais.stock_actuel > 0) {
      await base44.entities.PointRelais.update(relais.id, {
        stock_actuel: Math.max(0, (relais.stock_actuel || 1) - 1),
      });
    }
    setActionDone('retrait');
    setLoading(false);
  };

  const reset = () => {
    setCommande(null);
    setError(null);
    setActionDone(false);
  };

  const getActionType = (cmd) => {
    if (!cmd) return null;
    if (cmd.statut === 'en_transit') return 'depot';
    if (cmd.statut === 'au_relais') return 'retrait';
    return null;
  };

  const actionType = getActionType(commande);

  return (
    <div>
      {scanning && <QrScannerModal onScan={handleScan} onClose={() => setScanning(false)} />}

      {/* Header */}
      <div style={{
        background: 'var(--bordeaux)', color: 'var(--creme)',
        padding: '18px 20px', marginBottom: 24, position: 'relative', overflow: 'hidden'
      }}>
        <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 60, opacity: 0.1 }}>⬡</span>
        <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.7, marginBottom: 6, fontFamily: 'Special Elite, monospace' }}>
          Point Relais · Action
        </div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
          Scanner un bordero
        </div>
        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, opacity: 0.75, marginTop: 6 }}>
          Dépôt ou retrait d'un colis
        </div>
      </div>

      {/* Scan Button */}
      <button
        onClick={() => { reset(); setScanning(true); }}
        style={{
          width: '100%', background: 'var(--bordeaux)', color: 'var(--creme)',
          border: 'none', padding: '20px 24px', marginBottom: 12,
          fontFamily: 'Special Elite, monospace', fontSize: 13,
          letterSpacing: 4, textTransform: 'uppercase', cursor: 'pointer',
          outline: '2px dashed var(--bordeaux)', outlineOffset: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}
      >
        <span style={{ fontSize: 24 }}>⬡</span>
        Lancer le scanner
      </button>

      {/* Mode de secours — saisie manuelle */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => setShowManual(v => !v)}
          style={{
            width: '100%', background: 'none', border: '1px dashed rgba(26,16,8,0.25)',
            padding: '10px 16px', cursor: 'pointer', color: 'rgba(26,16,8,0.5)',
            fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          ✎ Saisie manuelle de l'ID commande
        </button>
        {showManual && (
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={manualId}
              onChange={e => setManualId(e.target.value)}
              placeholder="ID ou QR code de la commande…"
              style={{
                flex: 1, padding: '10px 12px', fontFamily: 'monospace', fontSize: 12,
                background: 'var(--creme)', border: '1.5px solid hsl(var(--border))',
                color: 'var(--encre)', outline: 'none', letterSpacing: 1,
              }}
              onKeyDown={e => { if (e.key === 'Enter' && manualId.trim()) { reset(); handleScan(manualId.trim()); setManualId(''); setShowManual(false); } }}
            />
            <button
              onClick={() => { if (manualId.trim()) { reset(); handleScan(manualId.trim()); setManualId(''); setShowManual(false); } }}
              disabled={!manualId.trim()}
              style={{
                background: 'var(--bordeaux)', color: 'var(--creme)', border: 'none',
                padding: '10px 16px', cursor: manualId.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 2,
                textTransform: 'uppercase', opacity: manualId.trim() ? 1 : 0.5,
              }}
            >
              OK
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 24, fontFamily: 'IM Fell English, serif', fontStyle: 'italic', color: 'rgba(26,16,8,0.5)' }}>
          Chargement…
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(128,0,32,0.06)', border: '1.5px solid var(--bordeaux)',
          padding: 16, marginBottom: 20, color: 'var(--bordeaux)',
          fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13,
        }}>
          ❌ {error}
          <button onClick={reset} style={{ display: 'block', marginTop: 10, fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', background: 'none', border: '1px dashed var(--bordeaux)', padding: '6px 14px', cursor: 'pointer', color: 'var(--bordeaux)' }}>Réessayer</button>
        </div>
      )}

      {/* Résultat scan */}
      {commande && !actionDone && (
        <div style={{ background: 'var(--papier)', border: '2px solid var(--bordeaux)', padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(26,16,8,0.45)', marginBottom: 12 }}>
            Bordero identifié
          </div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            {commande.livre_titre}
          </div>
          <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.65)', marginBottom: 4 }}>
            ✍️ {commande.livre_auteur || '—'}
          </div>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 11, color: 'rgba(26,16,8,0.5)', marginBottom: 4 }}>
            👤 Lecteur : {commande.lecteur_email}
          </div>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 11, color: 'rgba(26,16,8,0.5)', marginBottom: 4 }}>
            🌍 Destination : {commande.zone_nom}
          </div>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 11, color: 'rgba(26,16,8,0.5)', marginBottom: 16 }}>
            📦 Mode : {commande.mode_livraison === 'express' ? 'Express' : 'Collectif'}
          </div>

          {/* Statut actuel */}
          <div style={{
            display: 'inline-block', padding: '4px 12px', marginBottom: 20,
            border: '1.5px solid var(--sepia)', color: 'var(--sepia)',
            fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
          }}>
            Statut : {commande.statut?.replace(/_/g, ' ')}
          </div>

          {/* Actions */}
          {actionType === 'depot' && (
            <div>
              <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.6)', marginBottom: 14 }}>
                Ce livre arrive au relais. Confirmez la réception du colis.
              </div>
              <button
                onClick={handleDepot}
                disabled={loading}
                style={{
                  width: '100%', background: '#8B6914', color: 'var(--creme)',
                  border: 'none', padding: '14px', fontFamily: 'Special Elite, monospace',
                  fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                📦 Confirmer le dépôt au relais
              </button>
            </div>
          )}

          {actionType === 'retrait' && (
            <div>
              <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.6)', marginBottom: 14 }}>
                Ce livre est au relais. Confirmez la remise au lecteur.
              </div>
              <button
                onClick={handleRetrait}
                disabled={loading}
                style={{
                  width: '100%', background: '#2d6a2d', color: 'var(--creme)',
                  border: 'none', padding: '14px', fontFamily: 'Special Elite, monospace',
                  fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                ✅ Confirmer la remise au lecteur
              </button>
            </div>
          )}

          {!actionType && (
            <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.5)' }}>
              Aucune action possible pour ce statut.
            </div>
          )}

          <button onClick={reset} style={{ marginTop: 12, width: '100%', background: 'none', border: '1px dashed rgba(26,16,8,0.2)', padding: '10px', fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', color: 'rgba(26,16,8,0.45)' }}>
            Annuler
          </button>
        </div>
      )}

      {/* Action confirmée */}
      {actionDone && (
        <div style={{
          background: actionDone === 'depot' ? 'rgba(139,105,20,0.08)' : 'rgba(45,106,45,0.08)',
          border: `2px solid ${actionDone === 'depot' ? '#8B6914' : '#2d6a2d'}`,
          padding: 24, textAlign: 'center', marginBottom: 20,
        }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>{actionDone === 'depot' ? '📦' : '✅'}</div>
          <div className="font-playfair" style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
            {actionDone === 'depot' ? 'Dépôt confirmé !' : 'Remise confirmée !'}
          </div>
          <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.55)' }}>
            {actionDone === 'depot' ? 'Le livre est bien enregistré dans votre stock.' : 'Le lecteur a bien récupéré son livre.'}
          </div>
          <button onClick={reset} style={{ marginTop: 16, fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', background: 'var(--bordeaux)', color: 'var(--creme)', border: 'none', padding: '10px 20px', cursor: 'pointer' }}>
            Nouveau scan
          </button>
        </div>
      )}

      {/* Mode d'emploi */}
      {!commande && !error && !loading && (
        <>
          <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            Mode d'emploi
            <span style={{ flex: 1, height: 1, background: 'repeating-linear-gradient(90deg, var(--bordeaux) 0, var(--bordeaux) 4px, transparent 4px, transparent 8px)' }} />
          </div>
          {[
            { step: '01', text: 'Demandez le bordero imprimé au lecteur ou voyageur' },
            { step: '02', text: 'Appuyez sur "Lancer le scanner" et pointez la caméra vers le QR code' },
            { step: '03', text: 'Le système identifie automatiquement le colis et l\'action à effectuer' },
            { step: '04', text: 'Confirmez le dépôt ou la remise du livre' },
          ].map(({ step, text }) => (
            <div key={step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px dashed hsl(var(--border))' }}>
              <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 11, color: 'var(--bordeaux)', fontWeight: 'bold', minWidth: 24 }}>{step}</span>
              <span style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'hsl(var(--foreground))', lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}