import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import LoadingScreen from '@/components/shared/LoadingScreen';
import WaitScreen from '@/components/shared/WaitScreen';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CartProvider } from '@/lib/CartContext';
import { LangProvider } from '@/lib/LangContext';
// Add page imports here
import Bordero from './pages/Bordero.jsx';
import LandingLecteur from './pages/LandingLecteur';
import LandingVoyageur from './pages/LandingVoyageur';
import LandingRelais from './pages/LandingRelais';
import LandingPresentation from './pages/LandingPresentation';
import PanelProfil from './pages/PanelProfil';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';

const RouteSpinner = () => <WaitScreen label="On ouvre le carnet…" />;

// Écran affiché aux visiteurs non connectés sur un espace privé.
// Avant, l'application entière s'affichait sans compte (données bloquées côté serveur, mais parcours faux).
const LoginGate = () => {
  const location = useLocation();
  const currentPath = `${location.pathname}${location.search}`;

  const goToLogin = () => base44.auth.redirectToLogin(currentPath);
  const goToHome = () => {
    window.location.href = "/";
  };

  return (
    <main className="bordero-shell min-h-screen px-5 py-10 text-encre sm:px-8">
      <div className="mx-auto max-w-xl bordero-card-premium p-7 sm:p-10 text-center">
        <p className="bordero-heading-section">Espace réservé</p>
        <h1 className="mt-4 font-heading text-4xl text-bordeaux sm:text-5xl">Connectez-vous pour continuer.</h1>
        <p className="mt-4 font-body text-xl leading-8 text-encre/70">
          Le catalogue, votre étagère, vos missions et votre profil demandent un compte Bordero.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={goToLogin} className="bordero-action-primary px-6 py-3 text-xs">
            Se connecter
          </button>
          <button type="button" onClick={goToHome} className="bordero-action-secondary px-6 py-3 text-xs">
            Retour à l’accueil
          </button>
        </div>
      </div>
    </main>
  );
};

const RequireAuth = ({ children }) => {
  const { user, isLoadingAuth, isLoadingPublicSettings } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) return <RouteSpinner />;
  if (!user) return <LoginGate />;
  return children;
};

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const publicRoutes = ['/', '/login', '/Login', '/landing-lecteur', '/LandingLecteur', '/lecteur', '/Lecteur', '/landing-voyageur', '/LandingVoyageur', '/voyageur', '/Voyageur', '/landing-relais', '/LandingRelais', '/LandingRelais/', '/relais', '/Relais'];
  const isPublicRoute = publicRoutes.includes(location.pathname);
  const activeProfileChoice = user?.email ? localStorage.getItem(`bordero_active_profile_${user.email}`) : null;
  const shouldRespectManualProfile = ['lecteur', 'voyageur'].includes(activeProfileChoice);
  const shouldOpenRelayStock = !shouldRespectManualProfile && user?.role === 'relais' && user?.relais_valide === true && location.pathname !== '/stock' && (location.pathname === '/' || location.pathname === '/catalogue' || isPublicRoute);

  useEffect(() => {
    if (!isLoadingPublicSettings && !isLoadingAuth && shouldOpenRelayStock) {
      navigate('/stock', { replace: true });
    }
  }, [isLoadingPublicSettings, isLoadingAuth, shouldOpenRelayStock, navigate]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <RouteSpinner />;
  }

  if (shouldOpenRelayStock) return null;

  // Handle authentication errors
  if (authError && !isPublicRoute) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return <LandingPresentation />;
    }
  }

  // Render the main app
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <Routes location={location}>
          <Route path="/" element={user ? <Bordero /> : <LandingPresentation />} />
          {/* Espaces privés : un visiteur non connecté voit l'écran de connexion. */}
          <Route path="/catalogue" element={<RequireAuth><Bordero initialPanel="catalogue" /></RequireAuth>} />
          <Route path="/etagere" element={<RequireAuth><Bordero initialPanel="etagere" /></RequireAuth>} />
          <Route path="/bibliotheque" element={<RequireAuth><Bordero initialPanel="etagere" /></RequireAuth>} />
          <Route path="/wishlist" element={<RequireAuth><Bordero initialPanel="wishlist" /></RequireAuth>} />
          <Route path="/favoris" element={<RequireAuth><Bordero initialPanel="favoris" /></RequireAuth>} />
          <Route path="/progression-collecte" element={<RequireAuth><Bordero initialPanel="progression-collecte" /></RequireAuth>} />
          <Route path="/missions" element={<RequireAuth><Bordero initialPanel="missions" /></RequireAuth>} />
          <Route path="/accueil-voyageur" element={<RequireAuth><Bordero initialPanel="accueil-voyageur" /></RequireAuth>} />
          <Route path="/stock" element={<RequireAuth><Bordero initialPanel="stock" /></RequireAuth>} />
          <Route path="/Stock" element={<RequireAuth><Bordero initialPanel="stock" /></RequireAuth>} />
          <Route path="/scanner" element={<RequireAuth><Bordero initialPanel="scanner" /></RequireAuth>} />
          <Route path="/profils" element={<RequireAuth><Bordero initialPanel="profils" /></RequireAuth>} />
          <Route path="/profil" element={<RequireAuth><Bordero initialPanel="profil" /></RequireAuth>} />
          <Route path="/wallet" element={<RequireAuth><Bordero initialPanel="wallet" /></RequireAuth>} />
          <Route path="/aide" element={<RequireAuth><Bordero initialPanel="aide" /></RequireAuth>} />
          {/* Add your page Route elements here */}
          <Route path="/landing-lecteur" element={<LandingLecteur />} />
          <Route path="/LandingLecteur" element={<LandingLecteur />} />
          <Route path="/lecteur" element={<LandingLecteur />} />
          <Route path="/Lecteur" element={<LandingLecteur />} />
          <Route path="/landing-voyageur" element={<LandingVoyageur />} />
          <Route path="/LandingVoyageur" element={<LandingVoyageur />} />
          <Route path="/voyageur" element={<LandingVoyageur />} />
          <Route path="/Voyageur" element={<LandingVoyageur />} />
          <Route path="/landing-relais" element={<LandingRelais />} />
          <Route path="/LandingRelais" element={<LandingRelais />} />
          <Route path="/LandingRelais/" element={<LandingRelais />} />
          <Route path="/relais" element={<LandingRelais />} />
          <Route path="/Relais" element={<LandingRelais />} />
          <Route path="/panel-profil" element={<RequireAuth><PanelProfil /></RequireAuth>} />
          <Route path="/PanelProfil" element={<RequireAuth><PanelProfil /></RequireAuth>} />
          <Route path="/PanelProfil/" element={<RequireAuth><PanelProfil /></RequireAuth>} />
          <Route path="/panelprofil" element={<RequireAuth><PanelProfil /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
          <Route path="/Admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};


const IDLE_TIMEOUT = 720000; // 12 minutes — suffisant pour lire et commander sans être déconnecté

function App() {
  const [loadingDone, setLoadingDone] = useState(false);
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    if (!loadingDone) return;

    let timer = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT);

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, reset));

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [loadingDone]);

  const handleWake = () => setIsIdle(false);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <CartProvider>
          <LangProvider>
          {!loadingDone && <LoadingScreen mode="loading" onComplete={() => setLoadingDone(true)} />}
          {loadingDone && isIdle && <LoadingScreen mode="idle" onWake={handleWake} />}
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
          </LangProvider>
        </CartProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App