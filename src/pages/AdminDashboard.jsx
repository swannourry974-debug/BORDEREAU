import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminActivityApp from '@/components/admin/AdminActivityApp';
import AdminAchatsVilles from '@/components/admin/AdminAchatsVilles';
import AdminLivraisonsEtats from '@/components/admin/AdminLivraisonsEtats';
import AdminLitiges from '@/components/admin/AdminLitiges';
import AdminReseauRelais from '@/components/admin/AdminReseauRelais';

const TABS = [
  { id: 'activite', label: "Activité de l'appli" },
  { id: 'villes', label: 'Achats par villes' },
  { id: 'livraisons', label: 'Livraisons & États' },
  { id: 'litiges', label: 'Tableau litiges' },
  { id: 'relais', label: 'Réseau Points Relais' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('activite');
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setAuthorized(u?.role === 'admin' || u?.role === 'admin_secondaire');
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

  const isAgentBordeur = user?.role === 'admin_secondaire';
  const visibleTabs = TABS;
  const openOfficialLogin = () => base44.auth.logout('/admin');

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
          <div
            onDoubleClick={openOfficialLogin}
            className="font-special"
            style={{ fontSize: 22, color: 'var(--creme)', letterSpacing: 5, textTransform: 'uppercase', cursor: 'default', userSelect: 'none' }}
          >
            BORDERO · {isAgentBordeur ? 'AGENT BORDEUR' : 'ADMIN'}
          </div>
          <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 11, color: 'rgba(253,252,240,0.7)', letterSpacing: 2 }}>
            {isAgentBordeur ? 'Supervision lecture seule — sans validation Point Relais' : 'Console de gestion'}
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
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="font-special"
            style={{
              padding: '14px 24px', border: 'none', cursor: 'pointer',
              background: 'transparent',
              borderBottom: activeTab === tab.id ? '3px solid var(--bordeaux)' : '3px solid transparent',
              color: activeTab === tab.id ? 'var(--bordeaux)' : 'hsl(var(--muted-foreground))',
              fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase',
              whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        {activeTab === 'activite' && <AdminActivityApp />}
        {activeTab === 'villes' && <AdminAchatsVilles />}
        {activeTab === 'livraisons' && <AdminLivraisonsEtats />}
        {activeTab === 'litiges' && <AdminLitiges />}
        {activeTab === 'relais' && <AdminReseauRelais />}
      </div>
    </div>
  );
}