import React from 'react';
import { getComparativeSavings } from '@/lib/comparativeRates';

export default function BookSavingsBadge({ destination, price }) {
  const comparative = getComparativeSavings(destination, price);
  return (
    <span className="text-[9px] tracking-[1.2px] uppercase px-[7px] py-[3px] border border-[#2d6a2d] text-[#2d6a2d] bg-[#2d6a2d]/5 font-bold">
      +{comparative.savings.toFixed(0)} € / colis
    </span>
  );
}