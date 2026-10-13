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
    <section className="mb-4 rounded-2xl border-2 border-bordeaux/25 bg-papier p-5 shadow-[5px_5px_0_rgba(110,30,46,0.12)]">
      <div className="font-ui text-[10px] uppercase tracking-[3px] text-cta">Mission en cours</div>
      <h2 className="mt-2 font-heading text-3xl text-bordeaux">{mission?.livre || 'Aucune mission active'}</h2>
      <p className="mt-1 font-body text-sm italic text-bordeaux/60">{mission ? `${mission.ville || 'Destination'} · ${mission.type || 'Livre'} · ${mission.poids || 'poids à confirmer'}` : 'Choisissez une mission Express compatible avec votre trajet.'}</p>
      <div className="my-5 grid grid-cols-4 gap-2">
        {steps.map((label, index) => <div key={label} className={`rounded-xl border p-2 text-center font-ui text-[9px] uppercase tracking-[1px] ${index <= step ? 'border-cta bg-cta/10 text-cta' : 'border-bordeaux/15 text-bordeaux/35'}`}>{label}</div>)}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button disabled={!mission || isEngaged || disabled} onClick={() => onAccept?.(mission)} className="min-h-[46px] flex-1 bg-cta px-4 font-ui text-[11px] uppercase tracking-[2px] text-cta-foreground disabled:cursor-not-allowed disabled:opacity-45">Accepter une mission</button>
        <button disabled={!mission || !isEngaged || mission.status === 'livree'} onClick={() => onDeposit?.(mission)} className="min-h-[46px] flex-1 bg-cta px-4 font-ui text-[11px] uppercase tracking-[2px] text-cta-foreground disabled:cursor-not-allowed disabled:opacity-45">Confirmer un dépôt</button>
      </div>
      {mission && <div className="mt-3 text-right font-heading text-xl text-bordeaux">{commission ? `${commission.toFixed(2)} €` : mission.commission ? `${mission.commission.toFixed(2)} €` : 'Commission à confirmer'}</div>}
    </section>
  );
}