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
    <header
      className="px-4 sm:px-6"
      style={{
        background: 'var(--creme)',
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        paddingBottom: 10,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid var(--bordero-line)',
      }}
    >
      <div className="mx-auto flex max-w-[1024px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {showBack && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Retour"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--encre)', display: 'flex', alignItems: 'center' }}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="min-w-0">
            <div
              onDoubleClick={openOfficialLogin}
              className="font-playfair"
              style={{
                color: 'var(--bordeaux)',
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: 'clamp(3px, 1.2vw, 5px)',
                textTransform: 'uppercase',
                lineHeight: 1,
                cursor: 'default',
              }}
            >
              BORDERO
            </div>
            <span
              className="font-ui hidden truncate sm:block"
              style={{ fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', color: 'var(--encre-douce)', marginTop: 3, maxWidth: 240 }}
            >
              {t('header_tagline')}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleRoleSwitcher}
          className="font-ui shrink-0"
          style={{
            background: 'var(--bordero-surface-strong)',
            color: 'var(--bordeaux)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            padding: '8px 12px',
            borderRadius: 999,
            border: '1px solid var(--bordero-line-strong)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {roleLabels[role]}
        </button>
      </div>
    </header>
  );
}
