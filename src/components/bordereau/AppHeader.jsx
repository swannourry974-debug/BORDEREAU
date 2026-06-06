import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLang } from '@/lib/LangContext';

const ROOT_PANELS = ['/', '/catalogue', '/etagere', '/missions', '/accueil-voyageur', '/stock'];

export default function AppHeader({ role, roleSwitcherOpen, onToggleRoleSwitcher }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLang();
  const roleLabels = {
    lecteur: t('role_lecteur'),
    voyageur: t('role_voyageur'),
    relais: t('role_relais'),
  };
  const showBack = !ROOT_PANELS.includes(location.pathname);

  return (
    <header style={{
      background: 'var(--bordeaux)',
      paddingTop: `calc(18px + env(safe-area-inset-top, 0px))`,
      paddingBottom: 14,
      paddingLeft: 20,
      paddingRight: 20,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 3px 12px rgba(128,0,32,0.4)',
      borderBottom: '2px solid var(--bordeaux-dark)',
    }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, lineHeight: 1 }}>
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--creme)', display: 'flex', alignItems: 'center', userSelect: 'none' }}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
          <div className="font-special" style={{ fontSize: 28, color: 'var(--creme)', letterSpacing: 6, textTransform: 'uppercase', userSelect: 'none' }}>
            BORDEREAU
          </div>
          <span className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'rgba(253,252,240,0.7)', letterSpacing: 2, marginTop: 2, display: 'block', userSelect: 'none' }}>
            {t('header_tagline')}
          </span>
          </div>
        </div>
        <button
          onClick={onToggleRoleSwitcher}
          className="font-special"
          style={{
            background: 'var(--creme)',
            color: 'var(--bordeaux)',
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            padding: '6px 12px',
            border: '1px solid var(--bordeaux-dark)',
            cursor: 'pointer',
            position: 'relative',
            outline: 'none',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span style={{
            position: 'absolute',
            top: -3, right: -3, bottom: -3, left: -3,
            border: '1px dashed rgba(128,0,32,0.4)',
            pointerEvents: 'none',
          }} />
          {roleLabels[role]}
        </button>
      </div>
    </header>
  );
}