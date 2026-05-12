import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const PERIODS = [
  { key: 'semaine', label: 'Cette semaine' },
  { key: 'mois', label: 'Ce mois' },
  { key: 'annee', label: 'Cette année' },
];

function isWithinPeriod(dateStr, period) {
  const date = new Date(dateStr);
  const now = new Date();
  if (period === 'semaine') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return date >= start;
  }
  if (period === 'mois') {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
  if (period === 'annee') {
    return date.getFullYear() === now.getFullYear();
  }
  return false;
}

export default function ProfilsTableau() {
  const [period, setPeriod] = useState('mois');
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Commande.list('-created_date', 200)
      .then(data => setCommandes(data || []))
      .finally(() => setLoading(false));
  }, []);

  // Agrège par lecteur (email)
  const filtered = commandes.filter(c => isWithinPeriod(c.created_date, period));

  const byEmail = {};
  filtered.forEach(c => {
    const key = c.lecteur_email || 'Inconnu';
    if (!byEmail[key]) byEmail[key] = { email: key, commandes: 0, montant: 0 };
    byEmail[key].commandes += 1;
    byEmail[key].montant += c.montant_paye || 0;
  });

  const rows = Object.values(byEmail).sort((a, b) => b.commandes - a.commandes);

  return (
    <div style={{ marginTop: 28 }}>
      {/* Titre */}
      <div style={{
        fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11,
        letterSpacing: 3, textTransform: 'uppercase', color: 'var(--bordeaux)',
        marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8
      }}>
        Profils lecteurs
        <span style={{ flex: 1, height: 1, background: 'repeating-linear-gradient(90deg, var(--bordeaux) 0, var(--bordeaux) 4px, transparent 4px, transparent 8px)' }} />
      </div>

      {/* Sélecteur période */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, border: '1px solid hsl(var(--border))' }}>
        {PERIODS.map((p, i) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            style={{
              flex: 1, padding: '8px 4px',
              background: period === p.key ? 'var(--bordeaux)' : 'var(--papier)',
              color: period === p.key ? 'var(--creme)' : 'hsl(var(--muted-foreground))',
              border: 'none',
              borderRight: i < PERIODS.length - 1 ? '1px solid hsl(var(--border))' : 'none',
              fontFamily: 'Special Elite, monospace',
              fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Tableau */}
      {loading ? (
        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: 'hsl(var(--muted-foreground))', textAlign: 'center', padding: '20px 0' }}>
          Chargement...
        </div>
      ) : rows.length === 0 ? (
        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: 'hsl(var(--muted-foreground))', textAlign: 'center', padding: '20px 0' }}>
          Aucune commande sur cette période.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Special Elite, monospace', fontSize: 11 }}>
            <thead>
              <tr style={{ background: 'var(--papier-fonce)', borderBottom: '2px solid hsl(var(--border))' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', letterSpacing: 1.5, fontSize: 9, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>#</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', letterSpacing: 1.5, fontSize: 9, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>Lecteur</th>
                <th style={{ textAlign: 'center', padding: '8px 10px', letterSpacing: 1.5, fontSize: 9, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>Cmd.</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', letterSpacing: 1.5, fontSize: 9, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.email} style={{
                  background: i % 2 === 0 ? 'var(--papier)' : 'transparent',
                  borderBottom: '1px solid hsl(var(--border))'
                }}>
                  <td style={{ padding: '9px 10px', color: 'hsl(var(--muted-foreground))', fontSize: 10 }}>{i + 1}</td>
                  <td style={{ padding: '9px 10px', color: 'hsl(var(--foreground))' }}>
                    {r.email.length > 22 ? r.email.slice(0, 22) + '…' : r.email}
                  </td>
                  <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                    <span style={{
                      background: 'var(--bordeaux)', color: 'var(--creme)',
                      padding: '2px 7px', fontSize: 10, fontWeight: 'bold'
                    }}>{r.commandes}</span>
                  </td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', color: 'var(--bordeaux)', fontWeight: 'bold' }}>
                    {r.montant.toFixed(2)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}