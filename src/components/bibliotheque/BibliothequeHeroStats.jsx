import React from 'react';
import { BorderoLogo } from '@/components/bordero';
import { LIBRARY_COLORS } from './libraryUtils';

function Stat({ icon, value, label }) {
  return (
    <div className="flex items-center gap-3 border-r px-4 py-3 last:border-r-0" style={{ borderColor: 'rgba(200,161,101,0.24)' }}>
      <span className="text-2xl text-[#D8B87A]">{icon}</span>
      <div>
        <div className="bordero-title text-xl leading-none" style={{ color: LIBRARY_COLORS.cream }}>{value}</div>
        <div className="bordero-ui text-[10px] uppercase tracking-[1px]" style={{ color: 'rgba(245,230,204,0.62)' }}>{label}</div>
      </div>
    </div>
  );
}

export default function BibliothequeHeroStats({ owned, read, favorites, level }) {
  return (
    <section className="bordero-card relative overflow-hidden p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-sm">
          <BorderoLogo />
          <h1 className="bordero-title mt-5 text-4xl leading-tight" style={{ color: LIBRARY_COLORS.cream }}>Ma bibliothèque</h1>
          <p className="bordero-body mt-3 text-lg leading-snug" style={{ color: 'rgba(245,230,204,0.78)' }}>Chaque livre acheté prend sa place sur votre étagère. Collectionnez, lisez, revivez.</p>
        </div>
        <div className="grid grid-cols-2 rounded-[16px] border sm:grid-cols-4" style={{ borderColor: 'rgba(200,161,101,0.32)', background: 'rgba(128,0,32,0.74)' }}>
          <Stat icon="▰" value={owned} label="Livres possédés" />
          <Stat icon="▣" value={read} label="Livres lus" />
          <Stat icon="★" value={favorites} label="Favoris" />
          <Stat icon="✦" value={level} label="Niveau lecteur" />
        </div>
      </div>
    </section>
  );
}