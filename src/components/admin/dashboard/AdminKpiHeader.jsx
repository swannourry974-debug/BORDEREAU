import React from 'react';

export default function AdminKpiHeader({ stats, selectedCountry, selectedRelay, onCountryChange, onRelayChange }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div><p className="font-ui text-[11px] tracking-[3px] uppercase text-bordeaux/60">Accueil administrateur</p><h1 className="font-heading text-4xl text-bordeaux">Pilotage Bordero</h1></div>
        <div className="grid sm:grid-cols-2 gap-3 w-full lg:w-[460px]">
          <select value={selectedCountry} onChange={e => onCountryChange(e.target.value)} className="min-h-[44px] bg-papier border border-bordeaux/25 px-3 font-ui text-sm text-bordeaux"><option value="all">Tous les pays</option>{stats.countries.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}</select>
          <select value={selectedRelay} onChange={e => onRelayChange(e.target.value)} className="min-h-[44px] bg-papier border border-bordeaux/25 px-3 font-ui text-sm text-bordeaux"><option value="all">Tous les points relais</option>{stats.visibleRelays.map(r => <option key={r.id} value={r.id}>{r.nom || r.gerant_email}</option>)}</select>
        </div>
      </div>
      <div className="font-body text-sm italic text-bordeaux/55">
        Vue épurée des opérations actives, avec filtres pays et relais conservés.
      </div>
    </section>
  );
}