import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BottomNav({ role, activePanel, onSwitch }) {
  const navigate = useNavigate();
  const navStyle = {
    position: 'fixed',
    bottom: '1.5cm',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 480,
    background: 'var(--papier)',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
    borderTop: '2px dashed rgba(139,105,20,0.4)',
    boxShadow: '0 -2px 10px rgba(26,16,8,0.12)',
    display: 'flex',
    zIndex: 100,
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
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
    borderRight: '1px dashed hsl(var(--border))',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  });

  const labelStyle = (active) => ({
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: active ? 'var(--bordeaux)' : 'hsl(var(--muted-foreground))',
    fontWeight: active ? 'bold' : 'normal',
    fontFamily: "'Special Elite', monospace",
    userSelect: 'none',
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
        onClick={() => navigate('/profil')}
      >
        <span style={{ fontSize: 22, marginBottom: 3 }}>👤</span>
        <span style={labelStyle(false)}>Profil</span>
      </div>
    </nav>
  );
}