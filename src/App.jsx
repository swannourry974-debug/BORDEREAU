import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import LoadingScreen from '@/components/shared/LoadingScreen';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CartProvider } from '@/lib/CartContext';
import { LangProvider } from '@/lib/LangContext';
// Add page imports here
import Bordero from './pages/Bordero.jsx';
import LandingLecteur from './pages/LandingLecteur';
import LandingVoyageur from './pages/LandingVoyageur';
import LandingRelais from './pages/LandingRelais';
import PanelProfil from './pages/PanelProfil';
import AdminDashboard from './pages/AdminDashboard';

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const publicRoutes = ['/landing-lecteur', '/landing-voyageur', '/landing-relais', '/LandingRelais', '/LandingRelais/', '/relais'];
  const isPublicRoute = publicRoutes.includes(location.pathname);
  const shouldOpenAdminConsole = user?.role === 'admin' && location.pathname !== '/admin' && (location.pathname === '/' || isPublicRoute);

  useEffect(() => {
    if (!isLoadingPublicSettings && !isLoadingAuth && shouldOpenAdminConsole) {
      navigate('/admin', { replace: true });
    }
  }, [isLoadingPublicSettings, isLoadingAuth, shouldOpenAdminConsole, navigate]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (shouldOpenAdminConsole) return null;

  // Handle authentication errors
  if (authError && !isPublicRoute) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
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
          <Route path="/" element={<Bordero />} />
          <Route path="/catalogue" element={<Bordero initialPanel="catalogue" />} />
          <Route path="/etagere" element={<Bordero initialPanel="etagere" />} />
          <Route path="/bibliotheque" element={<Bordero initialPanel="etagere" />} />
          <Route path="/wishlist" element={<Bordero initialPanel="wishlist" />} />
          <Route path="/favoris" element={<Bordero initialPanel="favoris" />} />
          <Route path="/missions" element={<Bordero initialPanel="missions" />} />
          <Route path="/accueil-voyageur" element={<Bordero initialPanel="accueil-voyageur" />} />
          <Route path="/stock" element={<Bordero initialPanel="stock" />} />
          <Route path="/Stock" element={<Bordero initialPanel="stock" />} />
          <Route path="/scanner" element={<Bordero initialPanel="scanner" />} />
          <Route path="/profils" element={<Bordero initialPanel="profils" />} />
          <Route path="/profil" element={<Bordero initialPanel="profil" />} />
          <Route path="/wallet" element={<Bordero initialPanel="wallet" />} />
          <Route path="/aide" element={<Bordero initialPanel="aide" />} />
          {/* Add your page Route elements here */}
          <Route path="/landing-lecteur" element={<LandingLecteur />} />
          <Route path="/landing-voyageur" element={<LandingVoyageur />} />
          <Route path="/landing-relais" element={<LandingRelais />} />
          <Route path="/LandingRelais" element={<LandingRelais />} />
          <Route path="/LandingRelais/" element={<LandingRelais />} />
          <Route path="/relais" element={<LandingRelais />} />
          <Route path="/panel-profil" element={<PanelProfil />} />
          <Route path="/PanelProfil" element={<PanelProfil />} />
          <Route path="/PanelProfil/" element={<PanelProfil />} />
          <Route path="/panelprofil" element={<PanelProfil />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};


const IDLE_TIMEOUT = 120000; // 2 minutes

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