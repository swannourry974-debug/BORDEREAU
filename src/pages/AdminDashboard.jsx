import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ZonesTarifsManager from '@/components/admin/ZonesTarifsManager';
import MargeSimulateur from '@/components/admin/MargeSimulateur';
import AdminStats from '@/components/admin/AdminStats';
import ValidationLivraisons from '@/components/admin/ValidationLivraisons';
import SuiviAcheminement from '@/components/admin/SuiviAcheminement';
import RapportAnalytique from '@/components/admin/RapportAnalytique';

const TABS = [
  { id: 'stats', label: '📊 Tableau de bord', icon: '📊' },
  { id: 'rapport', label: '🔬 Rapport Analytique', icon: '🔬' },
  { id: 'suivi', label: '🗺️ Suivi Acheminement', icon: '🗺️' },
  { id: 'validations', label: '✅ Validations', icon: '✅' },
  { id: 'zones', label: '🌍 Zones & Tarifs', icon: '🌍' },
  { id: 'marges', label: '🧮 Simulateur de marges', icon: '🧮' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('stats');
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setAuthorized(u?.role === 'admin');
    }).catch(() => setAuthorized(false));
  }, []);

  if (authorized === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--background))' }}>
        <div style={{ width: 32, height: 32, border: '3px solid hsl(var(--border))', borderTopColor: 'var(--bordeaux)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--background))', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <div className="font-special" style={{ fontSize: 20, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--bordeaux)' }}>Accès refusé</div>
        <div className="font-fell" style={{ fontStyle: 'italic', color: 'hsl(var(--muted-foreground))' }}>Cette section est réservée aux administrateurs.</div>
        <a href="/" style={{ marginTop: 8, color: 'var(--bordeaux)', fontSize: 13, textDecoration: 'underline' }}>← Retour à l'application</a>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
      {/* Header */}
      <header style={{
        background: 'var(--bordeaux)', padding: '18px 24px',
        boxShadow: '0 3px 12px rgba(128,0,32,0.4)',
        borderBottom: '2px solid var(--bordeaux-dark)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <div className="font-special" style={{ fontSize: 22, color: 'var(--creme)', letterSpacing: 5, textTransform: 'uppercase' }}>
            BORDEREAU · ADMIN
          </div>
          <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 11, color: 'rgba(253,252,240,0.7)', letterSpacing: 2 }}>
            Console de gestion
          </div>
        </div>
        <a href="/" className="font-special" style={{
          background: 'rgba(253,252,240,0.15)', color: 'var(--creme)',
          fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
          padding: '6px 12px', border: '1px dashed rgba(253,252,240,0.4)',
          textDecoration: 'none', cursor: 'pointer',
        }}>
          ← App
        </a>
      </header>

      {/* Tabs */}
      <div style={{
        borderBottom: '2px solid hsl(var(--border))',
        display: 'flex', background: 'hsl(var(--card))',
        overflowX: 'auto',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="font-special"
            style={{
              padding: '14px 24px', border: 'none', cursor: 'pointer',
              background: 'transparent',
              borderBottom: activeTab === tab.id ? '3px solid var(--bordeaux)' : '3px solid transparent',
              color: activeTab === tab.id ? 'var(--bordeaux)' : 'hsl(var(--muted-foreground))',
              fontSize: 12, letterSpacing: 2, textTransform: 'uppercase',
              whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        {activeTab === 'stats' && <AdminStats />}
        {activeTab === 'rapport' && <RapportAnalytique />}
        {activeTab === 'suivi' && <SuiviAcheminement />}
        {activeTab === 'validations' && <ValidationLivraisons />}
        {activeTab === 'zones' && <ZonesTarifsManager />}
        {activeTab === 'marges' && <MargeSimulateur />}
      </div>
    </div>
  );
}