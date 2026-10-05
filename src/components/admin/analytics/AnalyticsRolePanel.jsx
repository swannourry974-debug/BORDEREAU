import React from 'react';
import AnalyticsMetricCard from './AnalyticsMetricCard';

const LABELS = {
  lecteurs: 'Lecteurs',
  voyageurs: 'Voyageurs',
  relais: 'Points relais',
  autres: 'Autres pages',
};

export default function AnalyticsRolePanel({ roles = {} }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Object.entries(LABELS).map(([key, label]) => {
        const data = roles[key] || {};
        return (
          <AnalyticsMetricCard
            key={key}
            label={label}
            value={data.views}
            detail={`${Number(data.users || 0).toLocaleString('fr-FR')} utilisateurs · ${Number(data.events || 0).toLocaleString('fr-FR')} actions`}
          />
        );
      })}
    </div>
  );
}