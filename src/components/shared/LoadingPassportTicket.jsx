import React from 'react';

const SEGMENTS = 18;

export default function LoadingPassportTicket({ mode = 'loading', progress = 0 }) {
  const filled = Math.round((progress / 100) * SEGMENTS);
  const isIdle = mode === 'idle';

  return (
    <div className="relative z-10 flex w-[min(340px,86vw)] flex-col items-center">
      <div
        className="relative mb-6 w-full overflow-hidden px-7 py-6 text-center shadow-[0_0_0_5px_rgba(59,42,35,0.30),10px_12px_0_rgba(0,0,0,0.22),inset_0_0_34px_rgba(199,161,90,0.16)]"
        style={{ background: 'linear-gradient(145deg, rgba(247,238,220,0.98), rgba(243,232,210,0.94))', border: '2px solid #C7A15A', color: '#6E1E2E' }}
      >
        <div className="absolute -left-3 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full" style={{ background: '#4B1220' }} />
        <div className="absolute -right-3 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full" style={{ background: '#4B1220' }} />
        <div className="absolute inset-3 pointer-events-none" style={{ border: '1px dashed rgba(110,30,46,0.28)' }} />
        <div className="absolute right-5 top-5 rotate-[-10deg] rounded-full px-3 py-2 text-[8px] font-bold uppercase tracking-[2px]" style={{ border: '1px solid rgba(110,30,46,0.52)', color: '#6E1E2E' }}>
          {isIdle ? 'En attente' : 'Visa livres'}
        </div>

        <div className="mb-2 flex justify-between text-[12px]" style={{ color: '#C7A15A' }}><span>✦</span><span>✦</span></div>
        <div className="bordero-ui text-[9px] font-bold uppercase tracking-[3px]" style={{ color: '#3B2A23' }}>France → le Monde</div>
        <div className="my-3 border-y py-2" style={{ borderColor: 'rgba(199,161,90,0.82)' }}>
          <div className="bordero-title text-[34px] font-bold uppercase leading-none tracking-[6px]" style={{ textShadow: '0 1px 0 rgba(199,161,90,0.42)' }}>BORDERO</div>
        </div>
        <div className="mx-auto mb-1 w-24 border-t border-dashed" style={{ borderColor: 'rgba(199,161,90,0.9)' }} />
        <div className="font-fell text-[13px] italic" style={{ color: '#3B2A23' }}>Manifeste des livres voyageurs.</div>
      </div>

      {isIdle ? (
        <div className="font-fell text-center text-[15px] italic tracking-[0.5px]" style={{ color: 'rgba(243,232,210,0.82)' }}>Touchez l’écran pour reprendre le carnet Bordero.</div>
      ) : (
        <div className="w-full">
          <div className="mb-2 p-1" style={{ border: '1.5px solid rgba(199,161,90,0.76)', background: 'rgba(59,42,35,0.52)' }}>
            <div className="flex gap-[3px]">{Array.from({ length: SEGMENTS }).map((_, i) => <div key={i} className="h-3 flex-1" style={{ background: i < filled ? '#F3E8D2' : 'rgba(243,232,210,0.15)', transition: 'background 0.28s ease' }} />)}</div>
          </div>
          <div className="flex justify-between text-[9px] tracking-[1px]" style={{ color: 'rgba(243,232,210,0.62)' }}><span>0%</span><span>50%</span><span>100%</span></div>
          <div className="font-fell mt-3 text-center text-[14px] italic" style={{ color: 'rgba(243,232,210,0.82)' }}>{progress < 100 ? 'Préparation du carnet Bordero…' : 'Prêt pour le voyage.'}</div>
        </div>
      )}
    </div>
  );
}