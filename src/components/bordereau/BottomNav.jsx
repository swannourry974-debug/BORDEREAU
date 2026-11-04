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
    background: 'var(--creme)',
    borderTop: '1.5px solid rgba(26,16,8,0.18)',
    display: 'flex',
    zIndex: 100,
    paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
    boxShadow: '0 -6px 20px rgba(26,16,8,0.12)',
  };

  const itemStyle = (active) => ({
    flex: 1,
    minHeight: 52,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 2px 4px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.18s ease-in-out',
    borderRight: '1px dashed rgba(26,16,8,0.15)',
    background: active ? 'rgba(128,0,32,0.06)' : 'transparent',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  });

  const labelStyle = (active) => ({
    fontSize: 9.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: active ? 'var(--bordeaux)' : 'rgba(26,16,8,0.6)',
    fontWeight: active ? '700' : '500',
    fontFamily: "'Special Elite', monospace",
    lineHeight: 1.1,
    marginTop: 2,
    userSelect: 'none',
    WebkitUserSelect: 'none',
  });

  const NavItem = ({ panelId, icon, label, badge, isLast }) => {
    const active = activePanel === panelId || (panelId === 'etagere' && ['wishlist', 'favoris'].includes(activePanel));
    const labelStyles = labelStyle(active);
    return (
      <div
        style={{
          ...itemStyle(active),
          borderRight: isLast ? 'none' : '1px dashed rgba(26,16,8,0.15)',
        }}
        onClick={() => onSwitch(panelId)}
      >
        {active && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--bordeaux)' }} />
        )}
        <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
        <span style={labelStyles}>{label}</span>
        {badge && (
          <span style={{
            position: 'absolute', top: 4, right: 'calc(50% - 18px)',
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
          <NavItem panelId="catalogue" icon="🏠" label="Accueil" />
          <NavItem panelId="etagere" icon="▥" label="Bibliothèque" />
          <NavItem panelId="wishlist" icon="♡" label="Wishlist" />
          <NavItem panelId="progression-collecte" icon="⚖️" label="Collecte" />
          <NavItem panelId="profil" icon="👤" label={t('nav_profil')} isLast={true} />
        </>
      )}
      {role === 'voyageur' && (
        <>
          <NavItem panelId="accueil-voyageur" icon="🏠" label={t('nav_accueil')} />
          <NavItem panelId="missions" icon="🗺️" label="Mission" />
          <NavItem panelId="scanner" icon="📷" label={t('nav_scanner')} />
          <NavItem panelId="profil" icon="👤" label={t('nav_profil')} isLast={true} />
        </>
      )}
      {role === 'relais' && (
        <>
          <NavItem panelId="scanner" icon="⬡" label={t('nav_scanner')} />
          <NavItem panelId="stock" icon="📦" label={t('nav_stock')} />
          <NavItem panelId="profils" icon="📊" label={t('nav_profils')} />
          <NavItem panelId="progression-collecte" icon="⚖️" label="Collecte" />
          <NavItem panelId="profil" icon="👤" label={t('nav_profil')} isLast={true} />
        </>
      )}
    </nav>
  );
}