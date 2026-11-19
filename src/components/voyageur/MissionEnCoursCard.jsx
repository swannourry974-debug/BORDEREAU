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
    <section className="relative mb-5 overflow-hidden bordero-card-premium p-5">
      <div className="pointer-events-none absolute -right-8 top-4 font-heading text-8xl text-[#6E1E2E]/5">✈</div>
      <div className="relative">
        <div className="bordero-heading-section">Mission en cours</div>
        <h2 className="mt-2 font-heading text-3xl font-bold leading-tight text-[#6E1E2E]">{mission?.livre || 'Aucune mission active'}</h2>
        <p className="mt-2 font-body text-[15px] italic leading-relaxed text-[#3B2A23]/62">{mission ? `${mission.ville || 'Destination'} · ${mission.type || 'Livre'} · ${mission.poids || 'poids à confirmer'}` : 'Choisissez une mission Express compatible avec votre trajet.'}</p>
        <div className="my-5 grid grid-cols-4 gap-2">
          {steps.map((label, index) => (
            <div key={label} className={`border p-2 text-center font-ui text-[9px] font-extrabold uppercase tracking-[0.12em] ${index <= step ? 'border-cta bg-cta/10 text-cta' : 'border-[#6E1E2E]/15 bg-[#FFF8EA]/55 text-[#6E1E2E]/35'}`}>{label}</div>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button disabled={!mission || isEngaged || disabled} onClick={() => onAccept?.(mission)} className="min-h-[46px] flex-1 bg-cta px-4 font-ui text-[11px] font-extrabold uppercase tracking-[0.18em] text-cta-foreground disabled:cursor-not-allowed disabled:opacity-45">Accepter une mission</button>
          <button disabled={!mission || !isEngaged || mission.status === 'livree'} onClick={() => onDeposit?.(mission)} className="min-h-[46px] flex-1 border border-[#6E1E2E]/28 bg-[#FFF8EA] px-4 font-ui text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#6E1E2E] disabled:cursor-not-allowed disabled:opacity-45">Confirmer un dépôt</button>
        </div>
        {mission && <div className="mt-4 text-right font-heading text-2xl font-bold text-[#6E1E2E]">{commission ? `${commission.toFixed(2)} €` : mission.commission ? `${mission.commission.toFixed(2)} €` : 'Commission à confirmer'}</div>}
      </div>
    </section>
  );
}