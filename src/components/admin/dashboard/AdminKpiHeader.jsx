import React from 'react';
import { Euro, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { money } from './adminDashboardData';

function Kpi({ label, value, helper, icon: Icon }) {
  return <Card className="bg-papier border-bordeaux/20"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="font-ui text-[11px] tracking-[2px] uppercase text-bordeaux/60">{label}</p><div className="font-heading text-3xl text-bordeaux mt-2">{value}</div><p className="text-sm text-bordeaux/55 mt-1 italic">{helper}</p></div><Icon className="text-cta" size={28} /></div></CardContent></Card>;
}

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
      <div className="grid md:grid-cols-2 gap-4">
        <Kpi label="Chiffre d'affaires du jour" value={money(stats.caJour)} helper="Commandes filtrées sur la journée" icon={Euro} />
        <Kpi label="Chiffre d'affaires du mois" value={money(stats.caMois)} helper="Mois en cours, pays et relais filtrables" icon={MapPin} />
      </div>
    </section>
  );
}