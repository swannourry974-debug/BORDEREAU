import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const SCANNER_ID = 'isbn-scanner-region';

export default function ISBNScanner({ onResult, onClose }) {
  const [torchOn, setTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualISBN, setManualISBN] = useState('');
  const scannerRef = useRef(null);
  const torchCapRef = useRef(false);

  useEffect(() => {
    if (manualMode) return;

    const scanner = new Html5Qrcode(SCANNER_ID, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
      ],
      verbose: false,
    });
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 20, qrbox: { width: 260, height: 140 } },
      (decodedText) => {
        const isbn = decodedText.replace(/[^0-9X]/gi, '');
        if (isbn.length === 10 || isbn.length === 13) {
          scanner.stop().catch(() => {});
          onResult(isbn);
        }
      },
      () => {}
    ).then(() => {
      // Check torch capability
      const track = scanner?.getRunningTrackCapabilities?.();
      torchCapRef.current = !!track?.torch;
    }).catch((err) => {
      const msg = String(err);
      if (msg.includes('permission') || msg.includes('NotAllowed')) {
        setCameraError('permission');
      } else {
        setCameraError('generic');
      }
    });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [manualMode]);

  const toggleTorch = async () => {
    try {
      const track = scannerRef.current?.getRunningTrackCameraCapabilities?.();
      if (track) {
        await track.torchFeature().apply(!torchOn);
        setTorchOn(v => !v);
      }
    } catch {}
  };

  const handleManualSubmit = () => {
    const clean = manualISBN.replace(/[^0-9X]/gi, '');
    if (clean.length === 10 || clean.length === 13) {
      onResult(clean);
    } else {
      onResult(manualISBN.trim()); // titre ou auteur — passé en mode recherche
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(26,16,8,0.92)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px 16px' }}>
        <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 13, color: 'var(--creme)', letterSpacing: 3, textTransform: 'uppercase' }}>
          Scanner un ISBN
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--creme)', fontSize: 20, cursor: 'pointer', opacity: 0.7 }}>✕</button>
      </div>

      {!manualMode && !cameraError && (
        <>
          {/* Scanner box */}
          <div style={{ position: 'relative', width: 300, height: 200, border: '2px dashed var(--sepia)', background: '#000' }}>
            <div id={SCANNER_ID} style={{ width: '100%', height: '100%' }} />
            {/* Corner decorations */}
            {['tl','tr','bl','br'].map(c => (
              <div key={c} style={{
                position: 'absolute',
                width: 16, height: 16,
                borderColor: 'var(--bordeaux)',
                borderStyle: 'solid',
                top: c.includes('t') ? -2 : 'auto',
                bottom: c.includes('b') ? -2 : 'auto',
                left: c.includes('l') ? -2 : 'auto',
                right: c.includes('r') ? -2 : 'auto',
                borderWidth: c.includes('t') ? '3px 0 0 3px' : c === 'tr' ? '3px 3px 0 0' : c === 'bl' ? '0 0 3px 3px' : '0 3px 3px 0',
              }} />
            ))}
          </div>

          <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(253,252,240,0.5)', marginTop: 12, marginBottom: 20, textAlign: 'center' }}>
            Pointez vers le code-barres du livre
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={toggleTorch} style={{
              background: torchOn ? 'var(--sepia)' : 'transparent',
              border: '1px dashed var(--sepia)', color: 'var(--creme)',
              fontFamily: 'Special Elite, monospace', fontSize: 11, letterSpacing: 2,
              padding: '7px 16px', cursor: 'pointer', textTransform: 'uppercase',
            }}>
              {torchOn ? '🔦 Flash ON' : '🔦 Flash OFF'}
            </button>
            <button onClick={() => setManualMode(true)} style={{
              background: 'transparent', border: '1px dashed rgba(253,252,240,0.3)',
              color: 'rgba(253,252,240,0.7)', fontFamily: 'Special Elite, monospace',
              fontSize: 11, letterSpacing: 2, padding: '7px 16px', cursor: 'pointer', textTransform: 'uppercase',
            }}>
              ✏️ Saisie manuelle
            </button>
          </div>
        </>
      )}

      {/* Erreur caméra - permission refusée */}
      {cameraError === 'permission' && (
        <div style={{ maxWidth: 320, textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
          <div style={{ fontFamily: 'Special Elite, monospace', color: 'var(--creme)', fontSize: 14, marginBottom: 8, letterSpacing: 1 }}>
            Accès caméra refusé
          </div>
          <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(253,252,240,0.6)', marginBottom: 20, lineHeight: 1.6 }}>
            Autorisez l'accès à la caméra dans les réglages de votre navigateur, puis réessayez.
          </div>
          <button onClick={() => setManualMode(true)} style={{
            background: 'var(--bordeaux)', color: 'var(--creme)', border: 'none',
            fontFamily: 'Special Elite, monospace', fontSize: 12, letterSpacing: 2,
            padding: '10px 20px', cursor: 'pointer', textTransform: 'uppercase',
          }}>
            ✏️ Saisir manuellement
          </button>
        </div>
      )}

      {/* Erreur générique */}
      {cameraError === 'generic' && !manualMode && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'rgba(253,252,240,0.6)', fontFamily: 'IM Fell English, serif', fontStyle: 'italic', marginBottom: 16 }}>
            Caméra indisponible
          </div>
          <button onClick={() => setManualMode(true)} style={{
            background: 'var(--bordeaux)', color: 'var(--creme)', border: 'none',
            fontFamily: 'Special Elite, monospace', fontSize: 12, letterSpacing: 2,
            padding: '10px 20px', cursor: 'pointer', textTransform: 'uppercase',
          }}>
            ✏️ Saisir manuellement
          </button>
        </div>
      )}

      {/* Mode saisie manuelle */}
      {manualMode && (
        <div style={{ width: '100%', maxWidth: 360, padding: '0 20px' }}>
          <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(253,252,240,0.6)', marginBottom: 16, textAlign: 'center', lineHeight: 1.6 }}>
            Saisissez un ISBN (10 ou 13 chiffres)<br />ou un titre / auteur pour rechercher.
          </div>
          <input
            autoFocus
            type="text"
            value={manualISBN}
            onChange={e => setManualISBN(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
            placeholder="9782070360024 ou titre..."
            style={{
              width: '100%', padding: '12px 14px', fontSize: 15,
              background: 'rgba(253,252,240,0.08)', border: '1px solid rgba(253,252,240,0.25)',
              color: 'var(--creme)', fontFamily: 'Georgia, serif', outline: 'none',
              boxSizing: 'border-box', marginBottom: 12,
            }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleManualSubmit} style={{
              flex: 1, background: 'var(--bordeaux)', color: 'var(--creme)', border: 'none',
              fontFamily: 'Special Elite, monospace', fontSize: 12, letterSpacing: 2,
              padding: '11px 0', cursor: 'pointer', textTransform: 'uppercase',
            }}>
              Rechercher
            </button>
            {!cameraError && (
              <button onClick={() => setManualMode(false)} style={{
                background: 'transparent', color: 'rgba(253,252,240,0.6)',
                border: '1px dashed rgba(253,252,240,0.3)',
                fontFamily: 'Special Elite, monospace', fontSize: 11, letterSpacing: 1,
                padding: '11px 14px', cursor: 'pointer', textTransform: 'uppercase',
              }}>
                📷 Caméra
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}