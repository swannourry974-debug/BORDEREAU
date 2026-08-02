import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function AdminReseauRelais() {
  const [relais, setRelais] = useState([]);
  useEffect(() => { base44.entities.PointRelais.list('-updated_date', 300).then(setRelais); }, []);

  const totalStock = relais.reduce((sum, r) => sum + (r.stock_actuel || 0), 0);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2 className="font-special" style={{ fontSize: 20, letterSpacing: 3, color: 'var(--bordeaux)', textTransform: 'uppercase' }}>Réseau Points Relais</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div style={{ background: 'var(--papier)', padding: 16 }}>Validés<br /><strong style={{ fontSize: 28, color: 'var(--bordeaux)' }}>{relais.filter(r => r.validation_admin === 'valide').length}</strong></div>
        <div style={{ background: 'var(--papier)', padding: 16 }}>En attente<br /><strong style={{ fontSize: 28, color: 'var(--bordeaux)' }}>{relais.filter(r => r.validation_admin === 'en_attente').length}</strong></div>
        <div style={{ background: 'var(--papier)', padding: 16 }}>Stock d'attente<br /><strong style={{ fontSize: 28, color: 'var(--bordeaux)' }}>{totalStock}</strong></div>
      </div>
      <div style={{ background: 'var(--papier)', border: '1px solid hsl(var(--border))' }}>
        {relais.map(r => <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 90px 110px', gap: 10, padding: 14, borderBottom: '1px dashed hsl(var(--border))' }}><strong>{r.nom}</strong><span>{r.ville || 'Ville inconnue'}</span><span>{r.stock_actuel || 0} colis</span><span>{r.validation_admin || '—'}</span></div>)}
        {relais.length === 0 && <div style={{ padding: 20 }}>Aucun point relais enregistré.</div>}
      </div>
    </div>
  );
}