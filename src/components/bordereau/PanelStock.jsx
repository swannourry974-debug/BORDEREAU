import React, { useState } from 'react';
import QrScannerModal from '../relais/QrScannerModal';
import ScanResult from '../relais/ScanResult';
import ProfilsTableau from '../relais/ProfilsTableau';

const MOCK_STOCK = [
  { ref: 'BDX-1042', livre: 'Les Misérables', auteur: 'Victor Hugo', type: 'retrait', utilisateur: 'Marie L.', emplacement: 'Étagère A3' },
  { ref: 'BDX-1037', livre: 'Madame Bovary', auteur: 'Gustave Flaubert', type: 'retrait', utilisateur: 'Paul D.', emplacement: 'Étagère B1' },
  { ref: 'BDX-1055', livre: 'L\'Étranger', auteur: 'Albert Camus', type: 'depot', utilisateur: 'Sophie M.' },
];

const MOCK_BOOKS = [
  { id: 1, titre: 'Le Seigneur des Anneaux', auteur: 'J.R.R. Tolkien', statut: 'en_arrivage' },
  { id: 2, titre: 'Harry Potter 1', auteur: 'J.K. Rowling', statut: 'en_attente' },
  { id: 3, titre: 'Fondation', auteur: 'Isaac Asimov', statut: 'distribuer' },
  { id: 4, titre: 'Dune', auteur: 'Frank Herbert', statut: 'en_arrivage' },
];

export default function PanelStock() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [view, setView] = useState('colis'); // 'colis' ou 'livres'
  const [selectedStatus, setSelectedStatus] = useState('all');

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

  const filteredBooks = selectedStatus === 'all' 
    ? MOCK_BOOKS 
    : MOCK_BOOKS.filter(b => b.statut === selectedStatus);

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

      {/* Toggle View */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button
          onClick={() => setView('colis')}
          style={{
            flex: 1, background: view === 'colis' ? 'var(--bordeaux)' : 'var(--papier)',
            color: view === 'colis' ? 'var(--creme)' : 'var(--bordeaux)',
            border: `1.5px solid var(--bordeaux)`, padding: '16px 12px',
            fontFamily: 'Special Elite, monospace', fontSize: 11,
            letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.15s'
          }}
        >
          <span style={{ fontSize: 18 }}>📦</span>
          Gestion colis
        </button>
        <button
          onClick={() => setView('livres')}
          style={{
            flex: 1, background: view === 'livres' ? 'var(--bordeaux)' : 'var(--papier)',
            color: view === 'livres' ? 'var(--creme)' : 'var(--bordeaux)',
            border: `1.5px solid var(--bordeaux)`, padding: '16px 12px',
            fontFamily: 'Special Elite, monospace', fontSize: 11,
            letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.15s'
          }}
        >
          <span style={{ fontSize: 18 }}>📚</span>
          Livres en transit
        </button>
      </div>

      {view === 'colis' && (
        <>
        <button
          onClick={() => setScanning(true)}
          style={{
            width: '100%', background: 'var(--bordeaux)', color: 'var(--creme)',
            border: 'none', padding: '16px 12px', marginBottom: 24,
            fontFamily: 'Special Elite, monospace', fontSize: 11,
            letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer',
            outline: '2px dashed var(--bordeaux)', outlineOffset: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.15s'
          }}
        >
          <span style={{ fontSize: 18 }}>⬡</span>
          Scanner un bordereau
        </button>
        </>
      )}

      {view === 'livres' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            onClick={() => setSelectedStatus('all')}
            style={{
              padding: '8px 12px',
              background: selectedStatus === 'all' ? 'var(--bordeaux)' : 'var(--papier)',
              color: selectedStatus === 'all' ? 'var(--creme)' : 'var(--encre)',
              border: `1px solid var(--bordeaux)`,
              fontFamily: 'Special Elite, monospace', fontSize: 9,
              letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Tous
          </button>
          <button
            onClick={() => setSelectedStatus('en_arrivage')}
            style={{
              padding: '8px 12px',
              background: selectedStatus === 'en_arrivage' ? 'var(--bordeaux)' : 'var(--papier)',
              color: selectedStatus === 'en_arrivage' ? 'var(--creme)' : 'var(--encre)',
              border: `1px solid var(--bordeaux)`,
              fontFamily: 'Special Elite, monospace', fontSize: 9,
              letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Arrivage
          </button>
          <button
            onClick={() => setSelectedStatus('en_attente')}
            style={{
              padding: '8px 12px',
              background: selectedStatus === 'en_attente' ? 'var(--bordeaux)' : 'var(--papier)',
              color: selectedStatus === 'en_attente' ? 'var(--creme)' : 'var(--encre)',
              border: `1px solid var(--bordeaux)`,
              fontFamily: 'Special Elite, monospace', fontSize: 9,
              letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Attente
          </button>
          <button
            onClick={() => setSelectedStatus('distribuer')}
            style={{
              padding: '8px 12px',
              background: selectedStatus === 'distribuer' ? 'var(--bordeaux)' : 'var(--papier)',
              color: selectedStatus === 'distribuer' ? 'var(--creme)' : 'var(--encre)',
              border: `1px solid var(--bordeaux)`,
              fontFamily: 'Special Elite, monospace', fontSize: 9,
              letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            À distribuer
          </button>
        </div>
      )}

      {view === 'colis' && (
        <>
        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          Colis en dépôt
          <span style={{ flex: 1, height: 1, background: 'repeating-linear-gradient(90deg, var(--bordeaux) 0, var(--bordeaux) 4px, transparent 4px, transparent 8px)' }} />
        </div>

        {MOCK_STOCK.map((item) => (
          <div key={item.ref} style={{
            background: 'var(--papier)',
            border: '1px solid hsl(var(--border))',
            borderLeft: `4px solid ${item.type === 'depot' ? '#800020' : '#2d5a27'}`,
            padding: '12px 14px', marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: item.type === 'depot' ? '#800020' : '#2d5a27'
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{item.livre}</div>
              <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 10, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{item.auteur} · #{item.ref}</div>
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
                <div style={{ fontSize: 9, marginTop: 4, color: 'hsl(var(--muted-foreground))', fontFamily: 'Special Elite, monospace' }}>{item.emplacement}</div>
              )}
            </div>
          </div>
        ))}
        <ProfilsTableau />
        </>
      )}

      {view === 'livres' && (
        <div>
          <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            Livres en transit
            <span style={{ flex: 1, height: 1, background: 'repeating-linear-gradient(90deg, var(--bordeaux) 0, var(--bordeaux) 4px, transparent 4px, transparent 8px)' }} />
          </div>
          {filteredBooks.map((book) => (
            <div key={book.id} style={{
              background: 'var(--papier)',
              border: '1px solid hsl(var(--border))',
              borderLeft: `4px solid var(--bordeaux)`,
              padding: '12px 14px', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 12
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: 'var(--bordeaux)'
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 13, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{book.titre}</div>
                <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 10, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{book.auteur}</div>
              </div>
              <div style={{
                fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase',
                padding: '4px 8px',
                border: '1px solid var(--bordeaux)',
                color: 'var(--bordeaux)',
                fontFamily: 'Special Elite, monospace',
                background: book.statut === 'en_arrivage' ? '#FFE5E5' : book.statut === 'en_attente' ? '#FFF9E5' : '#E5F5FF'
              }}>
                {book.statut === 'en_arrivage' ? '🚚 Arrivage' : book.statut === 'en_attente' ? '⏳ Attente' : '📦 À distribuer'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}