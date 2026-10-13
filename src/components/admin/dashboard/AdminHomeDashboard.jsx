import React from 'react';
import AdminKpiHeader from './AdminKpiHeader';
import AdminStatTiles from './AdminStatTiles';
import AdminOverviewTables from './AdminOverviewTables';
import StickySearchBar from '@/components/shared/StickySearchBar';

export default function AdminHomeDashboard({ stats, filters, onCountryChange, onRelayChange, search }) {
  return (
    <div className="space-y-5">
      <StickySearchBar
        value={search.query}
        onChange={search.setQuery}
        placeholder="Rechercher une commande, un relais, un voyageur…"
      />
      {search.query.trim().length > 1 && (
        <section className="rounded-2xl border border-cta/35 bg-papier p-3 shadow-[3px_3px_0_rgba(194,65,12,0.12)]">
          {search.results.length === 0 ? (
            <div className="p-4 text-center font-body text-sm italic text-bordeaux/45">Aucun résultat trouvé.</div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {search.results.map((result, index) => (
                <div key={`${result.type}-${index}`} className="rounded-xl border border-bordeaux/10 bg-creme p-3">
                  <div className="font-ui text-[10px] uppercase tracking-[1.5px] text-cta">{result.type}</div>
                  <div className="font-medium text-bordeaux">{result.title}</div>
                  <div className="text-sm text-bordeaux/55">{result.meta}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      <section className="rounded-2xl border border-bordeaux/15 bg-papier/80 p-4 shadow-[4px_4px_0_rgba(26,16,8,0.08)]">
        <AdminKpiHeader stats={stats} selectedCountry={filters.country} selectedRelay={filters.relay} onCountryChange={onCountryChange} onRelayChange={onRelayChange} />
      </section>
      <AdminStatTiles stats={stats} />
      <AdminOverviewTables stats={stats} />
    </div>
  );
}