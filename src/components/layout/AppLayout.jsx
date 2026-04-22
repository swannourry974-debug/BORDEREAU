import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import RoleSwitcher from './RoleSwitcher';
import BottomNav from './BottomNav';
import { useRole } from '@/lib/RoleContext';

const ROLE_DEFAULT_ROUTES = {
  lecteur: '/',
  voyageur: '/missions',
  relais: '/stock',
};

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
        22 Avril 2026 · Paris → le Monde
      </div>

      <main className="max-w-[480px] mx-auto px-4 pb-[100px] relative z-[1]">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}