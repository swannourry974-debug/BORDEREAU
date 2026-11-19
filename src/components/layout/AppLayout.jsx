import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import RoleSwitcher from './RoleSwitcher';
import BottomNav from './BottomNav';
import { useRole } from '@/lib/RoleContext';

const ROLE_DEFAULT_ROUTES = {
  lecteur: '/catalogue',
  voyageur: '/missions',
  relais: '/stock',
};

const formatDisplayDate = () => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

export default function AppLayout() {
  const { role } = useRole();
  const navigate = useNavigate();

  // Navigate to default route when role changes
  useEffect(() => {
    navigate(ROLE_DEFAULT_ROUTES[role]);
  }, [role]);

  return (
    <div className="min-h-screen bg-background relative z-[1]">
      <AppHeader />
      <RoleSwitcher />

      {/* Date stamp */}
      <div className="text-center py-2 pt-3 font-fell italic text-[11px] text-foreground/40 tracking-[2px]">
        {formatDisplayDate()} · Paris → le Monde
      </div>

      <main className="max-w-[480px] mx-auto px-4 pb-[calc(128px_+_env(safe-area-inset-bottom,0px))] relative z-[1]">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}