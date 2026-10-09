import React from 'react';
import AdminKpiHeader from './AdminKpiHeader';
import AdminAlertsPanel from './AdminAlertsPanel';
import AdminLogisticsPanel from './AdminLogisticsPanel';
import AdminNetworkPanel from './AdminNetworkPanel';
import AdminQuickActions from './AdminQuickActions';

export default function AdminHomeDashboard({ stats, filters, onCountryChange, onRelayChange, search }) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-bordeaux/15 bg-papier/80 p-4 shadow-[4px_4px_0_rgba(26,16,8,0.08)]">
        <div className="mb-4 font-ui text-[10px] uppercase tracking-[3px] text-bordeaux">Vue d’ensemble</div>
        <AdminKpiHeader stats={stats} selectedCountry={filters.country} selectedRelay={filters.relay} onCountryChange={onCountryChange} onRelayChange={onRelayChange} />
      </section>
      <section className="rounded-2xl border border-bordeaux/15 bg-papier/80 p-4 shadow-[4px_4px_0_rgba(26,16,8,0.08)]">
        <div className="mb-4 font-ui text-[10px] uppercase tracking-[3px] text-bordeaux">Opérations</div>
        <div className="space-y-5">
          <AdminAlertsPanel stats={stats} />
          <AdminLogisticsPanel stats={stats} />
          <AdminNetworkPanel stats={stats} />
        </div>
      </section>
      <section className="rounded-2xl border border-bordeaux/15 bg-papier/80 p-4 shadow-[4px_4px_0_rgba(26,16,8,0.08)]">
        <div className="mb-4 font-ui text-[10px] uppercase tracking-[3px] text-bordeaux">Recherche & actions</div>
        <AdminQuickActions query={search.query} onQueryChange={search.setQuery} results={search.results} users={search.users} stats={stats} />
      </section>
    </div>
  );
}