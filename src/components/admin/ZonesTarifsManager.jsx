import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const EMPTY_ZONE = {
  zone_nom: '', pays_code: '', pays_nom: '', emoji_drapeau: '',
  frais_lecteur_express: '', frais_lecteur_collectif: '',
  part_voyageur_express: '', part_relais: '',
  cout_fret_estime_kg: '', taxe_assurance: '',
  devise: 'EUR', actif: true,
};

const FRAIS_STRIPE = 0.029;

function margeExpress(z) {
  const f = z.frais_lecteur_express || 0;
  const stripe = Math.round((f * FRAIS_STRIPE + 0.30) * 100) / 100;
  return Math.round((f - (z.part_voyageur_express || 0) - (z.part_relais || 0) - (z.taxe_assurance || 0) - stripe) * 100) / 100;
}
function margeCollectif(z) {
  const f = z.frais_lecteur_collectif || 0;
  const fret = Math.round(((z.cout_fret_estime_kg || 0) * 0.3) * 100) / 100;
  const stripe = Math.round((f * FRAIS_STRIPE + 0.30) * 100) / 100;
  return Math.round((f - fret - (z.part_relais || 0) - (z.taxe_assurance || 0) - stripe) * 100) / 100;
}

export default function ZonesTarifsManager() {
  const [zones, setZones] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [relais, setRelais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_ZONE);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('tarifs'); // 'tarifs' | 'relais'

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.ZonesTarifs.list(),
      base44.entities.Commande.list('-created_date', 500),
      base44.entities.PointRelais.list(),
    ]).then(([z, c, r]) => {
      setZones(z || []);
      setCommandes(c || []);
      setRelais(r || []);
    }).finally(() => setLoading(false));
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

  // Solde par relais : somme des part_relais des commandes livrées/au_relais
  const soldeParRelais = relais.map(r => {
    const cmdRelais = commandes.filter(c => c.point_relais_id === r.id);
    const totalGagne = cmdRelais
      .filter(c => ['au_relais', 'livree'].includes(c.statut))
      .reduce((s, c) => s + (c.part_relais || 0), 0);
    const totalEnAttente = cmdRelais
      .filter(c => c.statut === 'en_transit')
      .reduce((s, c) => s + (c.part_relais || 0), 0);
    const nbColis = cmdRelais.filter(c => c.statut === 'au_relais').length;
    return { ...r, totalGagne, totalEnAttente, nbColis, nbCommandes: cmdRelais.length };
  }).sort((a, b) => b.totalGagne - a.totalGagne);

  const inputStyle = {
    width: '100%', padding: '8px 10px',
    border: '1.5px solid hsl(var(--border))',
    background: 'hsl(var(--background))', color: 'hsl(var(--foreground))',
    fontFamily: "'Special Elite', monospace", fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = {
    fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase',
    color: 'hsl(var(--muted-foreground))', marginBottom: 4, display: 'block',
  };

  return (
    <div>
      {/* Toggle vue */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid hsl(var(--border))' }}>
        {[
          { id: 'tarifs', label: '📋 Tableau tarifaire' },
          { id: 'relais', label: '🏪 Soldes points relais' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} className="font-special" style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer',
            fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
            background: view === tab.id ? 'var(--bordeaux)' : 'transparent',
            color: view === tab.id ? 'var(--creme)' : 'hsl(var(--muted-foreground))',
            borderBottom: view === tab.id ? '2px solid var(--bordeaux)' : '2px solid transparent',
            marginBottom: -2,
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          VUE 1 : TABLEAU TARIFAIRE
      ══════════════════════════════════════════ */}
      {view === 'tarifs' && (
        <>
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

          {editing && (
            <div style={{ background: 'hsl(var(--card))', border: '2px solid var(--bordeaux)', padding: 24, marginBottom: 24 }}>
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
                  { key: 'part_voyageur_express', label: 'Part Voyageur Express (€)', type: 'number' },
                  { key: 'part_relais', label: 'Part Relais (€)', type: 'number' },
                  { key: 'cout_fret_estime_kg', label: 'Coût fret/kg (€)', type: 'number' },
                  { key: 'taxe_assurance', label: 'Taxe assurance (€)', type: 'number' },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <input
                      type={type || 'text'} step="0.01"
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

          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>Chargement...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid hsl(var(--border))' }}>
                <thead>
                  {/* Ligne 1 : groupes */}
                  <tr style={{ background: 'hsl(var(--muted))' }}>
                    <th rowSpan={2} style={thStyle}>Zone</th>
                    <th colSpan={3} style={{ ...thStyle, borderLeft: '2px solid #1a3a5c', color: '#1a3a5c', textAlign: 'center' }}>✈️ Express</th>
                    <th colSpan={3} style={{ ...thStyle, borderLeft: '2px solid #8B6914', color: '#8B6914', textAlign: 'center' }}>📦 Collectif</th>
                    <th rowSpan={2} style={thStyle}>Devise</th>
                    <th rowSpan={2} style={thStyle}>Actions</th>
                  </tr>
                  {/* Ligne 2 : sous-colonnes */}
                  <tr style={{ background: 'hsl(var(--muted))' }}>
                    <th style={{ ...thStyle, borderLeft: '2px solid #1a3a5c' }}>Frais lecteur</th>
                    <th style={thStyle}>Part voyageur</th>
                    <th style={thStyle}>Marge nette</th>
                    <th style={{ ...thStyle, borderLeft: '2px solid #8B6914' }}>Frais lecteur</th>
                    <th style={thStyle}>Part relais</th>
                    <th style={thStyle}>Marge nette</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((z, i) => {
                    const me = margeExpress(z);
                    const mc = margeCollectif(z);
                    return (
                      <tr key={z.id} style={{
                        background: z.actif ? (i % 2 === 0 ? 'hsl(var(--card))' : 'hsl(var(--background))') : 'hsl(var(--muted))',
                        opacity: z.actif ? 1 : 0.5,
                      }}>
                        <td style={tdStyle}>
                          <div className="font-special" style={{ fontSize: 13 }}>{z.emoji_drapeau} {z.zone_nom}</div>
                          <div style={{ fontSize: 9, color: 'hsl(var(--muted-foreground))' }}>{z.pays_nom} · {z.pays_code}</div>
                        </td>
                        {/* EXPRESS */}
                        <td style={{ ...tdStyle, borderLeft: '2px solid rgba(26,58,92,0.2)' }}>
                          <span className="font-playfair" style={{ fontWeight: 700 }}>{(z.frais_lecteur_express || 0).toFixed(2)} €</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color: '#1a3a5c', fontWeight: 700 }}>{(z.part_voyageur_express || 0).toFixed(2)} €</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color: me > 0 ? '#2d6a2d' : 'var(--bordeaux)', fontWeight: 700 }}>{me.toFixed(2)} €</span>
                        </td>
                        {/* COLLECTIF */}
                        <td style={{ ...tdStyle, borderLeft: '2px solid rgba(139,105,20,0.2)' }}>
                          <span className="font-playfair" style={{ fontWeight: 700 }}>{(z.frais_lecteur_collectif || 0).toFixed(2)} €</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color: '#8B6914', fontWeight: 700 }}>{(z.part_relais || 0).toFixed(2)} €</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color: mc > 0 ? '#2d6a2d' : 'var(--bordeaux)', fontWeight: 700 }}>{mc.toFixed(2)} €</span>
                        </td>
                        <td style={{ ...tdStyle, fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{z.devise}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => openEdit(z)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15 }} title="Modifier">✏️</button>
                            <button onClick={() => toggleActif(z)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15 }} title={z.actif ? 'Désactiver' : 'Activer'}>
                              {z.actif ? '🟢' : '🔴'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Légende */}
              <div style={{ marginTop: 12, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {[
                  { color: '#1a3a5c', label: 'Colonne Express — frais payés par le lecteur en mode Express' },
                  { color: '#8B6914', label: 'Colonne Collectif — frais en mode groupé (fret mutualisé)' },
                  { color: '#2d6a2d', label: 'Marge nette = après Stripe (2.9% + 0.30€), voyageur, relais, assurance, fret' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, background: l.color, flexShrink: 0 }} />
                    <span className="font-fell" style={{ fontStyle: 'italic', fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════
          VUE 2 : SOLDES POINTS RELAIS
      ══════════════════════════════════════════ */}
      {view === 'relais' && (
        <>
          <div className="font-special" style={{ fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 20 }}>
            Soldes & activité par point relais
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>Chargement...</div>
          ) : soldeParRelais.length === 0 ? (
            <div className="font-fell" style={{ fontStyle: 'italic', color: 'hsl(var(--muted-foreground))', textAlign: 'center', padding: 40 }}>
              Aucun point relais enregistré.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid hsl(var(--border))' }}>
                <thead>
                  <tr style={{ background: 'hsl(var(--muted))' }}>
                    {['Relais', 'Ville', 'Email gérant', 'Colis en stock', 'Commandes totales', 'Gagné (livré)', 'En attente (transit)', 'Total cumulé', 'Statut'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {soldeParRelais.map((r, i) => (
                    <tr key={r.id} style={{
                      background: r.actif ? (i % 2 === 0 ? 'hsl(var(--card))' : 'hsl(var(--background))') : 'hsl(var(--muted))',
                      opacity: r.actif ? 1 : 0.6,
                    }}>
                      <td style={tdStyle}>
                        <div className="font-playfair" style={{ fontWeight: 700, fontSize: 13 }}>{r.nom}</div>
                        {r.adresse && <div style={{ fontSize: 9, color: 'hsl(var(--muted-foreground))' }}>{r.adresse}</div>}
                      </td>
                      <td style={tdStyle}>{r.ville}</td>
                      <td style={{ ...tdStyle, fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>{r.gerant_email || '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          background: r.nbColis > 0 ? 'rgba(139,105,20,0.12)' : 'transparent',
                          color: r.nbColis > 0 ? '#8B6914' : 'hsl(var(--muted-foreground))',
                          fontWeight: 700, padding: '2px 8px', fontSize: 13,
                        }}>{r.nbColis}</span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>{r.nbCommandes}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <span className="font-playfair" style={{ fontWeight: 700, color: '#2d6a2d', fontSize: 14 }}>
                          {r.totalGagne.toFixed(2)} €
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <span className="font-playfair" style={{ fontWeight: 700, color: '#8B6914', fontSize: 14 }}>
                          {r.totalEnAttente.toFixed(2)} €
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <span className="font-playfair" style={{ fontWeight: 700, color: 'var(--bordeaux)', fontSize: 15 }}>
                          {(r.totalGagne + r.totalEnAttente).toFixed(2)} €
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', padding: '3px 8px',
                          background: r.actif ? 'rgba(45,106,45,0.1)' : 'rgba(128,0,32,0.08)',
                          color: r.actif ? '#2d6a2d' : 'var(--bordeaux)',
                          border: `1px solid ${r.actif ? '#2d6a2d' : 'var(--bordeaux)'}`,
                        }}>
                          {r.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Totaux */}
                <tfoot>
                  <tr style={{ background: 'hsl(var(--muted))', borderTop: '2px solid hsl(var(--border))' }}>
                    <td colSpan={5} style={{ ...tdStyle, fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>
                      Totaux ({soldeParRelais.length} relais)
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <span className="font-playfair" style={{ fontWeight: 700, color: '#2d6a2d' }}>
                        {soldeParRelais.reduce((s, r) => s + r.totalGagne, 0).toFixed(2)} €
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <span className="font-playfair" style={{ fontWeight: 700, color: '#8B6914' }}>
                        {soldeParRelais.reduce((s, r) => s + r.totalEnAttente, 0).toFixed(2)} €
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <span className="font-playfair" style={{ fontWeight: 700, color: 'var(--bordeaux)' }}>
                        {soldeParRelais.reduce((s, r) => s + r.totalGagne + r.totalEnAttente, 0).toFixed(2)} €
                      </span>
                    </td>
                    <td style={tdStyle} />
                  </tr>
                </tfoot>
              </table>

              <div style={{ marginTop: 12, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {[
                  { color: '#2d6a2d', label: 'Gagné = commandes livrées ou au relais' },
                  { color: '#8B6914', label: 'En attente = commandes en transit (non encore reçues)' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, background: l.color, flexShrink: 0 }} />
                    <span className="font-fell" style={{ fontStyle: 'italic', fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const thStyle = {
  padding: '8px 12px', textAlign: 'left',
  fontFamily: 'Special Elite, monospace', fontSize: 9,
  letterSpacing: 1.5, textTransform: 'uppercase',
  color: 'hsl(var(--muted-foreground))',
  border: '1px solid hsl(var(--border))',
  whiteSpace: 'nowrap',
};
const tdStyle = {
  padding: '10px 12px', verticalAlign: 'middle',
  border: '1px solid hsl(var(--border))',
  fontSize: 13,
};