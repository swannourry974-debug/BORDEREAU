import React from 'react';
import { Download, FileImage, FileText } from 'lucide-react';

export default function DossierExportBar({ onPdf, onPng, loading }) {
  return (
    <div className="sticky top-4 z-10 mb-6 rounded-2xl border border-bordeaux/25 bg-creme/95 p-4 shadow-xl backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 font-ui text-xs uppercase tracking-[3px] text-bordeaux/60">
            <Download size={15} /> Export dossier
          </div>
          <h2 className="font-heading text-3xl text-bordeaux">Télécharger la mosaïque complète</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={onPdf} disabled={loading} className="min-h-[44px] rounded-2xl bg-cta px-5 py-3 font-ui text-xs font-bold uppercase tracking-[2px] text-cta-foreground shadow-lg disabled:opacity-60">
            <span className="inline-flex items-center gap-2"><FileText size={16} /> Télécharger PDF</span>
          </button>
          <button onClick={onPng} disabled={loading} className="min-h-[44px] rounded-2xl border border-bordeaux/35 bg-creme px-5 py-3 font-ui text-xs font-bold uppercase tracking-[2px] text-bordeaux shadow-lg disabled:opacity-60">
            <span className="inline-flex items-center gap-2"><FileImage size={16} /> Télécharger PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}