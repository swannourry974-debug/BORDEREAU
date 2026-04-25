import React, { useEffect, useState } from 'react';

const CITIES = ['MONTREAL', 'CHICAGO', 'ABIDJAN', 'NEW YORK', 'CONAKRY', 'MIAMI', 'PARIS', 'DAKAR', 'LYON', 'TORONTO'];

const GRID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÀÉÈÊÇÙ';

function randomChar() {
  return GRID_CHARS[Math.floor(Math.random() * GRID_CHARS.length)];
}

function buildGrid(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => randomChar())
  );
}

const ROWS = 22;
const COLS = 14;

// mode: 'loading' (barre de progression + onComplete) | 'idle' (veille, clic pour réveiller)
export default function LoadingScreen({ onComplete, mode = 'loading', onWake }) {
  const [progress, setProgress] = useState(0);
  const [highlightedCities] = useState(() => [
    { word: 'MONTREAL', row: 4, col: 4 },
    { word: 'CHICAGO', row: 13, col: 5 },
    { word: 'ABIDJAN', row: 18, col: 0 },
    { word: 'NEW YORK', row: 21, col: 1 },
    { word: 'CONAKRY', row: 22, col: 6 },
  ]);

  // Animate progress bar (loading mode only)
  useEffect(() => {
    if (mode !== 'loading') return;
    if (progress >= 100) {
      const t = setTimeout(() => onComplete?.(), 400);
      return () => clearTimeout(t);
    }
    const speed = progress < 60 ? 35 : progress < 85 ? 55 : 80;
    const t = setTimeout(() => setProgress(p => Math.min(p + 1, 100)), speed);
    return () => clearTimeout(t);
  }, [progress, onComplete, mode]);

  // Stable grid with occasional flicker
  const [flickerGrid, setFlickerGrid] = useState(() => buildGrid(ROWS, COLS));

  useEffect(() => {
    const interval = setInterval(() => {
      setFlickerGrid(prev =>
        prev.map(row =>
          row.map(cell => Math.random() < 0.05 ? randomChar() : cell)
        )
      );
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const barFilled = Math.round((progress / 100) * 16);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ background: '#5a0015', fontFamily: 'Special Elite, monospace' }}
      onClick={mode === 'idle' ? onWake : undefined}
    >
      {/* Grid background */}
      <div className="absolute inset-0 flex flex-col items-center justify-start pt-2 px-3 overflow-hidden select-none">
        {flickerGrid.map((row, ri) => (
          <div key={ri} className="flex gap-[6px] leading-[1.55]">
            {row.map((char, ci) => {
              const isCity = highlightedCities.some(({ word, row: cr, col: cc }) => {
                if (ri !== cr) return false;
                const letters = word.replace(' ', '');
                const idx = ci - cc;
                return idx >= 0 && idx < letters.length;
              });
              return (
                <span
                  key={ci}
                  className="text-[11px] font-bold"
                  style={{
                    color: isCity ? '#f5e9c8' : 'rgba(245,224,180,0.22)',
                    letterSpacing: '1px',
                  }}
                >
                  {char}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {/* City boxes overlaid */}
      {[
        { label: 'MONTREAL', top: '14%', left: '26%' },
        { label: 'CHICAGO', top: '44%', left: '30%' },
        { label: 'ABIDJAN', top: '58%', left: '2%' },
        { label: 'NEW YORK', top: '70%', left: '8%' },
        { label: 'CONAKRY', top: '74%', left: '40%' },
      ].map(({ label, top, left }) => (
        <div
          key={label}
          className="absolute text-[11px] font-bold tracking-[2px]"
          style={{
            top, left,
            color: '#f5e9c8',
            border: '1px solid rgba(245,224,180,0.5)',
            padding: '1px 4px',
            background: 'rgba(90,0,21,0.7)',
          }}
        >
          {label}
        </div>
      ))}

      {/* Center ticket */}
      <div className="relative z-10 flex flex-col items-center w-[260px]">
        {/* Ticket */}
        <div
          className="w-full mb-6 relative"
          style={{
            background: '#f5e9c8',
            border: '2px solid #c8a96e',
            padding: '20px 24px 16px',
            boxShadow: '0 0 0 4px rgba(90,0,21,0.4), 4px 4px 0 rgba(0,0,0,0.3)',
          }}
        >
          {/* Notches */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full" style={{ background: '#5a0015' }} />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full" style={{ background: '#5a0015' }} />

          {/* Stars */}
          <div className="flex justify-between mb-1">
            <span style={{ color: '#800020', fontSize: 10 }}>★</span>
            <span style={{ color: '#800020', fontSize: 10 }}>★</span>
          </div>

          <div className="text-center mb-1" style={{ fontSize: 9, letterSpacing: 3, color: '#800020', textTransform: 'uppercase' }}>
            France → USA
          </div>

          <div
            className="text-center font-bold tracking-[4px] uppercase"
            style={{
              fontSize: 28,
              color: '#5a0015',
              fontFamily: 'Playfair Display, serif',
              borderTop: '1px solid #c8a96e',
              borderBottom: '1px solid #c8a96e',
              padding: '6px 0',
              margin: '6px 0',
              letterSpacing: '6px',
            }}
          >
            BORDEREAU
          </div>

          {/* Dashed line */}
          <div style={{ borderTop: '1px dashed #c8a96e', margin: '6px 0' }} />

          <div className="text-center" style={{ fontSize: 10, color: '#8B6914', fontStyle: 'italic', fontFamily: 'IM Fell English, serif' }}>
            Manifeste des livres voyageurs.
          </div>
        </div>

        {/* Progress bar (loading) ou message veille (idle) */}
        <div className="w-full">
          {mode === 'loading' ? (
            <>
              <div
                className="w-full relative mb-1"
                style={{
                  border: '1.5px solid rgba(245,224,180,0.5)',
                  padding: '3px 4px',
                  background: 'rgba(90,0,21,0.6)',
                }}
              >
                <div className="flex gap-[3px]">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 12,
                        background: i < barFilled ? '#f5e9c8' : 'rgba(245,224,180,0.15)',
                        transition: 'background 0.1s',
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-between" style={{ fontSize: 9, color: 'rgba(245,224,180,0.6)', letterSpacing: 1 }}>
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
              <div
                className="text-center mt-2"
                style={{ fontSize: 11, color: 'rgba(245,224,180,0.7)', fontStyle: 'italic', fontFamily: 'IM Fell English, serif' }}
              >
                {progress < 100 ? 'Chargement en cours...' : 'Prêt !'}
              </div>
            </>
          ) : (
            <div
              className="text-center mt-2"
              style={{ fontSize: 11, color: 'rgba(245,224,180,0.6)', fontStyle: 'italic', fontFamily: 'IM Fell English, serif', letterSpacing: 1 }}
            >
              Touchez l'écran pour reprendre.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}