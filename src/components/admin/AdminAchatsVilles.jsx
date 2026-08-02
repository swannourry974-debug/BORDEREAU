import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function AdminAchatsVilles() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    base44.entities.Commande.list('-created_date', 500).then(commandes => {
      const grouped = (commandes || []).reduce((acc, c) => {
        const ville = c.zone_nom || 'Non classée';
        if (!acc[ville]) acc[ville] = { ville, total: 0, montant: 0, preparation: 0, transit: 0, relais: 0, retire: 0 };
        acc[ville].total += 1;
        acc[ville].montant += c.montant_paye || 0;
        if (c.statut === 'payee') acc[ville].preparation += 1;
        if (c.statut === 'en_transit') acc[ville].transit += 1;
        if (c.statut === 'au_relais') acc[ville].relais += 1;
        if (c.statut === 'livree') acc[ville].retire += 1;
        return acc;
      }, {});
      setRows(Object.values(grouped).sort((a, b) => b.total - a.total));
    });
  }, []);

  return (
    <div>
      <h2 className="font-special" style={{ fontSize: 20, letterSpacing: 3, color: 'var(--bordeaux)', textTransform: 'uppercase', marginBottom: 14 }}>Achats par villes</h2>
      <div style={{ background: 'var(--papier)', border: '1px solid hsl(var(--border))', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead><tr style={{ color: 'var(--sepia)', textTransform: 'uppercase', fontSize: 11 }}><th style={{ textAlign: 'left', padding: 12 }}>Ville</th><th>Total</th><th>Montant</th><th>Préparation</th><th>Transit</th><th>Point Relais</th><th>Retiré</th></tr></thead>
          <tbody>{rows.map(r => <tr key={r.ville} style={{ borderTop: '1px dashed hsl(var(--border))' }}><td style={{ padding: 12, fontWeight: 700 }}>{r.ville}</td><td>{r.total}</td><td>{r.montant.toFixed(2)} €</td><td>{r.preparation}</td><td>{r.transit}</td><td>{r.relais}</td><td>{r.retire}</td></tr>)}</tbody>
        </table>
        {rows.length === 0 && <div style={{ padding: 20 }}>Aucune commande à classer pour le moment.</div>}
      </div>
    </div>
  );
}