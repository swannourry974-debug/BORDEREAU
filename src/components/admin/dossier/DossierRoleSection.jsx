import React from 'react';
import DossierTile from './DossierTile';

export default function DossierRoleSection({ role, sectionRef }) {
  return (
    <section ref={sectionRef} className="rounded-[28px] border-2 border-bordeaux bg-[#f5e6cc] p-8 shadow-[18px_18px_0_rgba(128,0,32,0.16)] print-section">
      <header className="mb-8 flex flex-col gap-2 border-b border-bordeaux/25 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="font-ui text-xs uppercase tracking-[4px] text-bordeaux/60">Parcours métier</div>
          <h2 className="font-heading text-4xl text-bordeaux">{role.icon} {role.title}</h2>
        </div>
        <p className="font-body text-2xl italic text-bordeaux/70">{role.subtitle}</p>
      </header>
      <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-4">
        {role.steps.map(([title, body], index) => (
          <div key={`${role.id}-${title}`} className="relative">
            <DossierTile index={index} title={title} body={body} color={role.color} />
            {index < role.steps.length - 1 && <span className="absolute -right-4 top-1/2 hidden text-2xl text-cta md:block">→</span>}
          </div>
        ))}
      </div>
    </section>
  );
}