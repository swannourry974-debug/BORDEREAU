import React, { useState } from 'react';
import QrScannerModal from './QrScannerModal';
import ScanResult from './ScanResult';

const MOCK_STOCK = [
  { ref: 'BDX-1042', livre: 'Les Misérables', auteur: 'Victor Hugo', type: 'retrait', utilisateur: 'Marie L.', emplacement: 'Étagère A3' },
  { ref: 'BDX-1037', livre: 'Madame Bovary', auteur: 'Gustave Flaubert', type: 'retrait', utilisateur: 'Paul D.', emplacement: 'Étagère B1' },
  { ref: 'BDX-1055', livre: "L'Étranger", auteur: 'Albert Camus', type: 'depot', utilisateur: 'Sophie M.' },
];

export default function PanelScanner() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleScan = (text) => {
    setScanning(false);
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
        onClick={() => setScanning(true)}
        style={{
          width: '100%', background: 'var(--bordeaux)', color: 'var(--creme)',
          border: 'none', padding: '20px 24px', marginBottom: 28,
          fontFamily: 'Special Elite, monospace', fontSize: 13,
          letterSpacing: 4, textTransform: 'uppercase', cursor: 'pointer',
          outline: '2px dashed var(--bordeaux)', outlineOffset: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          transition: 'all 0.15s'
        }}
      >
        <span style={{ fontSize: 24 }}>⬡</span>
        Lancer le scanner
      </button>

      {/* Instructions */}
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
        <div key={step} style={{
          display: 'flex', gap: 14, alignItems: 'flex-start',
          padding: '12px 0', borderBottom: '1px dashed hsl(var(--border))'
        }}>
          <span style={{
            fontFamily: 'Special Elite, monospace', fontSize: 11,
            color: 'var(--bordeaux)', fontWeight: 'bold', minWidth: 24
          }}>{step}</span>
          <span style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'hsl(var(--foreground))', lineHeight: 1.5 }}>{text}</span>
        </div>
      ))}
    </div>
  );
}