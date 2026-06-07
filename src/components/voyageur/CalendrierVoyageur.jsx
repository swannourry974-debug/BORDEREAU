import React, { useState } from 'react';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const JOURS = ['D','L','M','M','J','V','S'];

export default function CalendrierVoyageur({ missions, voyages }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth); // 0=Sun
  // Shift to Monday-first
  const startOffset = (firstDay + 6) % 7;

  // Indexer les événements par date ISO (YYYY-MM-DD)
  const eventsByDate = {};

  missions.forEach(m => {
    if (!m.date_limite) return;
    const d = m.date_limite.slice(0, 10);
    if (!eventsByDate[d]) eventsByDate[d] = [];
    eventsByDate[d].push({ type: 'mission', label: m.livre, ville: m.ville_destination, statut: m.statut });
  });

  voyages.forEach(v => {
    if (!v.date_vol) return;
    const d = v.date_vol.slice(0, 10);
    if (!eventsByDate[d]) eventsByDate[d] = [];
    eventsByDate[d].push({ type: 'vol', label: `${v.depart_ville} → ${v.arrivee_ville}` });
  });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
  };

  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedDateStr = selectedDay
    ? `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`
    : null;
  const selectedEvents = selectedDateStr ? (eventsByDate[selectedDateStr] || []) : [];

  return (
    <div style={{ background: 'var(--papier)', border: '1.5px solid rgba(26,16,8,0.2)', boxShadow: '3px 3px 0 rgba(26,16,8,0.08)' }}>
      {/* Navigation */}
      <div style={{
        background: 'var(--bordeaux)', color: 'var(--creme)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
      }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--creme)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>‹</button>
        <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>
          {MOIS[viewMonth]} {viewYear}
        </div>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--creme)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>›</button>
      </div>

      {/* En-têtes jours */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px dashed rgba(26,16,8,0.15)' }}>
        {['L','M','M','J','V','S','D'].map((j, i) => (
          <div key={i} style={{
            textAlign: 'center', padding: '6px 2px',
            fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 1.5,
            color: i >= 5 ? 'var(--bordeaux)' : 'rgba(26,16,8,0.4)',
          }}>{j}</div>
        ))}
      </div>

      {/* Grille */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '4px' }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e${idx}`} />;
          const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const events = eventsByDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          const isSelected = day === selectedDay;
          const hasMission = events.some(e => e.type === 'mission');
          const hasVol = events.some(e => e.type === 'vol');

          return (
            <div
              key={day}
              onClick={() => setSelectedDay(day === selectedDay ? null : day)}
              style={{
                textAlign: 'center', padding: '6px 2px', cursor: events.length > 0 ? 'pointer' : 'default',
                background: isSelected ? 'var(--bordeaux)' : isToday ? 'rgba(128,0,32,0.08)' : 'transparent',
                border: isToday && !isSelected ? '1px solid rgba(128,0,32,0.3)' : '1px solid transparent',
                position: 'relative',
              }}
            >
              <div style={{
                fontFamily: 'Playfair Display, serif', fontSize: 12, fontWeight: isToday ? 700 : 400,
                color: isSelected ? 'var(--creme)' : isToday ? 'var(--bordeaux)' : 'var(--encre)',
              }}>{day}</div>
              {/* Points indicateurs */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 2 }}>
                {hasMission && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'var(--creme)' : '#8B6914' }} />}
                {hasVol     && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'var(--creme)' : '#1a3a5c' }} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', gap: 14, padding: '8px 16px', borderTop: '1px dashed rgba(26,16,8,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8B6914' }} />
          <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 1, color: 'rgba(26,16,8,0.45)' }}>Date limite livraison</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a3a5c' }} />
          <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 1, color: 'rgba(26,16,8,0.45)' }}>Vol programmé</span>
        </div>
      </div>

      {/* Détail jour sélectionné */}
      {selectedDay && (
        <div style={{ borderTop: '1px dashed rgba(26,16,8,0.2)', padding: '12px 16px', background: 'rgba(26,16,8,0.02)' }}>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)', marginBottom: 8 }}>
            {selectedDay} {MOIS[viewMonth]}
          </div>
          {selectedEvents.length === 0 ? (
            <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.35)' }}>
              Aucun événement ce jour.
            </div>
          ) : selectedEvents.map((ev, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              marginBottom: i < selectedEvents.length - 1 ? 8 : 0,
              paddingBottom: i < selectedEvents.length - 1 ? 8 : 0,
              borderBottom: i < selectedEvents.length - 1 ? '1px dashed rgba(26,16,8,0.12)' : 'none',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                background: ev.type === 'vol' ? '#1a3a5c' : '#8B6914',
              }} />
              <div>
                <div style={{ fontFamily: 'IM Fell English, serif', fontSize: 13, color: 'var(--encre)' }}>
                  {ev.label}
                </div>
                {ev.ville && (
                  <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, color: 'rgba(26,16,8,0.4)', letterSpacing: 1, marginTop: 2 }}>
                    📍 {ev.ville}
                  </div>
                )}
                {ev.statut && (
                  <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, color: '#8B6914', letterSpacing: 1, marginTop: 2, textTransform: 'uppercase' }}>
                    {ev.statut === 'acceptee' ? '⏳ À valider' : ev.statut === 'engagee' ? '✈ En cours' : ev.statut}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}