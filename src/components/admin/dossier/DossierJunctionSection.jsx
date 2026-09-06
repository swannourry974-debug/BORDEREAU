import React from 'react';
import { junctions } from '@/lib/dossierCanvasData';

export default function DossierJunctionSection({ sectionRef }) {
  return (
    <section ref={sectionRef} className="rounded-[28px] border-2 border-bordeaux bg-creme p-8 shadow-[18px_18px_0_rgba(128,0,32,0.16)] print-section">
      <header className="mb-8 border-b border-bordeaux/25 pb-5">
        <div className="font-ui text-xs uppercase tracking-[4px] text-bordeaux/60">Connecteurs orange</div>
        <h2 className="font-heading text-4xl text-bordeaux">Jonctions inter-rôles</h2>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {junctions.map((item, index) => (
          <div key={item} className="rounded-2xl border border-cta/45 bg-[#fff7ed] p-4 font-body text-xl text-bordeaux shadow-[5px_5px_0_rgba(194,65,12,0.12)]">
            <span className="mr-3 font-ui text-sm font-bold text-cta">{String(index + 1).padStart(2, '0')}</span>
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}