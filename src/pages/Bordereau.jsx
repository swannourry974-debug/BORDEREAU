import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppHeader from '../components/bordereau/AppHeader';
import RoleSwitcher from '../components/bordereau/RoleSwitcher';
import BottomNav from '../components/bordereau/BottomNav';
import PanelCatalogue from '../components/bordereau/PanelCatalogue';
import PanelEtagere from '../components/bordereau/PanelEtagere';
import PanelMissions from '../components/bordereau/PanelMissions';
import PanelStock from '../components/bordereau/PanelStock';
import PanelAccueilVoyageur from '../components/voyageur/PanelAccueilVoyageur';
import PanelScanner from '../components/relais/PanelScanner';
import PanelProfils from '../components/relais/PanelProfils';
import PanelProfil from './PanelProfil';

function SidebarItem({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '11px 20px',
        background: active ? 'rgba(128,0,32,0.07)' : 'transparent',
        borderLeft: active ? '3px solid var(--bordeaux)' : '3px solid transparent',
        border: 'none',
        borderLeftStyle: 'solid',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s',
        position: 'relative',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span className="font-special" style={{
        fontSize: 11,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: active ? 'var(--bordeaux)' : 'rgba(26,16,8,0.55)',
        fontWeight: active ? 'bold' : 'normal',
      }}>{label}</span>
      {badge && (
        <span style={{
          marginLeft: 'auto',
          background: 'var(--bordeaux)',
          color: 'var(--creme)',
          fontSize: 9,
          width: 16,
          height: 16,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'monospace',
        }}>{badge}</span>
      )}
    </button>
  );
}

export default function Bordereau({ initialPanel }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState('lecteur');
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [commandeOpen, setCommandeOpen] = useState(false);
  const [commandeBook, setCommandeBook] = useState(null);

  const pathToPanel = { '/catalogue': 'catalogue', '/etagere': 'etagere', '/missions': 'missions', '/stock': 'stock', '/accueil-voyageur': 'accueil-voyageur', '/scanner': 'scanner', '/profils': 'profils', '/profil': 'profil' };
  const activePanel = pathToPanel[location.pathname] || initialPanel || 'catalogue';

  const switchRole = (newRole) => {
    setRole(newRole);
    setRoleSwitcherOpen(false);
    setCommandeOpen(false);
    const defaults = { lecteur: '/catalogue', voyageur: '/accueil-voyageur', relais: '/stock' };
    navigate(defaults[newRole]);
  };

  const switchPanel = (panelId) => {
    setCommandeOpen(false);
    navigate('/' + panelId);
  };

  const openCommande = (book) => {
    setCommandeBook(book);
    setCommandeOpen(true);
  };

  const closeCommande = () => {
    setCommandeOpen(false);
    setCommandeBook(null);
  };

  return (
    <div style={{ background: 'var(--creme)', minHeight: '100vh', overflowX: 'hidden' }}>
      <AppHeader
        role={role}
        roleSwitcherOpen={roleSwitcherOpen}
        onToggleRoleSwitcher={() => setRoleSwitcherOpen(o => !o)}
      />

      <RoleSwitcher
        open={roleSwitcherOpen}
        onSwitch={switchRole}
      />

      {/* Layout responsive : sidebar sur tablette/desktop, bottom nav sur mobile */}
      <div className="md:flex md:max-w-5xl md:mx-auto lg:max-w-6xl" style={{ position: 'relative', zIndex: 1 }}>

        {/* Sidebar navigation — tablette & desktop uniquement */}
        <aside className="hidden md:flex md:flex-col md:shrink-0" style={{
          width: 220,
          borderRight: '1.5px solid rgba(26,16,8,0.12)',
          minHeight: 'calc(100vh - 70px)',
          padding: '28px 0',
          position: 'sticky',
          top: 70,
          alignSelf: 'flex-start',
          background: 'var(--creme)',
        }}>
          {/* Date */}
          <div className="font-fell" style={{ textAlign: 'center', padding: '0 16px 20px', fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.4)', letterSpacing: 2, borderBottom: '1px dashed rgba(26,16,8,0.15)' }}>
            3 Mai 2026<br />Paris → le Monde
          </div>

          {/* Nav items */}
          <nav style={{ padding: '16px 0' }}>
            {role === 'lecteur' && (
              <>
                <SidebarItem icon="🔍" label="Catalogue" panelId="catalogue" active={activePanel === 'catalogue'} onClick={() => switchPanel('catalogue')} />
                <SidebarItem icon="📚" label="Étagère" panelId="etagere" active={activePanel === 'etagere'} onClick={() => switchPanel('etagere')} badge="2" />
              </>
            )}
            {role === 'voyageur' && (
              <>
                <SidebarItem icon="🏠" label="Accueil" panelId="accueil-voyageur" active={activePanel === 'accueil-voyageur'} onClick={() => switchPanel('accueil-voyageur')} />
                <SidebarItem icon="🗺️" label="Missions" panelId="missions" active={activePanel === 'missions'} onClick={() => switchPanel('missions')} />
              </>
            )}
            {role === 'relais' && (
              <>
                <SidebarItem icon="⬡" label="Scanner" panelId="scanner" active={activePanel === 'scanner'} onClick={() => switchPanel('scanner')} />
                <SidebarItem icon="📦" label="Stock" panelId="stock" active={activePanel === 'stock'} onClick={() => switchPanel('stock')} />
                <SidebarItem icon="📊" label="Profils" panelId="profils" active={activePanel === 'profils'} onClick={() => switchPanel('profils')} />
              </>
            )}
            <SidebarItem icon="👤" label="Profil" panelId="profil" active={activePanel === 'profil'} onClick={() => switchPanel('profil')} />
          </nav>

          {/* Footer sidebar */}
          <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px dashed rgba(26,16,8,0.15)' }}>
            <div className="font-special" style={{ fontSize: 9, letterSpacing: 2, color: 'rgba(26,16,8,0.3)', textAlign: 'center', textTransform: 'uppercase' }}>
              Bordereau v1.0
            </div>
          </div>
        </aside>

        {/* Contenu principal */}
        <main
          className="md:flex-1 md:min-w-0 md:pb-10"
          style={{ padding: '20px 24px calc(100px + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Date mobile uniquement */}
          <div className="md:hidden font-fell" style={{ textAlign: 'center', padding: '8px 0 4px', fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.4)', letterSpacing: 2 }}>
            3 Mai 2026 · Paris → le Monde
          </div>

          {/* Wrapper qui centre le contenu sur grands écrans */}
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            {activePanel === 'catalogue' && (
              <PanelCatalogue
                commandeOpen={commandeOpen}
                commandeBook={commandeBook}
                onOpenCommande={openCommande}
                onCloseCommande={closeCommande}
              />
            )}
            {activePanel === 'etagere' && <PanelEtagere />}
            {activePanel === 'accueil-voyageur' && <PanelAccueilVoyageur />}
            {activePanel === 'missions' && <PanelMissions />}
            {activePanel === 'stock' && <PanelStock />}
            {activePanel === 'scanner' && <PanelScanner />}
            {activePanel === 'profils' && <PanelProfils />}
            {activePanel === 'profil' && <PanelProfil />}
          </div>
        </main>
      </div>

      {/* Bottom nav — mobile uniquement */}
      <div className="md:hidden">
        <BottomNav
          role={role}
          activePanel={activePanel}
          onSwitch={switchPanel}
        />
      </div>
    </div>
  );
}