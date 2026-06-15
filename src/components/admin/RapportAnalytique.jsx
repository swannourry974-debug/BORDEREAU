import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';

const BORDEAUX = '#800020';
const COLORS = ['#800020', '#1a3a5c', '#8B6914', '#2d6a2d', '#5a0015', '#3a5a8c'];

const OBJECTIFS_MENSUELS = {
  commandes: 80,
  revenus: 2000,
  lecteurs: 30,
  livrees: 60,
};

function KpiCard({ icon, label, value, sub, color, objectif, objectifLabel }) {
  const pct = objectif ? Math.min(100, Math.round((parseFloat(value) / objectif) * 100)) : null;
  return (
    <div style={{
      background: 'hsl(var(--card))', border: '1.5px solid hsl(var(--border))',
      borderLeft: `4px solid ${color}`, padding: '16px 20px',
      boxShadow: '2px 2px 0 rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div className="font-playfair" style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', marginTop: 2, fontStyle: 'italic' }}>{sub}</div>}
      {pct !== null && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 9, letterSpacing: 1, color: 'hsl(var(--muted-foreground))' }}>OBJECTIF {objectifLabel || objectif}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: pct >= 100 ? '#2d6a2d' : pct >= 60 ? '#8B6914' : BORDEAUX }}>{pct}%</span>
          </div>
          <div style={{ height: 4, background: 'hsl(var(--border))', borderRadius: 2 }}>
            <div style={{ height: 4, borderRadius: 2, width: `${pct}%`, background: pct >= 100 ? '#2d6a2d' : pct >= 60 ? '#8B6914' : BORDEAUX, transition: 'width 0.6s ease' }} />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <div className="font-special" style={{
      fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
      color: 'hsl(var(--muted-foreground))', marginBottom: 14, marginTop: 28,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {children}
      <span style={{ flex: 1, height: 1, background: 'repeating-linear-gradient(90deg, hsl(var(--border)) 0, hsl(var(--border)) 4px, transparent 4px, transparent 8px)' }} />
    </div>
  );
}

export default function RapportAnalytique() {
  const [commandes, setCommandes] = useState([]);
  const [relais, setRelais] = useState([]);
  const [voyages, setVoyages] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Commande.list('-created_date', 500),
      base44.entities.PointRelais.list(),
      base44.entities.Voyage.list('-date_vol', 200),
      base44.entities.MissionVoyageur.list('-created_date', 200),
    ]).then(([c, r, v, m]) => {
      setCommandes(c || []);
      setRelais(r || []);
      setVoyages(v || []);
      setMissions(m || []);
    }).finally(() => setLoading(false));
  }, []);

  // ─── KPIs du mois courant ───
  const now = new Date();
  const moisDebut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const commandesMois = useMemo(() =>
    commandes.filter(c => c.created_date >= moisDebut), [commandes, moisDebut]);

  const revenusMois = useMemo(() =>
    commandesMois.reduce((s, c) => s + (c.montant_paye || 0), 0), [commandesMois]);

  const lecteursMois = useMemo(() =>
    [...new Set(commandesMois.map(c => c.lecteur_email))].length, [commandesMois]);

  const livreesMois = useMemo(() =>
    commandesMois.filter(c => c.statut === 'livree').length, [commandesMois]);

  // ─── Livres recherchés par zone ───
  const livresParZone = useMemo(() => {
    const map = {};
    commandes.forEach(c => {
      const z = c.zone_nom || 'Inconnue';
      if (!map[z]) map[z] = { zone: z, total: 0, poche: 0, broche: 0, bd: 0, relie: 0 };
      map[z].total++;
      const t = (c.livre_type || '').toLowerCase();
      if (t === 'poche') map[z].poche++;
      else if (t === 'broché' || t === 'broche') map[z].broche++;
      else if (t === 'bd') map[z].bd++;
      else if (t === 'relié' || t === 'relie') map[z].relie++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [commandes]);

  // ─── Tendances voyageurs 6 mois ───
  const tendancesVoyageurs = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      const vols = voyages.filter(v => v.date_vol?.startsWith(key)).length;
      const caps = vols * 5; // ~5 livres par voyageur en moyenne
      months.push({ label, vols, capacite: caps, mois: key });
    }
    // Prévisions : 3 prochains mois (extrapolation linéaire simple)
    const derniers = months.slice(-2).map(m => m.vols);
    const tendance = derniers.length >= 2 ? Math.max(0, derniers[1] + (derniers[1] - derniers[0])) : 0;
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      const volsPrevu = Math.round(tendance * (1 + i * 0.05));
      months.push({ label, vols: 0, capacite: 0, volsPrevu, capacitePrevisionnelle: volsPrevu * 5, prevision: true });
    }
    return months;
  }, [voyages]);

  // ─── Parcours lecteur (entonnoir) ───
  const entonnoir = useMemo(() => [
    { label: 'Commandes totales', val: commandes.length, color: '#1a3a5c' },
    { label: 'Commandes payées', val: commandes.filter(c => c.statut !== 'en_attente_paiement').length, color: '#8B6914' },
    { label: 'En transit / au relais', val: commandes.filter(c => ['en_transit', 'au_relais'].includes(c.statut)).length, color: BORDEAUX },
    { label: 'Livrées avec succès', val: commandes.filter(c => c.statut === 'livree').length, color: '#2d6a2d' },
  ], [commandes]);

  // ─── Activité relais par ville ───
  const relaisParVille = useMemo(() => {
    const map = {};
    relais.forEach(r => {
      const ville = r.ville || 'Inconnue';
      if (!map[ville]) map[ville] = { ville, actifs: 0, inactifs: 0, stockTotal: 0 };
      if (r.actif) map[ville].actifs++;
      else map[ville].inactifs++;
      map[ville].stockTotal += (r.stock_actuel || 0);
    });
    return Object.values(map).sort((a, b) => (b.actifs + b.inactifs) - (a.actifs + a.inactifs));
  }, [relais]);

  // ─── Revenus relais par ville ───
  const revenusRelais = useMemo(() => {
    const map = {};
    commandes.filter(c => c.part_relais > 0).forEach(c => {
      const r = relais.find(r => r.id === c.point_relais_id);
      const ville = r?.ville || c.zone_nom || 'Autre';
      if (!map[ville]) map[ville] = { ville, revenus: 0, commandes: 0 };
      map[ville].revenus += (c.part_relais || 0);
      map[ville].commandes++;
    });
    return Object.values(map).sort((a, b) => b.revenus - a.revenus).slice(0, 6);
  }, [commandes, relais]);

  // ─── Évolution mensuelle commandes ───
  const evolutionMensuelle = useMemo(() => {
    const map = {};
    commandes.forEach(c => {
      const d = new Date(c.created_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      if (!map[key]) map[key] = { label, commandes: 0, revenus: 0 };
      map[key].commandes++;
      map[key].revenus += c.montant_paye || 0;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([, v]) => v);
  }, [commandes]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>
        Chargement du rapport analytique…
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 40 }}>

      {/* ── KPIs mois courant vs objectifs ── */}
      <SectionHeader>📈 Performance du mois — objectifs vs réalité</SectionHeader>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        <KpiCard icon="📦" label="Commandes ce mois" value={commandesMois.length} color="#1a3a5c" objectif={OBJECTIFS_MENSUELS.commandes} objectifLabel={OBJECTIFS_MENSUELS.commandes} />
        <KpiCard icon="💶" label="Revenus ce mois" value={`${revenusMois.toFixed(0)} €`} color="#2d6a2d" objectif={OBJECTIFS_MENSUELS.revenus} objectifLabel={`${OBJECTIFS_MENSUELS.revenus} €`} />
        <KpiCard icon="👤" label="Nouveaux lecteurs" value={lecteursMois} color={BORDEAUX} objectif={OBJECTIFS_MENSUELS.lecteurs} objectifLabel={OBJECTIFS_MENSUELS.lecteurs} />
        <KpiCard icon="✅" label="Livraisons réussies" value={livreesMois} color="#8B6914" objectif={OBJECTIFS_MENSUELS.livrees} objectifLabel={OBJECTIFS_MENSUELS.livrees} />
      </div>

      {/* ── Parcours lecteur ── */}
      <SectionHeader>🧭 Parcours des lecteurs — entonnoir de conversion</SectionHeader>
      <div style={{ background: 'hsl(var(--card))', border: '1.5px solid hsl(var(--border))', padding: 20 }}>
        {entonnoir.map((e, i) => {
          const pct = entonnoir[0].val > 0 ? Math.round((e.val / entonnoir[0].val) * 100) : 0;
          return (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="font-special" style={{ fontSize: 10, letterSpacing: 1, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>{e.label}</span>
                <span className="font-playfair" style={{ fontSize: 14, fontWeight: 700, color: e.color }}>{e.val} <span style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>({pct}%)</span></span>
              </div>
              <div style={{ height: 8, background: 'hsl(var(--border))', borderRadius: 2 }}>
                <div style={{ height: 8, borderRadius: 2, width: `${pct}%`, background: e.color, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          );
        })}
        {entonnoir[0].val > 0 && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(45,106,45,0.07)', border: '1px dashed #2d6a2d' }}>
            <span className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: '#2d6a2d' }}>
              Taux de conversion global : {Math.round((entonnoir[3].val / entonnoir[0].val) * 100)}% des commandes aboutissent à une livraison réussie.
            </span>
          </div>
        )}
      </div>

      {/* ── Livres par zone ── */}
      <SectionHeader>📚 Préférences de livres par région géographique</SectionHeader>
      {livresParZone.length === 0 ? (
        <div className="font-fell" style={{ fontStyle: 'italic', color: 'hsl(var(--muted-foreground))', padding: '20px 0', textAlign: 'center' }}>Aucune donnée disponible.</div>
      ) : (
        <div style={{ background: 'hsl(var(--card))', border: '1.5px solid hsl(var(--border))', padding: 20 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={livresParZone} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="zone" tick={{ fontSize: 10, fontFamily: 'Special Elite' }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontFamily: 'Special Elite', fontSize: 11, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'Special Elite' }} />
              <Bar dataKey="poche" name="Poche" fill="#1a3a5c" stackId="a" />
              <Bar dataKey="broche" name="Broché" fill="#8B6914" stackId="a" />
              <Bar dataKey="bd" name="BD" fill={BORDEAUX} stackId="a" />
              <Bar dataKey="relie" name="Relié" fill="#2d6a2d" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
            {livresParZone.slice(0, 4).map(z => {
              const dominant = ['poche','broche','bd','relie'].reduce((a, b) => z[a] > z[b] ? a : b, 'poche');
              const labels = { poche: 'Poche', broche: 'Broché', bd: 'BD', relie: 'Relié' };
              return (
                <div key={z.zone} style={{ background: 'hsl(var(--background))', border: '1px dashed hsl(var(--border))', padding: '8px 12px' }}>
                  <div className="font-special" style={{ fontSize: 9, letterSpacing: 1, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>{z.zone}</div>
                  <div className="font-playfair" style={{ fontSize: 13, fontWeight: 700, color: BORDEAUX, marginTop: 2 }}>{labels[dominant]}</div>
                  <div style={{ fontSize: 9, color: 'hsl(var(--muted-foreground))' }}>{z.total} commande{z.total !== 1 ? 's' : ''}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Capacité voyageurs 6 mois ── */}
      <SectionHeader>✈️ Tendances voyageurs & capacité transport — 6 mois</SectionHeader>
      <div style={{ background: 'hsl(var(--card))', border: '1.5px solid hsl(var(--border))', padding: 20 }}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={tendancesVoyageurs}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'Special Elite' }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ fontFamily: 'Special Elite', fontSize: 11, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              formatter={(val, name) => [val, name]}
            />
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'Special Elite' }} />
            <Line type="monotone" dataKey="vols" name="Vols déclarés" stroke="#1a3a5c" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="capacite" name="Capacité livres (réelle)" stroke="#8B6914" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="volsPrevu" name="Vols prévus" stroke={BORDEAUX} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} />
            <Line type="monotone" dataKey="capacitePrevisionnelle" name="Capacité prévisionnelle" stroke="#2d6a2d" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(26,58,92,0.07)', border: '1px dashed #1a3a5c' }}>
          <span className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: '#1a3a5c' }}>
            Les lignes en pointillés représentent les prévisions extrapolées pour les 3 prochains mois.
          </span>
        </div>
      </div>

      {/* ── Activité relais par ville ── */}
      <SectionHeader>🏪 Activité des points relais par ville</SectionHeader>
      {relaisParVille.length === 0 ? (
        <div className="font-fell" style={{ fontStyle: 'italic', color: 'hsl(var(--muted-foreground))', padding: '20px 0', textAlign: 'center' }}>Aucun relais enregistré.</div>
      ) : (
        <div style={{ border: '1.5px solid hsl(var(--border))', background: 'hsl(var(--card))' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', padding: '8px 16px', borderBottom: '1px solid hsl(var(--border))', gap: 8 }}>
            {['Ville', 'Actifs', 'Inactifs', 'Stock'].map(h => (
              <div key={h} className="font-special" style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>{h}</div>
            ))}
          </div>
          {relaisParVille.map((r, i) => (
            <div key={r.ville} style={{
              display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px',
              padding: '11px 16px', gap: 8,
              borderBottom: i < relaisParVille.length - 1 ? '1px dashed hsl(var(--border))' : 'none',
              alignItems: 'center',
            }}>
              <div className="font-playfair" style={{ fontWeight: 700, fontSize: 13 }}>{r.ville}</div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ background: 'rgba(45,106,45,0.12)', color: '#2d6a2d', padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{r.actifs}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ background: 'rgba(128,0,32,0.08)', color: BORDEAUX, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{r.inactifs}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#8B6914' }}>{r.stockTotal}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Revenus relais & prévisions commandes ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 28 }}>
        <div>
          <SectionHeader>💰 Revenus générés par ville (relais)</SectionHeader>
          {revenusRelais.length === 0 ? (
            <div className="font-fell" style={{ fontStyle: 'italic', color: 'hsl(var(--muted-foreground))', padding: '20px 0', textAlign: 'center', fontSize: 12 }}>Aucun revenu relais enregistré.</div>
          ) : (
            <div style={{ background: 'hsl(var(--card))', border: '1.5px solid hsl(var(--border))', padding: 16 }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={revenusRelais} dataKey="revenus" nameKey="ville" cx="50%" cy="50%" outerRadius={70} label={({ ville, percent }) => `${ville} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {revenusRelais.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v.toFixed(2)} €`, 'Revenus']} contentStyle={{ fontFamily: 'Special Elite', fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div>
          <SectionHeader>📊 Évolution mensuelle des commandes</SectionHeader>
          <div style={{ background: 'hsl(var(--card))', border: '1.5px solid hsl(var(--border))', padding: 16 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={evolutionMensuelle} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fontFamily: 'Special Elite' }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={{ fontFamily: 'Special Elite', fontSize: 10 }} formatter={(v, n) => [n === 'revenus' ? `${v.toFixed(0)} €` : v, n === 'revenus' ? 'Revenus' : 'Commandes']} />
                <Bar dataKey="commandes" name="Commandes" fill="#1a3a5c" />
                <Bar dataKey="revenus" name="Revenus (€)" fill="#8B6914" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Note méthodologique ── */}
      <div style={{ marginTop: 28, padding: '14px 18px', background: 'rgba(139,105,20,0.06)', border: '1px dashed #8B6914' }}>
        <div className="font-special" style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#8B6914', marginBottom: 6 }}>Note méthodologique</div>
        <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 11, color: 'hsl(var(--muted-foreground))', lineHeight: 1.7 }}>
          Les prévisions de capacité sont calculées par extrapolation linéaire sur les 2 derniers mois de vols déclarés, avec un coefficient de croissance mensuel de 5%. Les objectifs mensuels sont paramétrés à : {OBJECTIFS_MENSUELS.commandes} commandes · {OBJECTIFS_MENSUELS.revenus} € de revenus · {OBJECTIFS_MENSUELS.lecteurs} nouveaux lecteurs · {OBJECTIFS_MENSUELS.livrees} livraisons réussies. Pour intégrer Google Analytics GA4, ajoutez votre ID de mesure G-XXXXXXXXXX dans index.html.
        </div>
      </div>
    </div>
  );
}