import React from 'react';
import CouponButton from '@/components/shared/CouponButton';

export default function RelaisAccessNotice({ status = 'en_attente', onBack }) {
  const rejected = status === 'rejete';

  return (
    <div className="bg-papier border-2 border-bordeaux p-5 shadow-[5px_5px_0_rgba(26,16,8,0.18)]">
      <div className="text-[10px] tracking-[3px] uppercase text-bordeaux font-special mb-2">Accès Point Relais</div>
      <h2 className="text-[22px] font-bold text-encre mb-2">Validation administrateur requise.</h2>
      <p className="text-[13px] leading-relaxed text-encre/70 mb-4">
        La rubrique Point Relais est réservée aux partenaires validés. Votre demande doit être contrôlée par un administrateur avant d’ouvrir le scanner, le stock et les profils lecteurs.
      </p>
      <div className="bg-creme border border-encre/20 p-3 mb-4 text-[12px] text-encre/70">
        Statut actuel : <strong className={rejected ? 'text-bordeaux' : 'text-[#8B6914]'}>{rejected ? 'demande rejetée' : 'en attente de validation'}</strong>.
      </div>
      <CouponButton secondary onClick={onBack}>Retour au profil</CouponButton>
    </div>
  );
}