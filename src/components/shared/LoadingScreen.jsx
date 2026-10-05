import React, { useEffect, useState } from 'react';
import LoadingPassportTicket from './LoadingPassportTicket';

const CITIES = ['MONTREAL', 'CHICAGO', 'ABIDJAN', 'NEW YORK', 'CONAKRY', 'MIAMI', 'PARIS', 'DAKAR', 'LYON', 'TORONTO'];

export default function LoadingScreen({ onComplete, mode = 'loading', onWake }) {
  const [progress, setProgress] = useState(0);

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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-white px-4" onClick={mode === 'idle' ? onWake : undefined}>
      <style>{`
        .bordero-loading-premium, .bordero-loading-premium * { box-sizing: border-box; border-radius: 0 !important; }
        .bordero-loading-premium { width: 680px; max-width: calc(100vw - 32px); padding: 24px 28px 28px; display: flex; flex-direction: column; align-items: center; gap: 22px; overflow: hidden; position: relative; color: #3B2A23; background: radial-gradient(ellipse at 50% 38%, #fffaf0 0%, #F3E8D2 68%, #e8d9bc 100%); border: 1px solid #C7A15A; box-shadow: 0 14px 36px rgba(59,42,35,.2), inset 0 0 0 6px rgba(110,30,46,.06); font-family: Georgia, 'Times New Roman', serif; }
        .bordero-loading-premium:before { content: ""; position: absolute; inset: 12px; border: 1px solid rgba(110,30,46,.2); pointer-events: none; }
        .bordero-loading-cityfield { width: 100%; display: grid; grid-template-columns: repeat(5, 1fr); gap: 9px 12px; padding: 4px 10px 0; position: relative; }
        .bordero-loading-city { padding: 7px 5px; text-align: center; border: 1px solid rgba(199,161,90,.7); background: rgba(255,250,240,.62); color: #6E1E2E; font: 700 10px/1.2 Arial, sans-serif; letter-spacing: 1.4px; box-shadow: 0 2px 5px rgba(59,42,35,.08); }
        .bordero-loading-ticket { width: 340px; max-width: 100%; padding: 25px 28px 22px; position: relative; text-align: center; background: linear-gradient(145deg, #fffaf0, #F3E8D2); border: 2px solid #6E1E2E; box-shadow: 0 0 0 5px rgba(59,42,35,.12), 8px 10px 0 rgba(59,42,35,.18), inset 0 0 28px rgba(199,161,90,.2); }
        .bordero-loading-ticket:before { content: ""; position: absolute; inset: 10px; border: 1px dashed rgba(110,30,46,.35); pointer-events: none; }
        .bordero-loading-ticket:after { content: ""; position: absolute; left: -13px; top: 50%; width: 25px; height: 25px; border-radius: 50% !important; transform: translateY(-50%); background: #F3E8D2; border-right: 1px solid #C7A15A; }
        .bordero-loading-edge { position: absolute; right: -13px; top: 50%; width: 25px; height: 25px; border-radius: 50% !important; transform: translateY(-50%); background: #F3E8D2; border-left: 1px solid #C7A15A; }
        .bordero-loading-stars { display: flex; justify-content: space-between; color: #C7A15A; font-size: 14px; margin-bottom: 9px; }
        .bordero-loading-route { font: 700 9px/1.4 Arial, sans-serif; letter-spacing: 2px; color: #3B2A23; }
        .bordero-loading-brand { margin: 9px 0 11px; padding: 8px 0; border-top: 1px solid rgba(199,161,90,.85); border-bottom: 1px solid rgba(199,161,90,.85); color: #6E1E2E; font-size: 34px; font-weight: 700; line-height: 1; letter-spacing: 6px; }
        .bordero-loading-manifest { color: #3B2A23; font-size: 14px; font-style: italic; }
        .bordero-loading-visa { position: absolute; right: 18px; top: 17px; padding: 6px 10px; border: 1px solid rgba(110,30,46,.58); border-radius: 50% !important; color: #6E1E2E; font: 700 8px/1 Arial, sans-serif; letter-spacing: 1.4px; text-transform: uppercase; transform: rotate(-10deg); animation: borderoStamp 1.15s cubic-bezier(.22,1,.36,1) both; }
        .bordero-loading-progress { width: 340px; max-width: 100%; display: flex; flex-direction: column; gap: 9px; }
        .bordero-loading-track { padding: 5px; border: 1px solid rgba(110,30,46,.58); background: #3B2A23; }
        .bordero-loading-perfs { display: grid; grid-template-columns: repeat(20, 1fr); gap: 3px; }
        .bordero-loading-perfs i { height: 12px; background: rgba(243,232,210,.2); }
        .bordero-loading-perfs i.is-filled { background: #F3E8D2; animation: borderoFill .35s ease both; }
        .bordero-loading-scale { display: flex; justify-content: space-between; color: #6E1E2E; font: 700 9px/1 Arial, sans-serif; letter-spacing: 1px; }
        .bordero-loading-text { text-align: center; color: #6E1E2E; font-size: 15px; font-style: italic; }
        @keyframes borderoStamp { 0% { opacity: 0; transform: rotate(-10deg) scale(1.4); } 100% { opacity: 1; transform: rotate(-10deg) scale(1); } }
        @keyframes borderoFill { from { opacity: .3; } to { opacity: 1; } }
        @media (max-width: 560px) { .bordero-loading-cityfield { grid-template-columns: repeat(2, 1fr); } .bordero-loading-premium { padding: 20px 18px 24px; } }
      `}</style>
      <div className="bordero-loading-premium">
        <div className="bordero-loading-cityfield">
          {CITIES.map(city => <div key={city} className="bordero-loading-city">{city}</div>)}
        </div>
        <LoadingPassportTicket mode={mode} progress={progress} />
      </div>
    </div>
  );
}