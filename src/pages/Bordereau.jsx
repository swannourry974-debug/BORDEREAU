import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppHeader from '../components/bordereau/AppHeader';
import RoleSwitcher from '../components/bordereau/RoleSwitcher';
import BottomNav from '../components/bordereau/BottomNav';
import PanelCatalogue from '../components/bordereau/PanelCatalogue';
import PanelEtagere from '../components/bordereau/PanelEtagere';
import PanelMissions from '../components/bordereau/PanelMissions';
import PanelStock from '../components/bordereau/PanelStock';

export default function Bordereau({ initialPanel }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState('lecteur');
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [commandeOpen, setCommandeOpen] = useState(false);
  const [commandeBook, setCommandeBook] = useState(null);

  const pathToPanel = { '/catalogue': 'catalogue', '/etagere': 'etagere', '/missions': 'missions', '/stock': 'stock' };
  const activePanel = pathToPanel[location.pathname] || initialPanel || 'catalogue';

  const switchRole = (newRole) => {
    setRole(newRole);
    setRoleSwitcherOpen(false);
    setCommandeOpen(false);
    const defaults = { lecteur: '/catalogue', voyageur: '/missions', relais: '/stock' };
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

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px calc(100px + env(safe-area-inset-bottom, 0px))', position: 'relative', zIndex: 1 }}>
        <div className="font-fell" style={{ textAlign: 'center', padding: '8px 0 4px', fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.4)', letterSpacing: 2 }}>
          22 Avril 2026 · Paris → le Monde
        </div>

        {activePanel === 'catalogue' && (
          <PanelCatalogue
            commandeOpen={commandeOpen}
            commandeBook={commandeBook}
            onOpenCommande={openCommande}
            onCloseCommande={closeCommande}
          />
        )}
        {activePanel === 'etagere' && <PanelEtagere />}
        {activePanel === 'missions' && <PanelMissions />}
        {activePanel === 'stock' && <PanelStock />}
      </main>

      <BottomNav
        role={role}
        activePanel={activePanel}
        onSwitch={switchPanel}
      />
    </div>
  );
}