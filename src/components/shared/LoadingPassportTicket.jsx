import React from 'react';

const SEGMENTS = 20;

export default function LoadingPassportTicket({ mode = 'loading', progress = 0, onWake }) {
  const isIdle = mode === 'idle';
  const filled = Math.round((progress / 100) * SEGMENTS);
  const done = progress >= 100;

  return (
    <>
      <span className="bordero-wait-stamp" aria-hidden="true">
        {isIdle ? 'En veille' : done ? 'Visa' : 'Carnet'}
      </span>

      <p className="bordero-heading-section">
        {isIdle ? 'Carnet en veille' : 'Ouverture du carnet'}
      </p>

      <div className="bordero-wait-brand">BORDERO</div>
      <div className="bordero-wait-rule" aria-hidden="true">✦</div>

      {isIdle ? (
        <>
          <p className="bordero-wait-caption">
            Le carnet est resté ouvert. Touchez la page pour reprendre la lecture.
          </p>
          <button
            type="button"
            className="bordero-action-secondary mt-5 px-6 py-3 text-[11px]"
            onClick={onWake}
          >
            Reprendre
          </button>
        </>
      ) : (
        <>
          <div
            className="bordero-wait-perfs"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Progression de l’ouverture du carnet"
          >
            {Array.from({ length: SEGMENTS }).map((_, i) => (
              <i key={i} data-on={i < filled ? 'true' : 'false'} />
            ))}
          </div>

          <div className="bordero-wait-meta" aria-hidden="true">
            <span>Départ</span>
            <span>{progress}%</span>
            <span>Visa</span>
          </div>

          <p className="bordero-wait-caption" role="status">
            {done ? 'Carnet prêt. Bon voyage.' : 'On relie le carnet, page après page…'}
          </p>
        </>
      )}
    </>
  );
}
