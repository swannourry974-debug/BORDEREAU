import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import AdminSidebar from '@/components/admin/dashboard/AdminSidebar';
import AdminContentRouter from '@/components/admin/dashboard/AdminContentRouter';
import { buildAdminStats, searchAdminData } from '@/components/admin/dashboard/adminDashboardData';

const TABS = [
  { id: 'dashboard', label: 'Accueil' },
  { id: 'validation-relais', label: 'Validation relais' },
  { id: 'activite', label: "Activité de l'appli" },
  { id: 'villes', label: 'Achats par villes' },
  { id: 'livraisons', label: 'Livraisons & États' },
  { id: 'litiges', label: 'Tableau litiges' },
  { id: 'collectif', label: 'Commandes collectif' },
  { id: 'relais', label: 'Réseau Points Relais' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ commandes: [], relais: [], missions: [], users: [] });
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedRelay, setSelectedRelay] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    base44.auth.me().then(async u => {
      const isAllowed = u?.role === 'admin' || u?.role === 'admin_secondaire';
      setUser(u);
      setAuthorized(isAllowed);
      if (!isAllowed) {
        setLoading(false);
        return;
      }
      try {
        const [commandes, relais, missions] = await Promise.all([
          base44.entities.Commande.list('-created_date', 500),
          base44.entities.PointRelais.list('-updated_date', 250),
          base44.entities.MissionVoyageur.list('-updated_date', 300),
        ]);
        const users = u?.role === 'admin' ? await base44.entities.User.list('-updated_date', 250) : [];
        setData({ commandes, relais, missions, users });
      } finally {
        setLoading(false);
      }
    }).catch(() => {
      setAuthorized(false);
      setLoading(false);
    });
  }, []);

  const isAgentBordeur = user?.role === 'admin_secondaire';
  const visibleTabs = isAgentBordeur ? TABS.filter(t => t.id !== 'validation-relais') : TABS;
  const stats = useMemo(() => buildAdminStats({ ...data, selectedCountry, selectedRelay }), [data, selectedCountry, selectedRelay]);
  const searchResults = useMemo(() => searchAdminData(query, data), [query, data]);
  const openOfficialLogin = () => base44.auth.logout('/admin');
  const changeCountry = (country) => {
    setSelectedCountry(country);
    setSelectedRelay('all');
  };

  if (authorized === null || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-9 h-9 border-4 border-bordeaux/20 border-t-bordeaux rounded-full animate-spin" /></div>;
  }

  if (!authorized) {
    return <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-bordeaux"><div className="text-5xl">🔒</div><div className="font-ui text-xl tracking-[4px] uppercase">Accès refusé</div><a href="/" className="underline text-bordeaux/70">← Retour à l'application</a></div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <AdminSidebar tabs={visibleTabs} activeTab={activeTab} onTabChange={setActiveTab} isAgentBordeur={isAgentBordeur} onOfficialLogin={openOfficialLogin} />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-hidden">
        <AdminContentRouter
          activeTab={activeTab}
          homeProps={{
            stats,
            filters: { country: selectedCountry, relay: selectedRelay },
            onCountryChange: changeCountry,
            onRelayChange: setSelectedRelay,
            search: { query, setQuery, results: searchResults, users: data.users },
          }}
        />
      </main>
    </div>
  );
}