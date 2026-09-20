import React from 'react';

const STEPS = ['Découverte', 'Choix', 'Paiement'];

export default function CatalogueStepDots({ step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-4" aria-label={`Étape ${step} sur 3`}>
      {STEPS.map((label, index) => {
        const i = index + 1;
        return (
          <div key={label} className="flex items-center gap-2">
            <span className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-bordeaux' : 'w-2 bg-foreground/20'}`} />
            <span className={`hidden sm:inline font-typewriter text-[9px] uppercase tracking-[1.5px] ${i === step ? 'text-bordeaux' : 'text-foreground/35'}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}