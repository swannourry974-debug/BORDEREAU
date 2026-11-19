import React from 'react';

function missionRoute(mission) {
  const depart = mission.depart_ville || mission.ville_depart || '';
  const arrivee = mission.ville || mission.ville_destination || 'Destination';
  return depart ? `${depart} → ${arrivee}` : arrivee;
}

function statusText(mission) {
  if (mission.statut === 'expiree') return 'Expirée · attente lecteur';
  if (mission.statut === 'engagee' || mission.statut === 'acceptee') return 'Prise en charge';
  return 'Annonce ouverte';
}

export default function MissionAnnouncementList({ title, missions = [], emptyText = 'Aucune annonce pour l’instant.', onAccept, disabled = false, grouped = false }) {
  const groups = grouped
    ? missions.reduce((acc, mission) => {
        const key = missionRoute(mission);
        acc[key] = acc[key] || [];
        acc[key].push(mission);
        return acc;
      }, {})
    : { [title]: missions };

  const entries = Object.entries(groups).filter(([, items]) => items.length > 0);

  return (
    <section className="mb-5 overflow-hidden bordero-card-premium p-4">
      <div className="mb-4 flex items-center gap-3">
        <div>
          <div className="bordero-heading-section">{title}</div>
          <div className="mt-1 font-body text-sm italic text-[#3B2A23]/54">{missions.length} livre{missions.length > 1 ? 's' : ''} dans ce carnet</div>
        </div>
        <span className="h-px flex-1 bg-[#6E1E2E]/18" />
      </div>

      {entries.length === 0 ? (
        <div className="bordero-empty-state py-8 font-body italic">{emptyText}</div>
      ) : entries.map(([route, items]) => (
        <div key={route} className="border-t border-dashed border-[#6E1E2E]/14 pt-3 first:border-t-0 first:pt-0">
          {grouped && <div className="mb-3 font-heading text-lg font-bold text-[#6E1E2E]">{route} · {items.length} livre{items.length > 1 ? 's' : ''}</div>}
          <div className="grid gap-3">
            {items.map((mission) => (
              <article key={mission.id} className="border bg-[#FFF8EA]/82 p-3 shadow-[0_10px_24px_rgba(59,42,35,0.08)]" style={{ borderColor: mission.statut === 'expiree' ? 'rgba(154,52,18,0.32)' : 'rgba(110,30,46,0.18)' }}>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-11 w-9 shrink-0 items-center justify-center bg-[#6E1E2E] font-heading text-[#F3E8D2] shadow-[0_8px_16px_rgba(59,42,35,0.14)]">B</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-[18px] font-bold leading-tight text-[#6E1E2E]">{mission.livre || mission.title || 'Livre'}</h3>
                    <p className="mt-1 font-body text-[14px] italic text-[#3B2A23]/62">{missionRoute(mission)}{mission.point_relais_nom ? ` · ${mission.point_relais_nom}` : ''}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#6E1E2E]/20 bg-[#6E1E2E]/6 px-2 py-1 font-ui text-[9px] font-bold uppercase tracking-[0.14em] text-[#6E1E2E]">{statusText(mission)}</span>
                      {mission.type && <span className="font-ui text-[9px] uppercase tracking-[0.14em] text-[#3B2A23]/40">{mission.type}</span>}
                    </div>
                  </div>
                </div>
                {onAccept && (
                  <button type="button" onClick={() => onAccept(mission)} disabled={disabled || mission.statut === 'expiree'} className="mt-3 min-h-[44px] w-full bg-cta px-4 font-ui text-[10px] font-extrabold uppercase tracking-[0.18em] text-cta-foreground disabled:cursor-not-allowed disabled:bg-[#3B2A23]/15 disabled:text-[#3B2A23]/45">
                    Accepter la mission
                  </button>
                )}
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}