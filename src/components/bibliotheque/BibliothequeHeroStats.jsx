import React from 'react';
import { BorderoLogo } from '@/components/bordero';
import { LIBRARY_COLORS } from './libraryUtils';

function Stat({ value, label }) {
  return (
    <div className="border p-3 text-center" style={{ background: 'rgba(255,248,234,0.72)', borderColor: 'rgba(110,30,46,0.16)' }}>
      <div className="font-heading text-2xl font-bold leading-none" style={{ color: LIBRARY_COLORS.wine }}>{value}</div>
      <div className="mt-1 font-ui text-[9px] font-extrabold uppercase tracking-[0.18em]" style={{ color: 'rgba(59,42,35,0.58)' }}>{label}</div>
    </div>
  );
}

export default function BibliothequeHeroStats({ owned, read, favorites, level }) {
  return (
    <section className="relative overflow-hidden border p-5 sm:p-6" style={{ background: 'linear-gradient(135deg, #FFF8EA 0%, #F3E8D2 58%, #EBD8B6 100%)', borderColor: 'rgba(110,30,46,0.22)', boxShadow: '0 18px 42px rgba(59,42,35,0.12)' }}>
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full border border-[#C7A15A]/35" />
      <div className="absolute -bottom-12 left-6 h-28 w-28 rounded-full border border-[#6E1E2E]/15" />
      <div className="relative flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <BorderoLogo />
            <div className="mt-5 font-ui text-[10px] font-extrabold uppercase tracking-[0.28em]" style={{ color: LIBRARY_COLORS.gold }}>Bibliothèque vivante</div>
            <h1 className="mt-2 font-heading text-[42px] font-extrabold leading-[0.96] sm:text-5xl" style={{ color: LIBRARY_COLORS.wine }}>Ma bibliothèque</h1>
            <p className="mt-3 max-w-sm font-body text-[18px] leading-snug text-[#3B2A23]/72">Une collection personnelle, pensée comme un carnet de lecture et de voyage.</p>
          </div>
          <div className="rounded-full border px-4 py-2 font-ui text-[10px] font-extrabold uppercase tracking-[0.18em]" style={{ borderColor: 'rgba(199,161,90,0.55)', color: LIBRARY_COLORS.leather, background: 'rgba(255,248,234,0.58)' }}>
            {level}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Stat value={owned} label="Possédés" />
          <Stat value={read} label="Reçus" />
          <Stat value={favorites} label="Favoris" />
        </div>
      </div>
    </section>
  );
}