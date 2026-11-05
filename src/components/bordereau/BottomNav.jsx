import React from 'react';
import { useLang } from '@/lib/LangContext';

export default function BottomNav({ role, relaisValidated = true, activePanel, onSwitch }) {
  const { t } = useLang();
  const navStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    background: 'hsl(var(--background))',
    borderTop: '2px solid hsl(var(--border))',
    display: 'flex',
    zIndex: 100,
    overflowX: 'auto',
    paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
    boxShadow: '0 -6px 18px rgba(26,16,8,0.12)',
  };

  const itemStyle = (active) => ({
    flex: '0 0 76px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '9px 2px 8px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s',
    borderRight: '1px dashed hsl(var(--border))',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  });

  const labelStyle = (active) => ({
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: active ? 'var(--bordeaux)' : 'hsl(var(--muted-foreground))',
    fontWeight: active ? 'bold' : 'normal',
    fontFamily: "'Special Elite', monospace",
    userSelect: 'none',
    WebkitUserSelect: 'none',
  });

  const NavItem = ({ panelId, icon, label, badge }) => {
    const active = activePanel === panelId;
    const featured = role === 'lecteur' && panelId === 'etagere';
    const labelStyles = labelStyle(active);
    return (
      <div style={{ ...itemStyle(active), borderRight: '1px dashed rgba(26,16,8,0.2)', ...(featured ? { marginTop: -10, background: active ? 'var(--bordeaux)' : '#4B1E1E', border: '1px solid #C8A165', boxShadow: '0 -5px 18px rgba(75,30,30,0.25)' } : {}) }} onClick={() => onSwitch(panelId)}>
        {active && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: featured ? '#C8A165' : 'var(--bordeaux)' }} />
        )}
        <span style={{ fontSize: featured ? 26 : 22, marginBottom: 3 }}>{icon}</span>
        <span style={{ ...labelStyles, color: featured ? '#F5E6CC' : labelStyles.color }}>{label}</span>
        {badge && (
          <span style={{
            position: 'absolute', top: 6, right: 'calc(50% - 18px)',
            background: 'var(--bordeaux)', color: 'var(--creme)',
            fontSize: 8, width: 14, height: 14, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'monospace',
          }}>{badge}</span>
        )}
      </div>
    );
  };

  return (
    <nav style={navStyle}>
      <NavItem panelId="catalogue" icon="🏠" label="Lecteur" />
      <NavItem panelId="etagere" icon="▥" label="Biblio" />
      <NavItem panelId="wishlist" icon="♡" label="Wishlist" />
      <NavItem panelId="accueil-voyageur" icon="✈️" label="Voyageur" />
      <NavItem panelId="missions" icon="🗺️" label="Mission" />
      <NavItem panelId="scanner" icon="📷" label="Scanner" />
      <NavItem panelId="stock" icon="📦" label="Relais" />
      <NavItem panelId="profils" icon="📊" label="Profils" />
      <NavItem panelId="progression-collecte" icon="⚖️" label="Collecte" />
      <NavItem panelId="wallet" icon="👛" label="Wallet" />
      <NavItem panelId="profil" icon="👤" label="Profil" />
      <NavItem panelId="admin" icon="⌘" label="Admin" />
    </nav>
  );
}