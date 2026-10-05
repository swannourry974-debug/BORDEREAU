import React from 'react';

export default function AnalyticsLists({ topPages = [], topEvents = [] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="bordero-card p-4">
        <h3 className="font-ui text-xs uppercase tracking-[2px] text-bordeaux">Pages clés</h3>
        <div className="mt-3 divide-y divide-bordeaux/10">
          {topPages.map(page => <div key={page.path} className="py-3 text-sm"><strong>{page.path}</strong><div className="font-body italic text-encre/60">{page.role} · {page.views} vues · {page.users} utilisateurs</div></div>)}
          {!topPages.length && <p className="font-body italic text-encre/60">Aucune page remontée.</p>}
        </div>
      </div>
      <div className="bordero-card p-4">
        <h3 className="font-ui text-xs uppercase tracking-[2px] text-bordeaux">Actions fréquentes</h3>
        <div className="mt-3 divide-y divide-bordeaux/10">
          {topEvents.map(event => <div key={event.name} className="flex justify-between gap-3 py-3 text-sm"><strong>{event.name}</strong><span>{event.count}</span></div>)}
          {!topEvents.length && <p className="font-body italic text-encre/60">Aucun événement remonté.</p>}
        </div>
      </div>
    </div>
  );
}