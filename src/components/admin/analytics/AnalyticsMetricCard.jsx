import React from 'react';

export default function AnalyticsMetricCard({ label, value, detail }) {
  return (
    <div className="bordero-card p-4">
      <div className="font-ui text-[10px] uppercase tracking-[2px] text-bordeaux/70">{label}</div>
      <div className="mt-2 font-heading text-3xl text-bordeaux">{Number(value || 0).toLocaleString('fr-FR')}</div>
      {detail && <div className="mt-1 font-body italic text-sm text-encre/60">{detail}</div>}
    </div>
  );
}