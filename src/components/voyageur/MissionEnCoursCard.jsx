import React from 'react';

const steps = ['Dépôt', 'Transit', 'Relais', 'Remis'];

function activeStep(status) {
  if (status === 'livree') return 3;
  if (status === 'en_transit') return 1;
  if (status === 'au_relais') return 2;
  return 0;
}

export default function MissionEnCoursCard({ mission, isEngaged, commission, onAccept, onDeposit, disabled }) {
  const step = activeStep(mission?.status || mission?.statut);
  return (
    <section className="bordero-card mb-4 p-5">
      <div className="bordero-ui text-[10px] uppercase tracking-[3px]" style={{ color: 'var(--sepia)' }}>Mission en cours</div>
      <h2 className="bordero-title mt-2 text-3xl" style={{ color: 'var(--bordeaux)' }}>{mission?.livre || 'Aucune mission active'}</h2>
      <p className="bordero-copy mt-1 text-sm italic">
        {mission ? `${mission.ville || 'Destination'} · ${mission.type || 'Livre'} · ${mission.poids || 'poids à confirmer'}` : 'Choisissez une mission Express compatible avec votre trajet.'}
      </p>
      <div className="my-5 grid grid-cols-4 gap-2">
        {steps.map((label, index) => {
          const done = index <= step;
          return (
            <div
              key={label}
              className="bordero-ui border p-2 text-center text-[9px] uppercase tracking-[1px]"
              style={{
                borderColor: done ? 'var(--bordeaux)' : 'var(--bordero-line)',
                background: done ? 'rgba(110, 30, 46, 0.08)' : 'transparent',
                color: done ? 'var(--bordeaux)' : 'var(--encre-douce)',
              }}
            >
              {label}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={!mission || isEngaged || disabled}
          onClick={() => onAccept?.(mission)}
          className="bordero-action-primary min-h-[46px] flex-1 px-4 text-[11px] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Accepter une mission
        </button>
        <button
          type="button"
          disabled={!mission || !isEngaged || mission.status === 'livree'}
          onClick={() => onDeposit?.(mission)}
          className="bordero-action-secondary min-h-[46px] flex-1 px-4 text-[11px] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Confirmer un dépôt
        </button>
      </div>
      {mission && (
        <div className="bordero-title mt-3 text-right text-xl" style={{ color: 'var(--bordeaux)' }}>
          {commission ? `${commission.toFixed(2)} €` : mission.commission ? `${mission.commission.toFixed(2)} €` : 'Commission à confirmer'}
        </div>
      )}
    </section>
  );
}
