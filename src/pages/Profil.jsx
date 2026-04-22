import React from 'react';
import WelcomeCard from '@/components/shared/WelcomeCard';
import SectionTitle from '@/components/shared/SectionTitle';
import { useRole } from '@/lib/RoleContext';

export default function Profil() {
  const { role, ROLES } = useRole();

  return (
    <div>
      <WelcomeCard
        eyebrow="Mon Profil"
        title="Paramètres &<br>Préférences"
        subtitle={`Rôle actif : ${ROLES[role].label}`}
      />

      <SectionTitle>Informations</SectionTitle>

      <div className="bg-papier border-[1.5px] border-encre p-5 shadow-[2px_2px_0_rgba(26,16,8,0.15)]">
        <div className="space-y-4">
          <div>
            <div className="text-[9px] tracking-[2px] uppercase text-foreground/55 mb-1 font-typewriter">Nom</div>
            <div className="font-serif text-[15px] font-bold">—</div>
          </div>
          <div className="border-t border-dashed border-foreground/20 pt-4">
            <div className="text-[9px] tracking-[2px] uppercase text-foreground/55 mb-1 font-typewriter">Destination</div>
            <div className="font-serif text-[15px] font-bold">Miami, FL · USA</div>
          </div>
          <div className="border-t border-dashed border-foreground/20 pt-4">
            <div className="text-[9px] tracking-[2px] uppercase text-foreground/55 mb-1 font-typewriter">Rôle</div>
            <div className="font-serif text-[15px] font-bold flex items-center gap-2">
              <span>{ROLES[role].icon}</span> {ROLES[role].label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}