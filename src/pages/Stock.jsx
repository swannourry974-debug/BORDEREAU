import React from 'react';
import WelcomeCard from '@/components/shared/WelcomeCard';
import SectionTitle from '@/components/shared/SectionTitle';
import CouponButton from '@/components/shared/CouponButton';
import StockItem from '@/components/stock/StockItem';
import { toast } from 'sonner';

const STOCK_ITEMS = [
  { emoji: '📗', title: "L'Élégance du hérisson", depositor: 'Déposé par : @marc.v · il y a 2j' },
  { emoji: '📘', title: 'Le Petit Prince', depositor: 'Déposé par : @sophie.k · il y a 5j' },
  { emoji: '📕', title: 'Astérix T.2', depositor: 'Déposé par : @thomas.r · il y a 1j' },
];

export default function Stock() {
  return (
    <div>
      <WelcomeCard
        eyebrow="Café Lumière · Miami, FL"
        title="Tableau de Bord<br>Point Relais"
        subtitle="Tiers de confiance certifié BORDERO"
      />

      {/* Stock header */}
      <div className="flex items-center gap-4 bg-papier border-[1.5px] border-encre p-[14px] px-4 mb-4 shadow-[2px_2px_0_rgba(26,16,8,0.12)]">
        <span className="text-[36px]">📚</span>
        <div>
          <div className="font-serif text-[36px] font-bold text-bordeaux leading-none">3</div>
          <div className="text-[10px] tracking-[1.5px] text-foreground/50 font-typewriter">Livres en attente</div>
        </div>
        <div className="ml-auto w-[60px] h-[60px] bg-encre flex items-center justify-center relative">
          <span className="text-creme text-[12px] tracking-[1px] font-typewriter">QR</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-[10px] mb-5">
        <CouponButton onClick={() => toast.info('Scanner le dépôt d\'un voyageur')} className="py-4 text-[11px] text-center">
          📥 Scanner<br /><span className="text-[9px] opacity-70 tracking-[1px]">DÉPÔT</span>
        </CouponButton>
        <CouponButton secondary onClick={() => toast.info('Scanner le retrait d\'un lecteur')} className="py-4 text-[11px] text-center">
          📤 Scanner<br /><span className="text-[9px] opacity-70 tracking-[1px]">RETRAIT</span>
        </CouponButton>
      </div>

      <SectionTitle>Stock actuel</SectionTitle>
      <div className="pl-7">
        {STOCK_ITEMS.map((item, i) => (
          <StockItem key={i} item={item} index={i} />
        ))}
      </div>
    </div>
  );
}