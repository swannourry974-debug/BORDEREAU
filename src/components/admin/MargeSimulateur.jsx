import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function MargeSimulateur() {
  const [zones, setZones] = useState([]);
  const [zoneId, setZoneId] = useState('');
  const [mode, setMode] = useState('express');
  const [nbLivres, setNbLivres] = useState(20);
  const [poidsMoyen, setPoidsMoyen] = useState(0.3);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    base44.entities.ZonesTarifs.filter({ actif: true }).then(z => {
      setZones(z);
      if (z.length > 0) setZoneId(z[0].id);
    });
  }, []);

  const simulate = async () => {
    if (!zoneId) return;
    setLoading(true);
    setResult(null);
    const res = await base44.functions.invoke('calculerMarge', {
      zone_id: zoneId,
      mode,
      nb_livres_carton: parseInt(nbLivres),
      poids_moyen_kg: parseFloat(poidsMoyen),
    });
    setResult(res.data?.calcul || null);
    setLoading(false);
  };

  const selectStyle = {
    padding: '10px 14px', border: '1.5px solid hsl(var(--border))',
    background: 'hsl(var(--background))', color: 'hsl(var(--foreground))',
    fontFamily: "'Special Elite', monospace", fontSize: 13, width: '100%', outline: 'none',
  };
  const inputStyle = { ...selectStyle };
  const labelStyle = { fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 6, display: 'block' };

  return (
    <div>
      <div className="font-special" style={{ fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 20 }}>
        Simulateur de marges
      </div>

      <div style={{ background: 'hsl(var(--card))', border: '1.5px solid hsl(var(--border))', padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Zone de destination</label>
            <select value={zoneId} onChange={e => setZoneId(e.target.value)} style={selectStyle}>
              {zones.map(z => (
                <option key={z.id} value={z.id}>{z.emoji_drapeau} {z.zone_nom} ({z.pays_code})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Mode de livraison</label>
            <select value={mode} onChange={e => setMode(e.target.value)} style={selectStyle}>
              <option value="express">Express (Voyageur)</option>
              <option value="collectif">Collectif (Fret groupé)</option>
            </select>
          </div>
          {mode === 'collectif' && (
            <>
              <div>
                <label style={labelStyle}>Nb livres dans le carton</label>
                <input type="number" min={1} max={100} value={nbLivres} onChange={e => setNbLivres(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Poids moyen par livre (kg)</label>
                <input type="number" min={0.1} max={5} step={0.1} value={poidsMoyen} onChange={e => setPoidsMoyen(e.target.value)} style={inputStyle} />
              </div>
            </>
          )}
        </div>
        <button onClick={simulate} disabled={loading || !zoneId} className="font-special" style={{
          background: loading ? 'hsl(var(--muted))' : 'var(--bordeaux)',
          color: loading ? 'hsl(var(--muted-foreground))' : 'var(--creme)',
          border: 'none', padding: '10px 24px', cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 12, letterSpacing: 2, textTransform: 'uppercase',
        }}>
          {loading ? '⟳ Calcul en cours...' : '🧮 Simuler'}
        </button>
      </div>

      {/* Résultats */}
      {result && (
        <div style={{ background: 'hsl(var(--card))', border: '2px solid hsl(var(--border))', padding: 24, animation: 'fadeSlideIn 0.3s ease' }}>
          <div className="font-special" style={{ fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 20 }}>
            Résultat — {result.zone} · Mode {result.mode}
          </div>

          {/* Marge principale */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 24 }}>
            <div className="font-playfair" style={{ fontSize: 52, fontWeight: 700, color: result.marge_nette_bordereau > 0 ? '#2d6a2d' : 'var(--bordeaux)', lineHeight: 1 }}>
              {result.marge_nette_bordereau?.toFixed(2)} €
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>Marge nette / livre</div>
              <div style={{
                display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: 1,
                color: '#2d6a2d', background: 'rgba(45,106,45,0.1)', padding: '2px 8px',
                border: '1px solid #2d6a2d', marginTop: 4,
              }}>
                {result.taux_marge}
              </div>
            </div>
          </div>

          {/* Décomposition */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Prix lecteur', value: result.frais_lecteur, sign: '+', color: '#2d6a2d' },
              result.part_voyageur !== undefined && { label: 'Part voyageur', value: result.part_voyageur, sign: '-', color: 'var(--bordeaux)' },
              result.cout_transport_par_livre !== undefined && { label: 'Coût transport/livre', value: result.cout_transport_par_livre, sign: '-', color: 'var(--bordeaux)' },
              { label: 'Part relais', value: result.part_relais, sign: '-', color: '#8B6914' },
              { label: 'Taxe assurance', value: result.taxe_assurance, sign: '-', color: '#8B6914' },
              { label: 'Frais Stripe', value: result.frais_stripe, sign: '-', color: '#8B6914' },
            ].filter(Boolean).map((item, i) => (
              <div key={i} style={{
                background: 'hsl(var(--muted))', padding: '12px 14px',
                borderLeft: `3px solid ${item.color}`,
              }}>
                <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', letterSpacing: 1, textTransform: 'uppercase' }}>{item.label}</div>
                <div className="font-playfair" style={{ fontSize: 20, fontWeight: 700, color: item.color }}>
                  {item.sign} {item.value?.toFixed(2)} €
                </div>
              </div>
            ))}
          </div>

          {/* Simulation carton (collectif) */}
          {result.simulation_carton && (
            <div style={{ borderTop: '1px dashed hsl(var(--border))', paddingTop: 20 }}>
              <div className="font-special" style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 12 }}>
                Simulation carton complet ({result.simulation_carton.nb_livres} livres)
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Revenu total</div>
                  <div className="font-playfair" style={{ fontSize: 24, fontWeight: 700 }}>{result.simulation_carton.revenu_total?.toFixed(2)} €</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Bénéfice net carton</div>
                  <div className="font-playfair" style={{ fontSize: 24, fontWeight: 700, color: '#2d6a2d' }}>{result.simulation_carton.marge_totale_carton?.toFixed(2)} €</div>
                </div>
                {result.comparaison_express && (
                  <div>
                    <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Gain vs Express</div>
                    <div className="font-playfair" style={{ fontSize: 24, fontWeight: 700, color: result.comparaison_express.gain_collectif_vs_express >= 0 ? '#2d6a2d' : 'var(--bordeaux)' }}>
                      {result.comparaison_express.gain_collectif_vs_express >= 0 ? '+' : ''}{result.comparaison_express.gain_collectif_vs_express?.toFixed(2)} €/livre
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}