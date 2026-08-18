import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function AdminReseauRelais() {
  const [relais, setRelais] = useState([]);
  const load = async () => setRelais(await base44.entities.PointRelais.list('-updated_date', 300));
  useEffect(() => { load(); }, []);

  const approve = async (r) => {
    const updated = await base44.entities.PointRelais.update(r.id, { actif: true, validation_admin: 'valide' });
    const users = await base44.entities.User.filter({ email: r.gerant_email }, '-updated_date', 1);
    if (users[0]) {
      await base44.entities.User.update(users[0].id, {
        role: 'relais',
        relais_valide: true,
        relais_validation_status: 'valide',
        relais_valide_le: new Date().toISOString(),
        point_relais_id: updated.id,
      });
    }
    await load();
  };

  const reject = async (r) => {
    await base44.entities.PointRelais.update(r.id, { actif: false, validation_admin: 'rejete' });
    const users = await base44.entities.User.filter({ email: r.gerant_email }, '-updated_date', 1);
    if (users[0]) {
      await base44.entities.User.update(users[0].id, { relais_valide: false, relais_validation_status: 'rejete', point_relais_id: '' });
    }
    await load();
  };

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
        {relais.map(r => (
          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 0.8fr 0.9fr 160px', gap: 10, padding: 14, borderBottom: '1px dashed hsl(var(--border))', alignItems: 'center' }}>
            <div>
              <strong>{r.nom}</strong>
              <div style={{ fontSize: 11, color: 'rgba(26,16,8,0.55)' }}>{r.gerant_email}</div>
            </div>
            <span>{r.ville || 'Ville inconnue'} · {r.pays_nom || r.pays_code || 'Pays'}</span>
            <span>{r.type_commerce || 'Commerce'}</span>
            <span>{r.telephone || 'Téléphone'}<br /><small>{r.horaires || 'Horaires'}</small></span>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: r.validation_admin === 'valide' ? '#2d6a2d' : r.validation_admin === 'rejete' ? '#b41414' : '#8B6914' }}>{r.validation_admin || '—'}</span>
              {r.validation_admin !== 'valide' && <button onClick={() => approve(r)} style={{ background: 'var(--cta-orange)', color: 'var(--cta-foreground)', border: 'none', padding: '7px 9px', fontSize: 10, cursor: 'pointer' }}>Valider</button>}
              {r.validation_admin !== 'rejete' && <button onClick={() => reject(r)} style={{ background: 'transparent', color: 'var(--bordeaux)', border: '1px solid var(--bordeaux)', padding: '7px 9px', fontSize: 10, cursor: 'pointer' }}>Refuser</button>}
            </div>
          </div>
        ))}
        {relais.length === 0 && <div style={{ padding: 20 }}>Aucun point relais enregistré.</div>}
      </div>
    </div>
  );
}