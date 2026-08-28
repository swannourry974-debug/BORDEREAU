import React from 'react';
import AdminKpiHeader from './AdminKpiHeader';
import AdminAlertsPanel from './AdminAlertsPanel';
import AdminLogisticsPanel from './AdminLogisticsPanel';
import AdminNetworkPanel from './AdminNetworkPanel';
import AdminQuickActions from './AdminQuickActions';

export default function AdminHomeDashboard({ stats, filters, onCountryChange, onRelayChange, search }) {
  return (
    <div className="space-y-5">
      <AdminKpiHeader stats={stats} selectedCountry={filters.country} selectedRelay={filters.relay} onCountryChange={onCountryChange} onRelayChange={onRelayChange} />
      <AdminAlertsPanel stats={stats} />
      <AdminLogisticsPanel stats={stats} />
      <AdminNetworkPanel stats={stats} />
      <AdminQuickActions query={search.query} onQueryChange={search.setQuery} results={search.results} users={search.users} />
    </div>
  );
}