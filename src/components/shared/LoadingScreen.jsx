import React, { useEffect, useState } from 'react';
import LoadingPassportTicket from './LoadingPassportTicket';

const CITIES = ['MONTREAL', 'CHICAGO', 'ABIDJAN', 'NEW YORK', 'CONAKRY', 'MIAMI', 'PARIS', 'DAKAR', 'LYON', 'TORONTO'];
const GRID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÀÉÈÊÇÙ';
const ROWS = 22;
const COLS = 14;

function randomChar() {
  return GRID_CHARS[Math.floor(Math.random() * GRID_CHARS.length)];
}

function buildGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => randomChar()));
}

export default function LoadingScreen({ onComplete, mode = 'loading', onWake }) {
  const [progress, setProgress] = useState(0);
  const [flickerGrid, setFlickerGrid] = useState(() => buildGrid(ROWS, COLS));
  const highlightedCities = [
    { word: 'MONTREAL', row: 4, col: 4 },
    { word: 'CHICAGO', row: 13, col: 5 },
    { word: 'ABIDJAN', row: 18, col: 0 },
    { word: 'NEWYORK', row: 21, col: 1 },
    { word: 'CONAKRY', row: 20, col: 6 },
  ];

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

  useEffect(() => {
    const interval = setInterval(() => {
      setFlickerGrid(prev => prev.map(row => row.map(cell => Math.random() < 0.035 ? randomChar() : cell)));
    }, 190);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 50% 18%, rgba(199,161,90,0.20), transparent 30%), radial-gradient(circle at 16% 78%, rgba(243,232,210,0.10), transparent 26%), linear-gradient(145deg, #3B2A23 0%, #6E1E2E 54%, #4B1220 100%)',
        fontFamily: 'Inter, sans-serif',
      }}
      onClick={mode === 'idle' ? onWake : undefined}
    >
      <div className="absolute inset-0 opacity-75" style={{ backgroundImage: 'linear-gradient(90deg, rgba(199,161,90,0.05) 1px, transparent 1px), linear-gradient(0deg, rgba(199,161,90,0.04) 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
      <div className="absolute inset-0 flex flex-col items-center justify-start pt-2 px-3 overflow-hidden select-none">
        {flickerGrid.map((row, ri) => (
          <div key={ri} className="flex gap-[6px] leading-[1.55]">
            {row.map((char, ci) => {
              const isCity = highlightedCities.some(({ word, row: cr, col: cc }) => ri === cr && ci >= cc && ci < cc + word.length);
              return (
                <span
                  key={ci}
                  className="text-[11px] font-bold"
                  style={{ color: isCity ? '#F3E8D2' : 'rgba(243,232,210,0.18)', letterSpacing: '1px' }}
                >
                  {char}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {CITIES.slice(0, 5).map((label, index) => {
        const positions = [
          ['14%', '26%'], ['44%', '30%'], ['58%', '2%'], ['70%', '8%'], ['74%', '40%'],
        ];
        return (
          <div
            key={label}
            className="absolute text-[10px] font-bold uppercase tracking-[2px]"
            style={{
              top: positions[index][0], left: positions[index][1],
              color: '#F3E8D2', border: '1px solid rgba(199,161,90,0.7)',
              padding: '2px 6px', background: 'rgba(59,42,35,0.58)',
              boxShadow: '0 5px 14px rgba(0,0,0,0.16)',
            }}
          >
            {label}
          </div>
        );
      })}

      <LoadingPassportTicket mode={mode} progress={progress} />
    </div>
  );
}