import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

export default function QrScannerModal({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const scannerId = 'qr-reader';
    const html5Qrcode = new Html5Qrcode(scannerId);
    scannerRef.current = html5Qrcode;

    html5Qrcode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        // Vibration haptique
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        html5Qrcode.stop().then(() => {
          onScan(decodedText);
        });
      },
      () => {}
    ).then(() => setStarted(true))
     .catch((err) => setError('Impossible d\'accéder à la caméra. Veuillez autoriser l\'accès.'));

    return () => {
      if (scannerRef.current && started) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {}).finally(onClose);
    } else {
      onClose();
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
              Bordereau · Relais
            </div>
            <div style={{ color: '#FDFCF0', fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, marginTop: 2 }}>
              Scanner un bordereau
            </div>
          </div>
          <button onClick={handleClose} style={{ color: '#FDFCF0', opacity: 0.7, background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
            <X size={24} />
          </button>
        </div>

        {error ? (
          <div style={{
            background: 'rgba(128,0,32,0.3)', border: '1px dashed #800020',
            padding: 20, color: '#FDFCF0', fontFamily: 'Special Elite, monospace',
            fontSize: 13, textAlign: 'center', lineHeight: 1.6
          }}>
            {error}
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

        <div style={{
          marginTop: 20, color: 'rgba(253,252,240,0.5)',
          fontFamily: 'IM Fell English, serif', fontStyle: 'italic',
          fontSize: 12, textAlign: 'center', letterSpacing: 1
        }}>
          Pointez la caméra vers le QR code du colis
        </div>
      </div>
    </div>
  );
}