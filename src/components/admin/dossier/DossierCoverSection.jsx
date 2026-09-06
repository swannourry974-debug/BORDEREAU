import React from 'react';
import { dossierBlocks } from '@/lib/dossierCanvasData';

export default function DossierCoverSection({ sectionRef }) {
  return (
    <section ref={sectionRef} className="rounded-[28px] border-2 border-bordeaux bg-creme p-8 shadow-[18px_18px_0_rgba(128,0,32,0.16)] print-section">
      <div className="mb-8 text-center">
        <div className="font-ui text-xs uppercase tracking-[5px] text-bordeaux/60">Dossier exportable</div>
        <h1 className="mt-3 font-heading text-5xl text-bordeaux">Canvas Bordero</h1>
        <p className="mx-auto mt-4 max-w-3xl font-body text-2xl italic text-bordeaux/75">
          Mosaïque complète des rôles, validations, paiements, séquestre, alertes et jonctions critiques.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {dossierBlocks.map((block) => (
          <article key={block.title} className="min-h-[190px] rounded-2xl border border-bordeaux/35 p-5" style={{ backgroundColor: block.tone }}>
            <h3 className="font-heading text-2xl text-bordeaux">{block.title}</h3>
            <p className="mt-3 whitespace-pre-line font-body text-xl leading-snug text-bordeaux/80">{block.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}