import React, { useMemo, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const MOIS_COURT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

function buildMonthlyData(missions) {
  const now = new Date();
  const data = [];

  // 6 derniers mois
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    data.push({ mois: MOIS_COURT[d.getMonth()], key, gains: 0, livres: 0 });
  }

  missions.forEach(m => {
    if (m.statut !== 'livree') return;
    const created = m.updated_date || m.created_date;
    if (!created) return;
    const d = new Date(created);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const entry = data.find(e => e.key === key);
    if (entry) {
      entry.gains += m.commission || 0;
      entry.livres += 1;
    }
  });

  return data.map(e => ({ ...e, gains: Math.round(e.gains * 100) / 100 }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'var(--encre)', color: 'var(--creme)',
      padding: '8px 12px', fontFamily: 'Special Elite, monospace', fontSize: 10,
      border: 'none',
    }}>
      <div style={{ marginBottom: 4, letterSpacing: 1, opacity: 0.7 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name === 'gains' ? `${p.value.toFixed(2)} €` : `${p.value} livre${p.value !== 1 ? 's' : ''}`}
        </div>
      ))}
    </div>
  );
};

export default function GraphiqueGains({ missions }) {
  const [mode, setMode] = useState('gains'); // 'gains' ou 'livres'
  const data = useMemo(() => buildMonthlyData(missions), [missions]);

  const totalGains = data.reduce((s, d) => s + d.gains, 0);
  const totalLivres = data.reduce((s, d) => s + d.livres, 0);

  return (
    <div style={{ background: 'var(--papier)', border: '1.5px solid rgba(26,16,8,0.2)', boxShadow: '3px 3px 0 rgba(26,16,8,0.08)' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px dashed rgba(26,16,8,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)', marginBottom: 2 }}>
              Évolution · 6 derniers mois
            </div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: mode === 'gains' ? 'var(--bordeaux)' : '#1a3a5c' }}>
              {mode === 'gains' ? `${totalGains.toFixed(2)} €` : `${totalLivres} livres`}
            </div>
          </div>
          {/* Toggle */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { key: 'gains',  label: '€',  color: 'var(--bordeaux)' },
              { key: 'livres', label: '📚', color: '#1a3a5c' },
            ].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                style={{
                  padding: '6px 12px', cursor: 'pointer',
                  fontFamily: 'Special Elite, monospace', fontSize: 10,
                  background: mode === key ? color : 'transparent',
                  color: mode === key ? 'var(--creme)' : 'rgba(26,16,8,0.4)',
                  border: `1px solid ${mode === key ? color : 'rgba(26,16,8,0.2)'}`,
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Graphique */}
      <div style={{ padding: '16px 4px 8px' }}>
        <ResponsiveContainer width="100%" height={140}>
          {mode === 'gains' ? (
            <AreaChart data={data} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gainsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#800020" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#800020" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,16,8,0.08)" />
              <XAxis dataKey="mois" tick={{ fontFamily: 'Special Elite, monospace', fontSize: 9, fill: 'rgba(26,16,8,0.4)', letterSpacing: 1 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily: 'Special Elite, monospace', fontSize: 8, fill: 'rgba(26,16,8,0.35)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="gains" name="gains" stroke="#800020" strokeWidth={2} fill="url(#gainsGrad)" dot={{ fill: '#800020', r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,16,8,0.08)" />
              <XAxis dataKey="mois" tick={{ fontFamily: 'Special Elite, monospace', fontSize: 9, fill: 'rgba(26,16,8,0.4)', letterSpacing: 1 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontFamily: 'Special Elite, monospace', fontSize: 8, fill: 'rgba(26,16,8,0.35)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="livres" name="livres" fill="#1a3a5c" radius={[2, 2, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}