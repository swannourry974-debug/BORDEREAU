import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const EMPTY_ZONE = {
  zone_nom: '', pays_code: '', pays_nom: '', emoji_drapeau: '',
  frais_lecteur_express: '', frais_lecteur_collectif: '',
  part_voyageur_express: '', part_relais: '',
  cout_fret_estime_kg: '', taxe_assurance: '',
  devise: 'EUR', actif: true,
};

export default function ZonesTarifsManager() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | zone object
  const [form, setForm] = useState(EMPTY_ZONE);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities.ZonesTarifs.list().then(z => setZones(z)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY_ZONE); setEditing('new'); };
  const openEdit = (z) => { setForm({ ...z }); setEditing(z); };
  const cancelEdit = () => { setEditing(null); };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...form,
      frais_lecteur_express: parseFloat(form.frais_lecteur_express),
      frais_lecteur_collectif: parseFloat(form.frais_lecteur_collectif),
      part_voyageur_express: parseFloat(form.part_voyageur_express),
      part_relais: parseFloat(form.part_relais),
      cout_fret_estime_kg: parseFloat(form.cout_fret_estime_kg),
      taxe_assurance: parseFloat(form.taxe_assurance),
    };
    if (editing === 'new') {
      await base44.entities.ZonesTarifs.create(data);
    } else {
      await base44.entities.ZonesTarifs.update(editing.id, data);
    }
    setSaving(false);
    setEditing(null);
    load();
  };

  const toggleActif = async (zone) => {
    await base44.entities.ZonesTarifs.update(zone.id, { actif: !zone.actif });
    load();
  };

  const inputStyle = {
    width: '100%', padding: '8px 10px',
    border: '1.5px solid hsl(var(--border))',
    background: 'hsl(var(--background))', color: 'hsl(var(--foreground))',
    fontFamily: "'Special Elite', monospace", fontSize: 13,
    outline: 'none',
  };
  const labelStyle = { fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 4, display: 'block' };

  const FRAIS_STRIPE = 0.029;
  const margeExpress = (z) => {
    const f = z.frais_lecteur_express;
    const stripe = Math.round((f * FRAIS_STRIPE + 0.30) * 100) / 100;
    return Math.round((f - z.part_voyageur_express - z.part_relais - z.taxe_assurance - stripe) * 100) / 100;
  };
  const margeCollectif = (z) => {
    const f = z.frais_lecteur_collectif;
    const fret = Math.round((z.cout_fret_estime_kg * 0.3) * 100) / 100;
    const stripe = Math.round((f * FRAIS_STRIPE + 0.30) * 100) / 100;
    return Math.round((f - fret - z.part_relais - z.taxe_assurance - stripe) * 100) / 100;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="font-special" style={{ fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>
          Zones & Tarifs
        </div>
        <button onClick={openNew} className="font-special" style={{
          background: 'var(--bordeaux)', color: 'var(--creme)',
          border: 'none', padding: '8px 16px', cursor: 'pointer',
          fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
        }}>
          + Nouvelle zone
        </button>
      </div>

      {/* Form édition */}
      {editing && (
        <div style={{
          background: 'hsl(var(--card))', border: '2px solid var(--bordeaux)',
          padding: 24, marginBottom: 24,
        }}>
          <div className="font-special" style={{ fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20, color: 'var(--bordeaux)' }}>
            {editing === 'new' ? '+ Nouvelle zone' : `Modifier : ${editing.zone_nom}`}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {[
              { key: 'zone_nom', label: 'Ville' },
              { key: 'pays_code', label: 'Code ISO (US, CA...)' },
              { key: 'pays_nom', label: 'Pays' },
              { key: 'emoji_drapeau', label: 'Emoji drapeau' },
              { key: 'devise', label: 'Devise (EUR, USD...)' },
              { key: 'frais_lecteur_express', label: 'Frais Express (€)', type: 'number' },
              { key: 'frais_lecteur_collectif', label: 'Frais Collectif (€)', type: 'number' },
              { key: 'part_voyageur_express', label: 'Part Voyageur (€)', type: 'number' },
              { key: 'part_relais', label: 'Part Relais (€)', type: 'number' },
              { key: 'cout_fret_estime_kg', label: 'Coût fret/kg (€)', type: 'number' },
              { key: 'taxe_assurance', label: 'Taxe assurance (€)', type: 'number' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input
                  type={type || 'text'}
                  step="0.01"
                  value={form[key] ?? ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            ))}
            <div>
              <label style={labelStyle}>Active</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <input type="checkbox" checked={!!form.actif} onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))} />
                <span style={{ fontSize: 12 }}>{form.actif ? 'Oui' : 'Non'}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button onClick={handleSave} disabled={saving} className="font-special" style={{
              background: 'var(--bordeaux)', color: 'var(--creme)', border: 'none',
              padding: '8px 20px', cursor: 'pointer', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
            }}>
              {saving ? '⟳ Enregistrement...' : '✓ Enregistrer'}
            </button>
            <button onClick={cancelEdit} className="font-special" style={{
              background: 'transparent', color: 'hsl(var(--muted-foreground))',
              border: '1px dashed hsl(var(--border))', padding: '8px 20px', cursor: 'pointer',
              fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
            }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Table des zones */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>Chargement...</div>
      ) : (
        <div style={{ border: '1.5px solid hsl(var(--border))' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 80px',
            background: 'hsl(var(--muted))', padding: '8px 16px', gap: 12,
          }}>
            {['Zone', 'Express', 'Collectif', 'Marge Express', 'Marge Collectif', 'Devise', 'Actions'].map(h => (
              <div key={h} className="font-special" style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>{h}</div>
            ))}
          </div>
          {zones.map((z, i) => {
            const me = margeExpress(z);
            const mc = margeCollectif(z);
            return (
              <div key={z.id} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 80px',
                padding: '12px 16px', gap: 12, alignItems: 'center',
                borderTop: i > 0 ? '1px dashed hsl(var(--border))' : 'none',
                background: z.actif ? 'hsl(var(--card))' : 'hsl(var(--muted))',
                opacity: z.actif ? 1 : 0.5,
              }}>
                <div>
                  <div className="font-special" style={{ fontSize: 13 }}>{z.emoji_drapeau} {z.zone_nom}</div>
                  <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>{z.pays_nom} · {z.pays_code}</div>
                </div>
                <div className="font-playfair" style={{ fontWeight: 700 }}>{z.frais_lecteur_express?.toFixed(2)} €</div>
                <div className="font-playfair" style={{ fontWeight: 700 }}>{z.frais_lecteur_collectif?.toFixed(2)} €</div>
                <div style={{ color: me > 0 ? '#2d6a2d' : 'var(--bordeaux)', fontWeight: 700 }}>{me.toFixed(2)} €</div>
                <div style={{ color: mc > 0 ? '#2d6a2d' : 'var(--bordeaux)', fontWeight: 700 }}>{mc.toFixed(2)} €</div>
                <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{z.devise}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(z)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }} title="Modifier">✏️</button>
                  <button onClick={() => toggleActif(z)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }} title={z.actif ? 'Désactiver' : 'Activer'}>
                    {z.actif ? '🟢' : '🔴'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}