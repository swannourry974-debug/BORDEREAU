import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X } from 'lucide-react';

export default function ISBNScanner({ onResult, onClose }) {
  const scannerRef = useRef(null);
  const startedRef = useRef(false);
  const [error, setError] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualValue, setManualValue] = useState('');

  useEffect(() => {
    const scannerId = 'isbn-reader';
    let html5Qrcode;
    try {
      html5Qrcode = new Html5Qrcode(scannerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
        ],
        verbose: false,
      });
    } catch {
      setError('Caméra indisponible.');
      return;
    }
    scannerRef.current = html5Qrcode;

    html5Qrcode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 140 } },
      (decodedText) => {
        const isbn = decodedText.replace(/[^0-9X]/gi, '');
        if (isbn.length === 10 || isbn.length === 13) {
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          html5Qrcode.stop().catch(() => {}).finally(() => {
            startedRef.current = false;
            onResult(isbn);
          });
        }
      },
      () => {}
    ).then(() => { startedRef.current = true; })
     .catch(() => setError('Impossible d\'accéder à la caméra. Veuillez autoriser l\'accès.'));

    return () => {
      if (scannerRef.current && startedRef.current) {
        scannerRef.current.stop().catch(() => {});
        startedRef.current = false;
      }
    };
  }, []);

  const handleClose = () => {
    if (scannerRef.current && startedRef.current) {
      scannerRef.current.stop().catch(() => {}).finally(onClose);
      startedRef.current = false;
    } else {
      onClose();
    }
  };

  const handleManualSubmit = () => {
    const clean = manualValue.replace(/[^0-9X]/gi, '');
    if (clean.length === 10 || clean.length === 13) {
      onResult(clean);
    } else if (manualValue.trim()) {
      onResult(manualValue.trim());
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(26,16,8,0.95)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ color: '#FDFCF0', fontFamily: 'Special Elite, monospace', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.6 }}>
              Catalogue · Lecteur
            </div>
            <div style={{ color: '#FDFCF0', fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, marginTop: 2 }}>
              Scanner un ISBN
            </div>
          </div>
          <button onClick={handleClose} style={{ color: '#FDFCF0', opacity: 0.7, background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
            <X size={24} />
          </button>
        </div>

        {error || manualMode ? (
          <div>
            {error && (
              <div style={{
                background: 'rgba(128,0,32,0.3)', border: '1px dashed #800020',
                padding: '12px 16px', color: '#FDFCF0', fontFamily: 'Special Elite, monospace',
                fontSize: 12, textAlign: 'center', lineHeight: 1.6, marginBottom: 16,
              }}>
                {error}
              </div>
            )}
            <div style={{ color: 'rgba(253,252,240,0.6)', fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, marginBottom: 12, textAlign: 'center', lineHeight: 1.6 }}>
              Saisissez un ISBN (10 ou 13 chiffres)<br />ou un titre / auteur pour rechercher.
            </div>
            <input
              autoFocus
              type="text"
              value={manualValue}
              onChange={e => setManualValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
              placeholder="9782070360024 ou titre…"
              style={{
                width: '100%', padding: '12px 14px', fontSize: 14,
                background: 'rgba(253,252,240,0.08)', border: '1px solid rgba(253,252,240,0.25)',
                color: '#FDFCF0', fontFamily: 'Georgia, serif', outline: 'none',
                boxSizing: 'border-box', marginBottom: 12,
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleManualSubmit} disabled={!manualValue.trim()} style={{
                flex: 1, background: '#800020', color: '#FDFCF0', border: 'none',
                fontFamily: 'Special Elite, monospace', fontSize: 11, letterSpacing: 2,
                padding: '11px 0', cursor: manualValue.trim() ? 'pointer' : 'not-allowed',
                textTransform: 'uppercase', opacity: manualValue.trim() ? 1 : 0.5,
              }}>
                Rechercher
              </button>
              {!error && (
                <button onClick={() => setManualMode(false)} style={{
                  background: 'transparent', color: 'rgba(253,252,240,0.6)',
                  border: '1px dashed rgba(253,252,240,0.3)',
                  fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 1,
                  padding: '11px 14px', cursor: 'pointer', textTransform: 'uppercase',
                }}>
                  📷 Caméra
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div
              id="isbn-reader"
              style={{
                width: '100%', borderRadius: 0,
                overflow: 'hidden', border: '2px dashed rgba(253,252,240,0.3)'
              }}
            />
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              pointerEvents: 'none', border: '3px solid #800020',
              boxShadow: 'inset 0 0 0 2000px rgba(26,16,8,0.2)'
            }} />
          </div>
        )}

        {!error && !manualMode && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ color: 'rgba(253,252,240,0.5)', fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, textAlign: 'center', letterSpacing: 1 }}>
              Pointez la caméra vers le code-barres du livre
            </div>
            <button onClick={() => setManualMode(true)} style={{
              background: 'transparent', border: '1px dashed rgba(253,252,240,0.3)',
              color: 'rgba(253,252,240,0.6)', fontFamily: 'Special Elite, monospace',
              fontSize: 10, letterSpacing: 2, padding: '7px 16px', cursor: 'pointer', textTransform: 'uppercase',
            }}>
              ✏️ Saisie manuelle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}