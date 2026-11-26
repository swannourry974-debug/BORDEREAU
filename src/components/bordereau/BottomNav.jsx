import React from 'react';
import {
  Home, Bookmark, Heart, Plane, MapPin, Wallet,
  Package, Camera, BarChart3, Scale, User, Settings,
} from 'lucide-react';

const ITEMS = [
  { panelId: 'catalogue', Icon: Home, label: 'Catalogue', roles: ['lecteur', 'voyageur', 'relais', 'admin', 'admin_secondaire'] },
  { panelId: 'etagere', Icon: Bookmark, label: 'Étagère', roles: ['lecteur'] },
  { panelId: 'wishlist', Icon: Heart, label: 'Envies', roles: ['lecteur'] },
  { panelId: 'accueil-voyageur', Icon: Plane, label: 'Accueil', roles: ['voyageur'] },
  { panelId: 'missions', Icon: MapPin, label: 'Missions', roles: ['voyageur'] },
  { panelId: 'wallet', Icon: Wallet, label: 'Gains', roles: ['voyageur'] },
  { panelId: 'stock', Icon: Package, label: 'Stock', roles: ['relais'] },
  { panelId: 'scanner', Icon: Camera, label: 'Scanner', roles: ['relais'] },
  { panelId: 'profils', Icon: BarChart3, label: 'Profils', roles: ['relais'] },
  { panelId: 'progression-collecte', Icon: Scale, label: 'Collecte', roles: ['lecteur', 'voyageur', 'relais'] },
  { panelId: 'profil', Icon: User, label: 'Profil', roles: ['lecteur', 'voyageur', 'relais', 'admin', 'admin_secondaire'] },
  { panelId: 'admin', Icon: Settings, label: 'Admin', roles: ['admin', 'admin_secondaire'] },
];

export default function BottomNav({ role, activePanel, onSwitch }) {
  const visibleItems = ITEMS.filter((item) => item.roles.includes(role));

  return (
    <nav
      aria-label="Navigation principale"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        background: 'var(--bordero-surface-strong)',
        borderTop: '1px solid var(--bordero-line)',
        display: 'flex',
        zIndex: 100,
        overflowX: 'auto',
        padding: '8px 8px',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {visibleItems.map(({ panelId, Icon, label }) => {
        const active = activePanel === panelId;
        return (
          <button
            key={panelId}
            type="button"
            onClick={() => onSwitch(panelId)}
            aria-current={active ? 'page' : undefined}
            className="relative flex flex-1 min-w-[64px] flex-col items-center gap-1 rounded-xl px-1 py-2"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
              color: active ? 'var(--bordeaux)' : 'var(--encre-douce)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {active && (
              <span
                aria-hidden="true"
                style={{ position: 'absolute', top: 0, left: '28%', right: '28%', height: 2, borderRadius: 2, background: 'var(--bordeaux)' }}
              />
            )}
            <Icon size={20} strokeWidth={active ? 2.2 : 1.7} aria-hidden="true" />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 9,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                fontWeight: active ? 700 : 500,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
