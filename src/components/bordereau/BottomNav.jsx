import React from 'react';

export default function BottomNav({ role, activePanel, onSwitch }) {
  const navStyle = {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 480,
    background: 'var(--creme)',
    borderTop: '2px solid var(--encre)',
    display: 'flex',
    zIndex: 100,
  };

  const itemStyle = (active) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 4px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s',
    borderRight: '1px dashed rgba(26,16,8,0.2)',
  });

  const labelStyle = (active) => ({
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: active ? 'var(--bordeaux)' : 'rgba(26,16,8,0.5)',
    fontWeight: active ? 'bold' : 'normal',
    fontFamily: "'Special Elite', monospace",
  });

  const NavItem = ({ panelId, icon, label, badge }) => {
    const active = activePanel === panelId;
    return (
      <div style={{ ...itemStyle(active), borderRight: '1px dashed rgba(26,16,8,0.2)' }} onClick={() => onSwitch(panelId)}>
        {active && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--bordeaux)' }} />
        )}
        <span style={{ fontSize: 22, marginBottom: 3 }}>{icon}</span>
        <span style={labelStyle(active)}>{label}</span>
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
      {role === 'lecteur' && (
        <>
          <NavItem panelId="catalogue" icon="🔍" label="Catalogue" />
          <NavItem panelId="etagere" icon="📚" label="Étagère" badge="2" />
        </>
      )}
      {role === 'voyageur' && (
        <NavItem panelId="missions" icon="🗺️" label="Missions" />
      )}
      {role === 'relais' && (
        <NavItem panelId="stock" icon="📦" label="Stock" />
      )}
      <div
        style={{ ...itemStyle(false), borderRight: 'none' }}
        onClick={() => alert('Profil & Paramètres')}
      >
        <span style={{ fontSize: 22, marginBottom: 3 }}>👤</span>
        <span style={labelStyle(false)}>Profil</span>
      </div>
    </nav>
  );
}