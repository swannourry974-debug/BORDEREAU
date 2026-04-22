import React from 'react';
import { useRole } from '@/lib/RoleContext';

export default function AppHeader() {
  const { role, ROLES, switcherOpen, setSwitcherOpen } = useRole();

  return (
    <header className="bg-bordeaux sticky top-0 z-50 shadow-[0_3px_12px_rgba(128,0,32,0.4)] border-b-2 border-bordeaux-dark">
      <div className="max-w-[480px] mx-auto px-5 py-[18px] pb-[14px] flex items-center justify-between">
        <div className="leading-none">
          <div className="font-typewriter text-[28px] text-creme tracking-[6px] uppercase">
            BORDEREAU
          </div>
          <span className="font-fell italic text-[11px] text-creme/70 tracking-[2px] mt-[2px] block">
            Manifeste des livres voyageurs
          </span>
        </div>
        <button
          onClick={() => setSwitcherOpen(!switcherOpen)}
          className="relative bg-creme text-bordeaux font-typewriter text-[9px] tracking-[2px] uppercase px-[10px] py-1 border border-bordeaux-dark cursor-pointer transition-all hover:bg-papier"
        >
          <span className="absolute -top-[3px] -right-[3px] -bottom-[3px] -left-[3px] border border-dashed border-bordeaux/40 pointer-events-none" />
          {ROLES[role].badge}
        </button>
      </div>
    </header>
  );
}