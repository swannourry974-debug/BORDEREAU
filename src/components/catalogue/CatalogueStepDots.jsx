import React from 'react';

export default function CatalogueStepDots({ step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-4" aria-label={`Étape ${step} sur 3`}>
      {[1, 2, 3].map(i => (
        <span key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-bordeaux' : 'w-2 bg-foreground/20'}`} />
      ))}
    </div>
  );
}