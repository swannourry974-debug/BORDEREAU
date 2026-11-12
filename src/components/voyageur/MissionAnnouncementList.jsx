import React from 'react';

function missionRoute(mission) {
  const depart = mission.depart_ville || mission.ville_depart || '';
  const arrivee = mission.ville || mission.ville_destination || 'Destination';
  return depart ? `${depart} → ${arrivee}` : arrivee;
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
    <div style={{ background: 'linear-gradient(145deg, rgba(243,232,210,0.98), rgba(247,238,220,0.96))', border: '1.5px solid rgba(110,30,46,0.28)', padding: 16, marginBottom: 18, boxShadow: '3px 3px 0 rgba(26,16,8,0.10)' }}>
      <div className="font-special" style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 12 }}>{title}</div>
      {entries.length === 0 ? (
        <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.48)', textAlign: 'center', padding: '14px 8px' }}>{emptyText}</div>
      ) : entries.map(([route, items]) => (
        <div key={route} style={{ borderTop: grouped ? '1px dashed rgba(26,16,8,0.16)' : 'none', paddingTop: grouped ? 10 : 0, marginTop: grouped ? 10 : 0 }}>
          {grouped && <div className="font-playfair" style={{ fontSize: 16, color: 'var(--encre)', marginBottom: 8 }}>{route} · {items.length} livre{items.length > 1 ? 's' : ''}</div>}
          {items.map((mission) => (
            <div key={mission.id} style={{ background: 'rgba(255,255,255,0.28)', border: '1px solid rgba(26,16,8,0.12)', padding: 12, marginBottom: 10 }}>
              <div className="font-playfair" style={{ fontSize: 16, color: 'var(--encre)', fontWeight: 700 }}>{mission.livre || mission.title || 'Livre'}</div>
              <div className="font-fell" style={{ fontSize: 12, fontStyle: 'italic', color: 'rgba(26,16,8,0.55)', marginTop: 2 }}>{missionRoute(mission)}{mission.point_relais_nom ? ` · ${mission.point_relais_nom}` : ''}</div>
              <div className="font-special" style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: mission.statut === 'expiree' ? '#9A3412' : 'var(--bordeaux)', marginTop: 8 }}>{mission.statut === 'expiree' ? 'Expirée · attente lecteur' : mission.statut === 'engagee' || mission.statut === 'acceptee' ? 'Prise' : 'Annonce ouverte'}</div>
              {onAccept && (
                <button type="button" onClick={() => onAccept(mission)} disabled={disabled || mission.statut === 'expiree'} className="font-special" style={{ marginTop: 10, width: '100%', minHeight: 42, background: disabled || mission.statut === 'expiree' ? 'rgba(26,16,8,0.16)' : 'var(--cta-orange)', color: disabled || mission.statut === 'expiree' ? 'rgba(26,16,8,0.45)' : 'var(--cta-foreground)', border: 'none', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', cursor: disabled || mission.statut === 'expiree' ? 'not-allowed' : 'pointer' }}>Accepter la mission</button>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}