import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, useLocation } from 'react-router-dom';
import AppHeader from '../components/bordereau/AppHeader';
import RoleSwitcher from '../components/bordereau/RoleSwitcher';
import RoleOnboardingPrompt from '../components/bordereau/RoleOnboardingPrompt';
import BottomNav from '../components/bordereau/BottomNav';
import PanelCatalogue from '../components/bordereau/PanelCatalogue';
import PanelEtagere from '../components/bordereau/PanelEtagere.jsx';
import PanelMissions from '../components/bordereau/PanelMissions';
import PanelStock from '../components/bordereau/PanelStockReal';
import PanelAccueilVoyageur from '../components/voyageur/PanelAccueilVoyageur';
import PanelScanner from '../components/relais/PanelScannerReal';
import PanelProfils from '../components/relais/PanelProfils';
import RelaisAccessNotice from '../components/relais/RelaisAccessNotice';
import PanelProfil from './PanelProfil';
import PanelWalletLecteur from '../components/wallet/PanelWalletLecteur';
import PanelWalletAdmin from '../components/wallet/PanelWalletAdmin';
import PanelAide from '../components/aide/PanelAide';
import AppFooter from '../components/bordereau/AppFooter';

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

export default function Bordero({ initialPanel }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState('lecteur');
  const [currentUser, setCurrentUser] = useState(null);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [rolePromptOpen, setRolePromptOpen] = useState(false);
  const [commandeOpen, setCommandeOpen] = useState(false);
  const [commandeBook, setCommandeBook] = useState(null);

  useEffect(() => {
    base44.auth.me().then(user => {
      setCurrentUser(user);
      if (['lecteur', 'voyageur', 'relais'].includes(user?.role)) {
        setRole(user.role);
      }
      const promptKey = `bordero_role_prompt_seen_${user?.email || 'guest'}`;
      if (user && !localStorage.getItem(promptKey)) {
        setRolePromptOpen(true);
      }
    }).catch(() => {});
  }, []);

  const pathToPanel = { '/catalogue': 'catalogue', '/etagere': 'etagere', '/missions': 'missions', '/stock': 'stock', '/Stock': 'stock', '/accueil-voyageur': 'accueil-voyageur', '/scanner': 'scanner', '/profils': 'profils', '/profil': 'profil', '/PanelProfil': 'profil', '/panel-profil': 'profil', '/wallet': 'wallet', '/aide': 'aide' };
  const activePanel = pathToPanel[location.pathname] || initialPanel || 'catalogue';
  const isRelaisValidated = currentUser?.role === 'admin' || (currentUser?.relais_valide === true && currentUser?.relais_validation_status === 'valide');

  const markRolePromptSeen = () => {
    const promptKey = `bordero_role_prompt_seen_${currentUser?.email || 'guest'}`;
    localStorage.setItem(promptKey, 'true');
    setRolePromptOpen(false);
  };

  const switchRole = (newRole) => {
    setRole(newRole);
    setRoleSwitcherOpen(false);
    setRolePromptOpen(false);
    setCommandeOpen(false);
    if (currentUser) {
      const updates = newRole === 'relais'
        ? {
            role: newRole,
            relais_valide: currentUser.relais_valide === true,
            relais_validation_status: currentUser.relais_valide === true ? 'valide' : (currentUser.relais_validation_status || 'aucune'),
          }
        : { role: newRole };
      base44.auth.updateMe(updates).then(updatedUser => {
        setCurrentUser(updatedUser || { ...currentUser, ...updates });
      }).catch(() => {});
      const promptKey = `bordero_role_prompt_seen_${currentUser.email || 'guest'}`;
      localStorage.setItem(promptKey, 'true');
    }
    const defaults = { lecteur: '/catalogue', voyageur: '/accueil-voyageur', relais: isRelaisValidated ? '/stock' : '/profil' };
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

      <RoleOnboardingPrompt
        open={rolePromptOpen}
        currentRole={role}
        onSelect={switchRole}
        onClose={markRolePromptSeen}
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
                <SidebarItem icon="📚" label="Étagère" panelId="etagere" active={activePanel === 'etagere'} onClick={() => switchPanel('etagere')} />
                <SidebarItem icon="💳" label="Wallet" panelId="wallet" active={activePanel === 'wallet'} onClick={() => switchPanel('wallet')} />
                <SidebarItem icon="❓" label="Aide" panelId="aide" active={activePanel === 'aide'} onClick={() => switchPanel('aide')} />
              </>
            )}
            {role === 'voyageur' && (
              <>
                <SidebarItem icon="🏠" label="Accueil" panelId="accueil-voyageur" active={activePanel === 'accueil-voyageur'} onClick={() => switchPanel('accueil-voyageur')} />
                <SidebarItem icon="🗺️" label="Missions" panelId="missions" active={activePanel === 'missions'} onClick={() => switchPanel('missions')} />
                <SidebarItem icon="💳" label="Wallet" panelId="wallet" active={activePanel === 'wallet'} onClick={() => switchPanel('wallet')} />
                <SidebarItem icon="❓" label="Aide" panelId="aide" active={activePanel === 'aide'} onClick={() => switchPanel('aide')} />
              </>
            )}
            {role === 'relais' && isRelaisValidated && (
              <>
                <SidebarItem icon="⬡" label="Scanner" panelId="scanner" active={activePanel === 'scanner'} onClick={() => switchPanel('scanner')} />
                <SidebarItem icon="📦" label="Stock" panelId="stock" active={activePanel === 'stock'} onClick={() => switchPanel('stock')} />
                <SidebarItem icon="📊" label="Profils" panelId="profils" active={activePanel === 'profils'} onClick={() => switchPanel('profils')} />
                <SidebarItem icon="❓" label="Aide" panelId="aide" active={activePanel === 'aide'} onClick={() => switchPanel('aide')} />
              </>
            )}
            <SidebarItem icon="👤" label="Profil" panelId="profil" active={activePanel === 'profil'} onClick={() => switchPanel('profil')} />
          </nav>

          {/* Footer sidebar */}
          <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px dashed rgba(26,16,8,0.15)' }}>
            <div className="font-special" style={{ fontSize: 9, letterSpacing: 2, color: 'rgba(26,16,8,0.3)', textAlign: 'center', textTransform: 'uppercase' }}>
              BORDERO v1.0
            </div>
          </div>
        </aside>

        {/* Contenu principal */}
        <main
          className="w-full min-w-0 px-3 pt-4 pb-[calc(92px_+_env(safe-area-inset-bottom,0px))] sm:px-5 md:flex-1 md:min-w-0 md:px-6 md:pt-5 md:pb-10"
        >
          {/* Date mobile uniquement */}
          <div className="md:hidden font-fell" style={{ textAlign: 'center', padding: '8px 0 4px', fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.4)', letterSpacing: 2 }}>
            3 Mai 2026 · Paris → le Monde
          </div>

          {/* Wrapper qui centre le contenu sur grands écrans */}
          <div className="w-full max-w-[640px] mx-auto overflow-visible">
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
            {['stock', 'scanner', 'profils'].includes(activePanel) && !isRelaisValidated && (
              <RelaisAccessNotice status={currentUser?.relais_validation_status} onBack={() => navigate('/profil')} />
            )}
            {activePanel === 'stock' && isRelaisValidated && <PanelStock />}
            {activePanel === 'scanner' && isRelaisValidated && <PanelScanner />}
            {activePanel === 'profils' && isRelaisValidated && <PanelProfils />}
            {activePanel === 'profil' && <PanelProfil />}
            {activePanel === 'wallet' && (role === 'lecteur' ? <PanelWalletLecteur /> : role === 'voyageur' ? <PanelAccueilVoyageur /> : <PanelWalletAdmin />)}
            {activePanel === 'aide' && <PanelAide role={role} />}
          </div>
        </main>
      </div>

      {/* Footer — desktop/tablette uniquement */}
      <div className="hidden md:block">
        <AppFooter />
      </div>

      {/* Bottom nav — mobile uniquement */}
      <div className="md:hidden">
        <BottomNav
          role={role}
          relaisValidated={isRelaisValidated}
          activePanel={activePanel}
          onSwitch={switchPanel}
        />
      </div>
    </div>
  );
}