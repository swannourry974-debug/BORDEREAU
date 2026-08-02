import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X } from 'lucide-react';

export default function QrScannerModal({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const fileScannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const startedRef = useRef(false);
  const [error, setError] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualId, setManualId] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);

  useEffect(() => {
    const scannerId = 'qr-reader';
    let html5Qrcode;
    try {
      html5Qrcode = new Html5Qrcode(scannerId);
    } catch {
      setError('Caméra indisponible.');
      return;
    }
    scannerRef.current = html5Qrcode;

    html5Qrcode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        html5Qrcode.stop().catch(() => {}).finally(() => {
          startedRef.current = false;
          onScan(decodedText);
        });
      },
      () => {}
    ).then(() => { startedRef.current = true; })
     .catch(() => setError('Impossible d\'accéder à la caméra. Veuillez autoriser l\'accès.'));

    return () => {
      if (scannerRef.current && startedRef.current) {
        scannerRef.current.stop().catch(() => {});
        startedRef.current = false;
      }
      if (fileScannerRef.current) {
        fileScannerRef.current.clear?.();
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
    if (manualId.trim()) onScan(manualId.trim());
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    setError(null);
    if (scannerRef.current && startedRef.current) {
      await scannerRef.current.stop().catch(() => {});
      startedRef.current = false;
    }
    if (!fileScannerRef.current) {
      fileScannerRef.current = new Html5Qrcode('qr-file-reader', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
        ],
        verbose: false,
      });
    }
    try {
      const decodedText = await fileScannerRef.current.scanFile(file, false);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      onScan(decodedText);
    } catch {
      setError('Aucun QR code ou ISBN détecté sur cette photo. Essayez une image plus nette ou utilisez la saisie manuelle.');
      setManualMode(true);
    } finally {
      setPhotoLoading(false);
      if (event.target) event.target.value = '';
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(26,16,8,0.95)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      <div id="qr-file-reader" style={{ position: 'absolute', left: -9999, top: -9999, width: 1, height: 1, overflow: 'hidden' }} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        style={{ display: 'none' }}
      />
      <div style={{ width: '100%', maxWidth: 420, padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ color: '#FDFCF0', fontFamily: 'Special Elite, monospace', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.6 }}>
              Bordero · Relais
            </div>
            <div style={{ color: '#FDFCF0', fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, marginTop: 2 }}>
              Scanner un bordero
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
            <div style={{ color: 'rgba(253,252,240,0.6)', fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
              Saisissez l'ID ou le contenu du QR code manuellement.
            </div>
            <input
              autoFocus
              type="text"
              value={manualId}
              onChange={e => setManualId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
              placeholder="ID de la commande…"
              style={{
                width: '100%', padding: '12px 14px', fontSize: 14,
                background: 'rgba(253,252,240,0.08)', border: '1px solid rgba(253,252,240,0.25)',
                color: '#FDFCF0', fontFamily: 'monospace', outline: 'none',
                boxSizing: 'border-box', marginBottom: 12,
              }}
            />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={handleManualSubmit} disabled={!manualId.trim()} style={{
                flex: '1 1 120px', background: '#800020', color: '#FDFCF0', border: 'none',
                fontFamily: 'Special Elite, monospace', fontSize: 11, letterSpacing: 2,
                padding: '11px 0', cursor: manualId.trim() ? 'pointer' : 'not-allowed',
                textTransform: 'uppercase', opacity: manualId.trim() ? 1 : 0.5,
              }}>
                Valider
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={photoLoading} style={{
                flex: '1 1 130px', background: 'transparent', color: 'rgba(253,252,240,0.75)',
                border: '1px dashed rgba(253,252,240,0.3)', fontFamily: 'Special Elite, monospace',
                fontSize: 10, letterSpacing: 1, padding: '11px 14px', cursor: photoLoading ? 'wait' : 'pointer',
                textTransform: 'uppercase', opacity: photoLoading ? 0.6 : 1,
              }}>
                {photoLoading ? 'Analyse…' : '🖼️ Photo ISBN'}
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
              id="qr-reader"
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
              Pointez la caméra vers le QR code du colis ou importez une photo d’ISBN.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => fileInputRef.current?.click()} disabled={photoLoading} style={{
                background: '#800020', border: '1px solid #800020', color: '#FDFCF0',
                fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 2,
                padding: '7px 16px', cursor: photoLoading ? 'wait' : 'pointer', textTransform: 'uppercase',
                opacity: photoLoading ? 0.65 : 1,
              }}>
                {photoLoading ? 'Analyse…' : '🖼️ Importer photo ISBN'}
              </button>
              <button onClick={() => setManualMode(true)} style={{
                background: 'transparent', border: '1px dashed rgba(253,252,240,0.3)',
                color: 'rgba(253,252,240,0.6)', fontFamily: 'Special Elite, monospace',
                fontSize: 10, letterSpacing: 2, padding: '7px 16px', cursor: 'pointer', textTransform: 'uppercase',
              }}>
                ✏️ Saisie manuelle
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}