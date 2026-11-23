import React from 'react';

const ITEMS = [
  { panelId: 'catalogue', icon: '🏠', label: 'Lecteur', roles: ['lecteur', 'voyageur', 'relais', 'admin', 'admin_secondaire'] },
  { panelId: 'etagere', icon: '▥', label: 'Biblio', roles: ['lecteur'] },
  { panelId: 'wishlist', icon: '♡', label: 'Wishlist', roles: ['lecteur'] },
  { panelId: 'accueil-voyageur', icon: '✈️', label: 'Voyageur', roles: ['voyageur'] },
  { panelId: 'missions', icon: '🗺️', label: 'Mission', roles: ['voyageur'] },
  { panelId: 'wallet', icon: '👛', label: 'Wallet', roles: ['voyageur'] },
  { panelId: 'stock', icon: '📦', label: 'Relais', roles: ['relais'] },
  { panelId: 'scanner', icon: '📷', label: 'Scanner', roles: ['relais'] },
  { panelId: 'profils', icon: '📊', label: 'Profils', roles: ['relais'] },
  { panelId: 'progression-collecte', icon: '⚖️', label: 'Collecte', roles: ['lecteur', 'voyageur', 'relais'] },
  { panelId: 'profil', icon: '👤', label: 'Profil', roles: ['lecteur', 'voyageur', 'relais', 'admin', 'admin_secondaire'] },
  { panelId: 'admin', icon: '⌘', label: 'Admin', roles: ['admin', 'admin_secondaire'] },
];

export default function BottomNav({ role, activePanel, onSwitch }) {
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
    background: 'transparent',
    border: 'none',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
  });

  const labelStyle = (active) => ({
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: active ? 'var(--bordeaux)' : 'hsl(var(--muted-foreground))',
    fontWeight: active ? 'bold' : 'normal',
    fontFamily: "'Special Elite', monospace",
  });

  const visibleItems = ITEMS.filter(item => item.roles.includes(role));

  return (
    <nav style={navStyle} aria-label="Navigation principale">
      {visibleItems.map(({ panelId, icon, label }) => {
        const active = activePanel === panelId;
        const featured = role === 'lecteur' && panelId === 'etagere';
        const labelStyles = labelStyle(active);
        return (
          <button
            key={panelId}
            type="button"
            onClick={() => onSwitch(panelId)}
            aria-current={active ? 'page' : undefined}
            style={{
              ...itemStyle(active),
              ...(featured ? { marginTop: -10, background: active ? 'var(--bordeaux)' : '#4B1E1E', border: '1px solid #C8A165', boxShadow: '0 -5px 18px rgba(75,30,30,0.25)' } : {}),
            }}
          >
            {active && (
              <span aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: featured ? '#C8A165' : 'var(--bordeaux)' }} />
            )}
            <span aria-hidden="true" style={{ fontSize: featured ? 26 : 22, marginBottom: 3 }}>{icon}</span>
            <span style={{ ...labelStyles, color: featured ? '#F5E6CC' : labelStyles.color }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
