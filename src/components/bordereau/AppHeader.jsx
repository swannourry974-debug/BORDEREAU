import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LangContext';

const ROOT_PANELS = ['/', '/catalogue', '/etagere', '/progression-collecte', '/missions', '/accueil-voyageur', '/stock'];

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
  const openOfficialLogin = () => base44.auth.logout(window.location.pathname);

  return (
    <header className="px-3 sm:px-5" style={{
      background: 'var(--bordeaux)',
      paddingTop: `calc(12px + env(safe-area-inset-top, 0px))`,
      paddingBottom: 10,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 3px 12px rgba(128,0,32,0.4)',
      borderBottom: '2px solid var(--bordeaux-dark)',
    }}>
      <div className="max-w-[1024px] mx-auto flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2 sm:gap-3" style={{ lineHeight: 1 }}>
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--creme)', display: 'flex', alignItems: 'center', userSelect: 'none' }}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="min-w-0">
          <div
            onDoubleClick={openOfficialLogin}
            className="font-special text-[20px] sm:text-[28px]"
            style={{ color: 'var(--creme)', letterSpacing: 'clamp(3px, 1.4vw, 6px)', textTransform: 'uppercase', userSelect: 'none', cursor: 'default' }}
          >
            BORDERO
          </div>
          <span className="font-fell hidden sm:block truncate" style={{ fontStyle: 'italic', fontSize: 11, color: 'rgba(253,252,240,0.7)', letterSpacing: 1.5, marginTop: 2, userSelect: 'none', maxWidth: 180 }}>
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
            fontSize: 10,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            padding: '8px 9px',
            border: '1px solid var(--bordeaux-dark)',
            flexShrink: 0,
            whiteSpace: 'nowrap',
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