import React from 'react';

function missionRoute(mission) {
  const depart = mission.depart_ville || mission.ville_depart || '';
  const arrivee = mission.ville || mission.ville_destination || 'Destination';
  return depart ? `${depart} → ${arrivee}` : arrivee;
}

function statutLabel(statut) {
  if (statut === 'expiree') return { label: 'Expirée · attente lecteur', tone: 'attente' };
  if (statut === 'engagee' || statut === 'acceptee') return { label: 'Prise', tone: 'transit' };
  return { label: 'Annonce ouverte', tone: 'valide' };
}

const TONE_COLORS = {
  attente: 'var(--statut-attente)',
  transit: 'var(--statut-transit)',
  valide: 'var(--statut-valide)',
};

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
    <div className="bordero-card mb-5 p-4">
      <div className="bordero-ui mb-3 text-[10px] uppercase tracking-[2px]" style={{ color: 'var(--bordeaux)' }}>{title}</div>
      {entries.length === 0 ? (
        <div className="bordero-copy px-2 py-3 text-center text-sm italic">{emptyText}</div>
      ) : entries.map(([route, items]) => (
        <div key={route} style={{ borderTop: grouped ? '1px dashed var(--bordero-line)' : 'none', paddingTop: grouped ? 10 : 0, marginTop: grouped ? 10 : 0 }}>
          {grouped && (
            <div className="bordero-title mb-2 text-base" style={{ color: 'var(--encre)' }}>
              {route} · {items.length} livre{items.length > 1 ? 's' : ''}
            </div>
          )}
          {items.map((mission) => {
            const statut = statutLabel(mission.statut);
            const blocked = disabled || mission.statut === 'expiree';
            return (
              <div key={mission.id} className="bordero-surface mb-2.5 p-3">
                <div className="bordero-title text-base" style={{ color: 'var(--encre)' }}>{mission.livre || mission.title || 'Livre'}</div>
                <div className="bordero-copy mt-0.5 text-xs italic">
                  {missionRoute(mission)}{mission.point_relais_nom ? ` · ${mission.point_relais_nom}` : ''}
                </div>
                <div className="bordero-ui mt-2 text-[9px] uppercase tracking-[1.5px]" style={{ color: TONE_COLORS[statut.tone] }}>
                  {statut.label}
                </div>
                {onAccept && (
                  <button
                    type="button"
                    onClick={() => onAccept(mission)}
                    disabled={blocked}
                    className="bordero-action-secondary mt-2.5 w-full text-[10px]"
                    style={{ opacity: blocked ? 0.5 : 1, cursor: blocked ? 'not-allowed' : 'pointer' }}
                  >
                    Accepter la mission
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
