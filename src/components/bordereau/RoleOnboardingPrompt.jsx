import React from 'react';
import CouponButton from '@/components/shared/CouponButton';

const roles = [
  {
    id: 'lecteur',
    icon: '📖',
    title: 'Lecteur',
    description: 'Vous commandez vos livres, choisissez un relais et suivez chaque étape jusqu’à la remise.',
    benefit: 'Idéal pour acheter et recevoir simplement.',
  },
  {
    id: 'voyageur',
    icon: '✈️',
    title: 'Voyageur',
    description: 'Vous transportez des livres pendant vos trajets, acceptez des missions et suivez vos gains.',
    benefit: 'Idéal pour rentabiliser vos déplacements.',
  },
  {
    id: 'relais',
    icon: '🏪',
    title: 'Point relais',
    description: 'Vous réceptionnez les colis, scannez les dépôts et organisez les retraits des lecteurs.',
    benefit: 'Idéal pour gérer le stock local.',
  },
];

export default function RoleOnboardingPrompt({ open, currentRole, onSelect, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-[rgba(26,16,8,0.58)] px-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] sm:items-center sm:p-6">
      <div className="w-full max-w-[560px] bg-creme border-2 border-encre shadow-[8px_8px_0_rgba(26,16,8,0.25)] p-5 sm:p-6">
        <div className="text-[10px] tracking-[3px] uppercase text-bordeaux font-special mb-2">Bienvenue sur Bordero</div>
        <h2 className="text-[22px] sm:text-[26px] font-bold text-encre leading-tight mb-2">Choisissez votre rôle pour commencer au bon endroit.</h2>
        <p className="text-[13px] leading-relaxed text-encre/65 mb-5">
          Votre espace s’adapte à votre besoin. Vous pouvez changer de rôle plus tard depuis l’en-tête.
        </p>

        <div className="space-y-3">
          {roles.map((role) => {
            const active = currentRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => onSelect(role.id)}
                className={`w-full text-left border p-3 transition-all ${active ? 'border-bordeaux bg-bordeaux/5' : 'border-encre/20 bg-papier hover:border-bordeaux/60'}`}
              >
                <div className="flex gap-3">
                  <span className="text-[26px] leading-none mt-1">{role.icon}</span>
                  <span className="flex-1">
                    <span className="block text-[15px] font-bold text-encre">{role.title}</span>
                    <span className="block text-[12px] leading-relaxed text-encre/70 mt-1">{role.description}</span>
                    <span className="block text-[10px] tracking-[1.5px] uppercase text-bordeaux mt-2 font-special">{role.benefit}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <CouponButton secondary onClick={onClose} className="w-full sm:w-auto">
            Choisir plus tard
          </CouponButton>
          <p className="text-[11px] text-encre/45 italic text-center sm:text-right">
            Ce choix personnalise seulement votre navigation.
          </p>
        </div>
      </div>
    </div>
  );
}