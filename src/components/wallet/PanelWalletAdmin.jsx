import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const STATUTS = ['all', 'payee', 'en_transit', 'au_relais', 'livree', 'litige'];
const STATUT_LABELS = {
  all: 'Toutes',
  payee: 'Payées',
  en_transit: 'En transit',
  au_relais: 'Au relais',
  livree: 'Livrées',
  litige: 'Litiges',
};
const STATUT_COLORS = {
  payee: 'var(--bordeaux)',
  en_transit: '#1a3a5c',
  au_relais: '#8B6914',
  livree: '#2d6a2d',
  litige: '#b41414',
};

export default function PanelWalletAdmin() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    base44.entities.Commande.list('-created_date', 200)
      .then(data => setCommandes(data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? commandes : commandes.filter(c => c.statut === filter);

  const totalCA = commandes.filter(c => c.statut !== 'en_attente_paiement').reduce((s, c) => s + (c.montant_paye || 0), 0);
  const nbLivrees = commandes.filter(c => c.statut === 'livree').length;
  const nbLitiges = commandes.filter(c => c.statut === 'litige').length;

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Chiffre d\'affaires', value: totalCA.toFixed(2) + ' €', color: '#2d6a2d' },
          { label: 'Livraisons OK', value: nbLivrees, color: 'var(--bordeaux)' },
          { label: 'Litiges', value: nbLitiges, color: '#b41414' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--papier)', border: '1.5px solid rgba(26,16,8,0.15)',
            padding: '14px 12px', textAlign: 'center',
            boxShadow: '2px 2px 0 rgba(26,16,8,0.08)',
          }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(26,16,8,0.45)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUTS.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 12px',
            background: filter === s ? 'var(--bordeaux)' : 'var(--papier)',
            color: filter === s ? 'var(--creme)' : 'rgba(26,16,8,0.55)',
            border: `1.5px solid ${filter === s ? 'var(--bordeaux)' : 'rgba(26,16,8,0.2)'}`,
            fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1.5,
            textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {STATUT_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, fontFamily: 'IM Fell English, serif', fontStyle: 'italic', color: 'rgba(26,16,8,0.4)' }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.4)', textAlign: 'center', padding: '24px 0' }}>
          Aucune commande pour ce filtre.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Special Elite, monospace', fontSize: 11 }}>
            <thead>
              <tr style={{ background: 'var(--papier-fonce)', borderBottom: '2px solid hsl(var(--border))' }}>
                {['Date', 'Livre', 'Lecteur', 'Zone', 'Mode', 'Montant', 'Statut'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(26,16,8,0.5)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const color = STATUT_COLORS[c.statut] || 'rgba(26,16,8,0.4)';
                const date = c.created_date ? new Date(c.created_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—';
                return (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? 'var(--papier)' : 'transparent', borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '8px 10px', color: 'rgba(26,16,8,0.5)', fontSize: 10, whiteSpace: 'nowrap' }}>{date}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'Playfair Display, serif', fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.livre_titre || '—'}</td>
                    <td style={{ padding: '8px 10px', fontSize: 10, color: 'rgba(26,16,8,0.6)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lecteur_email?.split('@')[0] || '—'}</td>
                    <td style={{ padding: '8px 10px', fontSize: 10, color: 'rgba(26,16,8,0.55)' }}>{c.zone_nom || '—'}</td>
                    <td style={{ padding: '8px 10px', fontSize: 10, color: 'rgba(26,16,8,0.55)' }}>{c.mode_livraison || '—'}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: '#2d6a2d', whiteSpace: 'nowrap' }}>{c.montant_paye ? c.montant_paye.toFixed(2) + ' €' : '—'}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{
                        padding: '2px 6px', fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase',
                        border: `1px solid ${color}`, color, display: 'inline-block',
                      }}>
                        {STATUT_LABELS[c.statut] || c.statut}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}