import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function AdminStats() {
  const [commandes, setCommandes] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Commande.list('-created_date', 50),
      base44.entities.ZonesTarifs.list(),
    ]).then(([c, z]) => {
      setCommandes(c);
      setZones(z);
    }).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: commandes.length,
    payees: commandes.filter(c => ['payee','en_transit','au_relais','livree'].includes(c.statut)).length,
    enTransit: commandes.filter(c => c.statut === 'en_transit').length,
    livrees: commandes.filter(c => c.statut === 'livree').length,
    litiges: commandes.filter(c => c.statut === 'litige').length,
    revenuEstime: commandes.filter(c => c.montant_paye).reduce((s, c) => s + (c.montant_paye || 0), 0),
  };

  const statCards = [
    { label: 'Commandes totales', value: stats.total, icon: '📦', color: '#1a3a5c' },
    { label: 'En transit', value: stats.enTransit, icon: '✈️', color: '#8B6914' },
    { label: 'Livrées', value: stats.livrees, icon: '✅', color: '#2d6a2d' },
    { label: 'Litiges', value: stats.litiges, icon: '⚠️', color: 'var(--bordeaux)' },
    { label: 'Revenus collectés', value: `${stats.revenuEstime.toFixed(2)} €`, icon: '💶', color: '#2d6a2d' },
    { label: 'Zones actives', value: zones.filter(z => z.actif).length, icon: '🌍', color: '#1a3a5c' },
  ];

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>
      Chargement des statistiques...
    </div>
  );

  return (
    <div>
      <div className="font-special" style={{ fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 20 }}>
        Vue d'ensemble
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {statCards.map((s, i) => (
          <div key={i} style={{
            background: 'hsl(var(--card))', border: '1.5px solid hsl(var(--border))',
            borderLeft: `4px solid ${s.color}`,
            padding: '16px 20px',
            boxShadow: '2px 2px 0 rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div className="font-playfair" style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Dernières commandes */}
      <div className="font-special" style={{ fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 12 }}>
        Dernières commandes
      </div>
      {commandes.length === 0 ? (
        <div className="font-fell" style={{ fontStyle: 'italic', color: 'hsl(var(--muted-foreground))', textAlign: 'center', padding: 32 }}>
          Aucune commande pour le moment.
        </div>
      ) : (
        <div style={{ border: '1.5px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
          {commandes.slice(0, 10).map((c, i) => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px',
              borderBottom: i < 9 ? '1px dashed hsl(var(--border))' : 'none',
              flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div className="font-playfair" style={{ fontSize: 13, fontWeight: 700 }}>{c.livre_titre}</div>
                <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>{c.lecteur_email}</div>
              </div>
              <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', letterSpacing: 1 }}>{c.zone_nom}</div>
              <div style={{
                fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase',
                padding: '2px 8px',
                border: `1px solid ${c.statut === 'livree' ? '#2d6a2d' : c.statut === 'litige' ? 'var(--bordeaux)' : '#8B6914'}`,
                color: c.statut === 'livree' ? '#2d6a2d' : c.statut === 'litige' ? 'var(--bordeaux)' : '#8B6914',
              }}>
                {c.statut?.replace(/_/g, ' ')}
              </div>
              <div className="font-playfair" style={{ fontWeight: 700, color: 'var(--bordeaux)', minWidth: 60, textAlign: 'right' }}>
                {c.montant_paye ? `${c.montant_paye.toFixed(2)} €` : '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}