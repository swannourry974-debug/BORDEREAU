import React from 'react';

const SEGMENTS = 20;

export default function LoadingPassportTicket({ mode = 'loading', progress = 0 }) {
  const filled = Math.round((progress / 100) * SEGMENTS);
  const isIdle = mode === 'idle';

  return (
    <>
      <div className="bordero-loading-ticket">
        <span className="bordero-loading-edge" />
        <div className="bordero-loading-visa">{isIdle ? 'En attente' : 'Visa livres'}</div>
        <div className="bordero-loading-stars"><span>✦</span><span>✦</span></div>
        <div className="bordero-loading-route">France → le Monde</div>
        <div className="bordero-loading-brand">BORDERO</div>
        <div className="bordero-loading-manifest">Manifeste des livres voyageurs.</div>
      </div>

      {isIdle ? (
        <div className="bordero-loading-text">Touchez l’écran pour reprendre le carnet Bordero.</div>
      ) : (
        <div className="bordero-loading-progress">
          <div className="bordero-loading-track">
            <div className="bordero-loading-perfs">
              {Array.from({ length: SEGMENTS }).map((_, i) => <i key={i} className={i < filled ? 'is-filled' : ''} />)}
            </div>
          </div>
          <div className="bordero-loading-scale"><span>0%</span><span>50%</span><span>100%</span></div>
          <div className="bordero-loading-text">{progress < 100 ? 'Préparation du carnet Bordero…' : 'Prêt pour le voyage.'}</div>
        </div>
      )}
    </>
  );
}