import React from 'react';
import { useRole } from '@/lib/RoleContext';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = {
  lecteur: [
    { icon: '🔍', label: 'Catalogue', path: '/' },
    { icon: '📚', label: 'Étagère', path: '/etagere', notif: 2 },
  ],
  voyageur: [
    { icon: '🗺️', label: 'Missions', path: '/missions' },
  ],
  relais: [
    { icon: '📦', label: 'Stock', path: '/stock' },
  ],
};

export default function BottomNav() {
  const { role } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    ...(NAV_ITEMS[role] || []),
    { icon: '👤', label: 'Profil', path: '/profil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-creme border-t-2 border-encre z-50 max-w-[480px] mx-auto md:left-1/2 md:-translate-x-1/2 md:w-[480px]">
      <div className="flex">
        {items.map((item, i) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center py-[10px] px-1 relative cursor-pointer transition-all ${
                i < items.length - 1 ? 'border-r border-dashed border-foreground/20' : ''
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-0 right-0 h-[3px] bg-bordeaux" />
              )}
              <span className="text-[22px] mb-[3px]">{item.icon}</span>
              <span className={`text-[8px] tracking-[1.5px] uppercase ${
                isActive ? 'text-bordeaux font-bold' : 'text-foreground/50'
              }`}>
                {item.label}
              </span>
              {item.notif && (
                <span className="absolute top-[6px] right-[calc(50%-18px)] bg-bordeaux text-creme text-[8px] w-[14px] h-[14px] rounded-full flex items-center justify-center font-mono">
                  {item.notif}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}