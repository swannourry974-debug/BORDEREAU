import React from 'react';
import { BorderoLogo } from '@/components/bordero';

function Stat({ icon, value, label }) {
  return (
    <div className="bordero-surface flex items-center gap-3 p-3">
      <span className="text-xl" style={{ color: 'var(--sepia)' }}>{icon}</span>
      <div>
        <div className="bordero-title text-xl leading-none" style={{ color: 'var(--bordeaux)' }}>{value}</div>
        <div className="bordero-ui text-[10px] uppercase tracking-[1px]" style={{ color: 'var(--encre-douce)' }}>{label}</div>
      </div>
    </div>
  );
}

export default function BibliothequeHeroStats({ owned, read, favorites, level }) {
  return (
    <section className="bordero-card-premium relative overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-sm">
          <BorderoLogo />
          <h1 className="bordero-title mt-5 text-3xl leading-tight sm:text-4xl" style={{ color: 'var(--bordeaux)' }}>Ma bibliothèque</h1>
          <p className="bordero-copy mt-3 text-base leading-snug sm:text-lg">Chaque livre acheté prend sa place sur votre étagère. Collectionnez, lisez, revivez.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat icon="▰" value={owned} label="Livres possédés" />
          <Stat icon="▣" value={read} label="Livres lus" />
          <Stat icon="★" value={favorites} label="Favoris" />
          <Stat icon="✦" value={level} label="Niveau lecteur" />
        </div>
      </div>
    </section>
  );
}
