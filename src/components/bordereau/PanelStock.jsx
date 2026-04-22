import React, { useState } from 'react';
import QrScannerModal from '../relais/QrScannerModal';
import ScanResult from '../relais/ScanResult';

const MOCK_STOCK = [
  { ref: 'BDX-1042', livre: 'Les Misérables', auteur: 'Victor Hugo', type: 'retrait', utilisateur: 'Marie L.', emplacement: 'Étagère A3' },
  { ref: 'BDX-1037', livre: 'Madame Bovary', auteur: 'Gustave Flaubert', type: 'retrait', utilisateur: 'Paul D.', emplacement: 'Étagère B1' },
  { ref: 'BDX-1055', livre: 'L\'Étranger', auteur: 'Albert Camus', type: 'depot', utilisateur: 'Sophie M.' },
];

export default function PanelStock() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleScan = (text) => {
    setScanning(false);
    // Simulate parsing scan result
    const mock = MOCK_STOCK[Math.floor(Math.random() * MOCK_STOCK.length)];
    setScanResult({ ...mock, ref: text.slice(0, 8).toUpperCase() || mock.ref });
  };

  const handleClose = () => {
    setScanResult(null);
    setScanning(false);
  };

  return (
    <div>
      {scanning && <QrScannerModal onScan={handleScan} onClose={() => setScanning(false)} />}
      {scanResult && <ScanResult data={scanResult} onClose={handleClose} />}

      {/* Header */}
      <div style={{
        background: 'var(--bordeaux)', color: 'var(--creme)',
        padding: '18px 20px', marginBottom: 20, position: 'relative', overflow: 'hidden'
      }}>
        <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 60, opacity: 0.1 }}>⬡</span>
        <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.7, marginBottom: 6, fontFamily: 'Special Elite, monospace' }}>
          Tableau de bord · Relais
        </div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
          Gestion du stock
        </div>
        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, opacity: 0.75, marginTop: 6 }}>
          {MOCK_STOCK.length} colis en attente · Commission en cours
        </div>
      </div>

      {/* Scan Button */}
      <button
        onClick={() => setScanning(true)}
        style={{
          width: '100%', background: 'var(--bordeaux)', color: 'var(--creme)',
          border: 'none', padding: '18px 24px', marginBottom: 24,
          fontFamily: 'Special Elite, monospace', fontSize: 13,
          letterSpacing: 4, textTransform: 'uppercase', cursor: 'pointer',
          outline: '2px dashed var(--bordeaux)', outlineOffset: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          transition: 'all 0.15s'
        }}
      >
        <span style={{ fontSize: 20 }}>⬡</span>
        Scanner un bordereau
      </button>

      {/* Stock list */}
      <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        Colis en dépôt
        <span style={{ flex: 1, height: 1, background: 'repeating-linear-gradient(90deg, var(--bordeaux) 0, var(--bordeaux) 4px, transparent 4px, transparent 8px)' }} />
      </div>

      {MOCK_STOCK.map((item) => (
        <div key={item.ref} style={{
          background: 'var(--papier)',
          border: '1px solid rgba(26,16,8,0.15)',
          borderLeft: `4px solid ${item.type === 'depot' ? '#800020' : '#2d5a27'}`,
          padding: '12px 14px', marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: item.type === 'depot' ? '#800020' : '#2d5a27'
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 13, fontWeight: 700 }}>{item.livre}</div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 10, color: 'rgba(26,16,8,0.5)', marginTop: 2 }}>{item.auteur} · #{item.ref}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase',
              padding: '2px 7px',
              border: `1px solid ${item.type === 'depot' ? '#800020' : '#2d5a27'}`,
              color: item.type === 'depot' ? '#800020' : '#2d5a27',
              fontFamily: 'Special Elite, monospace'
            }}>
              {item.type === 'depot' ? 'À ranger' : 'À remettre'}
            </div>
            {item.emplacement && (
              <div style={{ fontSize: 9, marginTop: 4, color: 'rgba(26,16,8,0.4)', fontFamily: 'Special Elite, monospace' }}>{item.emplacement}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}