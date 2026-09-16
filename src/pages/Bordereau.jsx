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
import PanelScannerVoyageur from '../components/voyageur/PanelScannerVoyageur';
import PanelScanner from '../components/relais/PanelScannerReal';
import PanelProfils from '../components/relais/PanelProfils';
import RelaisAccessNotice from '../components/relais/RelaisAccessNotice';
import PanelProfil from './PanelProfil';
import PanelWalletLecteur from '../components/wallet/PanelWalletLecteur';
import PanelWalletAdmin from '../components/wallet/PanelWalletAdmin';
import PanelAide from '../components/aide/PanelAide';
import PanelProgressionCollecte from '@/components/collecte/PanelProgressionCollecte';
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
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success' | 'cancel' | null

  // Détecter le retour Stripe via query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payment = params.get('payment');
    if (payment === 'success' || payment === 'cancel') {
      setPaymentStatus(payment);
      // Nettoyer l'URL sans recharger la page
      const clean = new URL(window.location.href);
      clean.searchParams.delete('payment');
      clean.searchParams.delete('session_id');
      window.history.replaceState({}, '', clean.toString());
    }
  }, []);

  useEffect(() => {
    base44.auth.me().then(async user => {
      if (!user) return;
      let activeUser = user;
      const relais = (await base44.entities.PointRelais.filter({ gerant_email: user.email }, '-updated_date', 1))[0];
      if (relais?.validation_admin === 'valide') {
        const updates = {
          role: 'relais',
          relais_valide: true,
          relais_validation_status: 'valide',
          point_relais_id: relais.id,
        };
        activeUser = user.role === 'relais' && user.relais_valide === true ? user : { ...user, ...updates };
        if (activeUser !== user) {
          base44.auth.updateMe(updates).then(updated => setCurrentUser(updated || activeUser)).catch(() => setCurrentUser(activeUser));
        }
        setRole('relais');
        if (!['/stock', '/scanner', '/profils', '/profil', '/aide', '/progression-collecte'].includes(location.pathname)) navigate('/stock', { replace: true });
      } else {
        const requestedRole = new URLSearchParams(location.search).get('role');
        if (requestedRole === 'voyageur') {
          const updates = { role: 'voyageur', role_prompt_seen: true };
          activeUser = { ...activeUser, ...updates };
          setRole('voyageur');
          localStorage.setItem(`bordero_role_prompt_seen_${activeUser.email}`, 'true');
          base44.auth.updateMe(updates).then(updated => setCurrentUser(updated || activeUser)).catch(() => setCurrentUser(activeUser));
          navigate('/accueil-voyageur', { replace: true });
        } else if (['lecteur', 'voyageur', 'relais'].includes(user.role)) {
          setRole(user.role);
        }
      }
      const promptSeenKey = activeUser?.email ? `bordero_role_prompt_seen_${activeUser.email}` : '';
      setCurrentUser(activeUser);
      if (!activeUser.role_prompt_seen && !['relais', 'voyageur'].includes(activeUser.role) && localStorage.getItem(promptSeenKey) !== 'true') {
        setRolePromptOpen(true);
      }
    }).catch(() => {});
  }, []);

  const pathToPanel = { '/catalogue': 'catalogue', '/etagere': 'etagere', '/bibliotheque': 'etagere', '/wishlist': 'wishlist', '/favoris': 'favoris', '/progression-collecte': 'progression-collecte', '/missions': 'missions', '/stock': 'stock', '/Stock': 'stock', '/accueil-voyageur': 'accueil-voyageur', '/scanner': 'scanner', '/profils': 'profils', '/profil': 'profil', '/PanelProfil': 'profil', '/panel-profil': 'profil', '/wallet': 'wallet', '/aide': 'aide' };
  const activePanel = pathToPanel[location.pathname] || initialPanel || 'catalogue';
  const isRelaisValidated = currentUser?.role === 'admin' || (currentUser?.role === 'relais' && currentUser?.relais_valide === true);
  const isRelaisPanel = role === 'relais' && ['stock', 'scanner', 'profils'].includes(activePanel);

  const markRolePromptSeen = () => {
    if (currentUser) {
      localStorage.setItem(`bordero_role_prompt_seen_${currentUser.email}`, 'true');
      base44.auth.updateMe({ role_prompt_seen: true }).then(updatedUser => {
        setCurrentUser(updatedUser || { ...currentUser, role_prompt_seen: true });
      }).catch(() => {});
    }
    setRolePromptOpen(false);
  };

  const switchRole = (newRole, profileData = {}) => {
    setRole(newRole);
    setRoleSwitcherOpen(false);
    setRolePromptOpen(false);
    setCommandeOpen(false);
    if (currentUser) {
      localStorage.setItem(`bordero_role_prompt_seen_${currentUser.email}`, 'true');
      const updates = newRole === 'relais'
        ? {
            role: newRole,
            role_prompt_seen: true,
            relais_valide: currentUser.relais_valide === true,
            relais_validation_status: currentUser.relais_valide === true ? 'valide' : (currentUser.relais_validation_status || 'aucune'),
            ...profileData,
          }
        : { role: newRole, role_prompt_seen: true, ...profileData };
      base44.auth.updateMe(updates).then(updatedUser => {
        setCurrentUser(updatedUser || { ...currentUser, ...updates });
      }).catch(() => {});
    }
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
      {/* Bandeau de confirmation paiement */}
      {paymentStatus === 'success' && (
        <div
          onClick={() => setPaymentStatus(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(26,16,8,0.55)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div style={{
            background: 'var(--creme)', border: '2px solid var(--bordeaux)',
            padding: '32px 28px', maxWidth: 400, width: '100%',
            boxShadow: '6px 6px 0 rgba(128,0,32,0.3)',
            textAlign: 'center', position: 'relative',
            animation: 'fadeSlideIn 0.3s ease',
          }} onClick={e => e.stopPropagation()}>
            {/* Tampon */}
            <div style={{
              position: 'absolute', top: 16, right: 16,
              border: '2px solid #2d6a2d', color: '#2d6a2d',
              fontFamily: 'Special Elite, monospace', fontSize: 9,
              letterSpacing: 2, textTransform: 'uppercase', padding: '3px 8px',
              transform: 'rotate(-8deg)', opacity: 0.8,
            }}>CONFIRMÉ</div>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <div className="font-playfair" style={{ fontSize: 22, fontWeight: 700, color: 'var(--bordeaux)', marginBottom: 8 }}>
              Commande confirmée !
            </div>
            <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 14, color: 'rgba(26,16,8,0.65)', lineHeight: 1.7, marginBottom: 20 }}>
              Votre paiement est sécurisé en séquestre.
              Un voyageur va prendre en charge votre mission — vous recevrez une notification dès l’achat confirmé.
            </div>
            {/* Étapes */}
            <div style={{ textAlign: 'left', borderTop: '1px dashed rgba(26,16,8,0.2)', paddingTop: 16, marginBottom: 20 }}>
              {[
                { icon: '✅', label: 'Paiement sécurisé', done: true },
                { icon: '⏳', label: 'Voyageur en recherche du livre', done: false },
                { icon: '✈️', label: 'Transport vers votre relais', done: false },
                { icon: '📦', label: 'Retrait chez le partenaire', done: false },
              ].map((step, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0',
                  borderBottom: i < 3 ? '1px dashed rgba(26,16,8,0.1)' : 'none',
                }}>
                  <span style={{ fontSize: 16, width: 24, flexShrink: 0 }}>{step.icon}</span>
                  <span className="font-special" style={{
                    fontSize: 10, letterSpacing: 1, textTransform: 'uppercase',
                    color: step.done ? '#2d6a2d' : 'rgba(26,16,8,0.45)',
                  }}>{step.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setPaymentStatus(null); navigate('/etagere'); }}
                style={{
                  flex: 1, background: 'var(--bordeaux)', color: 'var(--creme)',
                  border: 'none', padding: '10px 16px',
                  fontFamily: 'Special Elite, monospace', fontSize: 11,
                  letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
                  outline: '2px dashed var(--bordeaux)', outlineOffset: 3,
                }}
              >
                Voir mon étagère
              </button>
              <button
                onClick={() => setPaymentStatus(null)}
                style={{
                  background: 'transparent', color: 'var(--bordeaux)',
                  border: '1.5px dashed var(--bordeaux)', padding: '10px 14px',
                  fontFamily: 'Special Elite, monospace', fontSize: 11,
                  letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer',
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      {paymentStatus === 'cancel' && (
        <div style={{
          background: 'rgba(139,105,20,0.1)', borderBottom: '2px solid #8B6914',
          padding: '10px 16px', textAlign: 'center',
          fontFamily: 'IM Fell English, serif', fontStyle: 'italic',
          fontSize: 13, color: '#8B6914', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <span>⚠️ Paiement annulé — votre commande n’a pas été enregistrée.</span>
          <button onClick={() => setPaymentStatus(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B6914', fontSize: 18 }}>×</button>
        </div>
      )}
      <AppHeader
        role={role}
        roleSwitcherOpen={roleSwitcherOpen}
        onToggleRoleSwitcher={() => setRoleSwitcherOpen(o => !o)}
      />

      <RoleSwitcher
        open={roleSwitcherOpen}
        currentRole={currentUser?.role || role}
        onSwitch={switchRole}
      />

      <RoleOnboardingPrompt
        open={rolePromptOpen}
        currentRole={role}
        currentUser={currentUser}
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
                <SidebarItem icon="🏠" label="Accueil" panelId="catalogue" active={activePanel === 'catalogue'} onClick={() => switchPanel('catalogue')} />
                <SidebarItem icon="▥" label="Bibliothèque" panelId="etagere" active={activePanel === 'etagere'} onClick={() => switchPanel('etagere')} />
                <SidebarItem icon="♡" label="Wishlist" panelId="wishlist" active={activePanel === 'wishlist'} onClick={() => switchPanel('wishlist')} />
                <SidebarItem icon="★" label="Favoris" panelId="favoris" active={activePanel === 'favoris'} onClick={() => switchPanel('favoris')} />
                <SidebarItem icon="⚖️" label="Collecte" panelId="progression-collecte" active={activePanel === 'progression-collecte'} onClick={() => switchPanel('progression-collecte')} />
              </>
            )}
            {role === 'voyageur' && (
              <>
                <SidebarItem icon="🏠" label="Accueil" panelId="accueil-voyageur" active={activePanel === 'accueil-voyageur'} onClick={() => switchPanel('accueil-voyageur')} />
                <SidebarItem icon="🗺️" label="Mission" panelId="missions" active={activePanel === 'missions'} onClick={() => switchPanel('missions')} />
                <SidebarItem icon="📷" label="Scanner" panelId="scanner" active={activePanel === 'scanner'} onClick={() => switchPanel('scanner')} />
              </>
            )}
            {role === 'relais' && (
              <>
                <SidebarItem icon="⬡" label="Scanner" panelId="scanner" active={activePanel === 'scanner'} onClick={() => switchPanel('scanner')} />
                <SidebarItem icon="📦" label="Stock" panelId="stock" active={activePanel === 'stock'} onClick={() => switchPanel('stock')} />
                <SidebarItem icon="📊" label="Profils" panelId="profils" active={activePanel === 'profils'} onClick={() => switchPanel('profils')} />
                <SidebarItem icon="⚖️" label="Collecte" panelId="progression-collecte" active={activePanel === 'progression-collecte'} onClick={() => switchPanel('progression-collecte')} />
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
            {['etagere', 'wishlist', 'favoris'].includes(activePanel) && <PanelEtagere initialTab={activePanel === 'wishlist' ? 'wishlist' : activePanel === 'favoris' ? 'favoris' : 'bibliotheque'} />}
            {activePanel === 'accueil-voyageur' && <PanelAccueilVoyageur />}
            {activePanel === 'missions' && <PanelMissions />}
            {activePanel === 'scanner' && role === 'voyageur' && <PanelScannerVoyageur />}
            {isRelaisPanel && !isRelaisValidated && <RelaisAccessNotice status={currentUser?.relais_validation_status} onBack={() => switchPanel('profil')} />}
            {activePanel === 'stock' && isRelaisValidated && <PanelStock />}
            {activePanel === 'scanner' && role === 'relais' && isRelaisValidated && <PanelScanner />}
            {activePanel === 'profils' && isRelaisValidated && <PanelProfils />}
            {activePanel === 'profil' && <PanelProfil />}
            {activePanel === 'progression-collecte' && role !== 'voyageur' && <PanelProgressionCollecte role={role} currentUser={currentUser} />}
            {activePanel === 'progression-collecte' && role === 'voyageur' && (
              <div style={{ background: 'var(--papier)', border: '1px dashed var(--bordeaux)', padding: 24, textAlign: 'center', color: 'var(--bordeaux)' }}>
                La Collecte est gérée uniquement par Bordero. Votre espace voyageur reste dédié aux missions Express limitées à 10 livres.
              </div>
            )}
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