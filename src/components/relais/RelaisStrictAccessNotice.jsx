import React from 'react';
import CouponButton from '@/components/shared/CouponButton';

export default function RelaisStrictAccessNotice({ onBack }) {
  return (
    <div className="bg-papier border-2 border-bordeaux p-5 shadow-[5px_5px_0_rgba(26,16,8,0.18)]">
      <div className="text-[10px] tracking-[3px] uppercase text-bordeaux font-special mb-2">Compte Point Relais</div>
      <h2 className="text-[22px] font-bold text-encre mb-2">Accès strictement relais.</h2>
      <p className="text-[13px] leading-relaxed text-encre/70 mb-4">
        Un compte Point Relais ne peut pas être utilisé comme compte lecteur ou voyageur. Les achats, l’étagère lecteur, les missions voyageur et les wallets lecteur/voyageur sont désactivés pour ce profil.
      </p>
      <CouponButton secondary onClick={onBack}>Retour à l’espace relais</CouponButton>
    </div>
  );
}