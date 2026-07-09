import React, { useState } from 'react';

/**
 * Affiche la ventilation transparente des frais pour une zone donnée
 * Express : Voyageur | Relais | Admin
 * Collectif : Malle | Relais | Admin
 */
export default function VentilationCard({ zone, mode = 'express' }) {
  const [open, setOpen] = useState(false);
  if (!zone) return null;

  const isExpress = mode === 'express';
  const data = isExpress ? zone.express : zone.collectif;

  return (
    <div style={{ marginBottom: 14 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'IM Fell English, serif', fontStyle: 'italic',
          fontSize: 11, color: 'hsl(var(--muted-foreground))',
          padding: 0, display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        {open ? '▼' : '▶'} Voir la ventilation des frais
      </button>

      {open && (
        <div style={{
          marginTop: 8, background: 'rgba(26,16,8,0.03)',
          border: '1px dashed hsl(var(--border))', padding: '12px 14px',
          animation: 'fadeSlideIn 0.2s ease both',
        }}>
          {isExpress ? (
            <>
              <Row label="💼 Part Voyageur" value={data.part_voyageur} color="#1a5276" />
              <Row label="🏪 Part Point Relais" value={data.part_relais} color="#6c3483" />
              <Row label="⚙️ Part Admin (Bordero)" value={data.part_admin} color="var(--bordeaux)" />
              <TotalRow value={data.prix_client} />
            </>
          ) : (
            <>
              <Row label="🏪 Part Relais / Malle" value={data.part_relais} color="#6c3483" />
              <Row label="⚙️ Logistique Admin" value={data.part_admin} color="var(--bordeaux)" />
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed hsl(var(--border))', fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                Malle complète : <strong>{data.prix_malle.toFixed(2)} €</strong> · Coût moyen/livre : ~{data.cout_moyen_livre.toFixed(2)} €
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 1, color: 'hsl(var(--muted-foreground))' }}>{label}</span>
      <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 13, fontWeight: 700, color }}>{value.toFixed(2)} €</span>
    </div>
  );
}

function TotalRow({ value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid hsl(var(--border))', paddingTop: 8, marginTop: 4 }}>
      <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>Total client</span>
      <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: 'var(--bordeaux)' }}>{value.toFixed(2)} €</span>
    </div>
  );
}