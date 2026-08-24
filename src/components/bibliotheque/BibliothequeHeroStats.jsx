import React from 'react';
import { LIBRARY_COLORS } from './libraryUtils';

function Stat({ icon, value, label }) {
  return (
    <div className="flex items-center gap-3 border-r border-[#C8A165]/30 last:border-r-0 px-3 py-2">
      <span className="text-2xl text-[#C8A165]">{icon}</span>
      <div>
        <div className="text-lg font-bold leading-none" style={{ color: LIBRARY_COLORS.cream }}>{value}</div>
        <div className="text-[10px] uppercase tracking-[1px]" style={{ color: 'rgba(245,230,204,0.62)' }}>{label}</div>
      </div>
    </div>
  );
}

export default function BibliothequeHeroStats({ owned, read, favorites, level }) {
  return (
    <section className="relative overflow-hidden border p-4 shadow-xl" style={{ background: LIBRARY_COLORS.wine, borderColor: 'rgba(200,161,101,0.35)' }}>
      <div className="text-[10px] uppercase tracking-[3px] mb-2" style={{ color: LIBRARY_COLORS.gold }}>France · Bordero</div>
      <h1 className="text-3xl font-bold leading-tight" style={{ color: LIBRARY_COLORS.cream }}>Ma Bibliothèque Vivante</h1>
      <p className="text-sm mt-2 max-w-sm" style={{ color: 'rgba(245,230,204,0.72)' }}>Chaque livre acheté prend sa place sur votre étagère. Collectionnez, lisez, revivez.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 mt-5 border rounded-lg" style={{ borderColor: 'rgba(200,161,101,0.32)', background: 'rgba(42,16,13,0.52)' }}>
        <Stat icon="📖" value={owned} label="Livres possédés" />
        <Stat icon="📘" value={read} label="Livres lus" />
        <Stat icon="★" value={favorites} label="Favoris" />
        <Stat icon="🏅" value={level} label="Niveau lecteur" />
      </div>
    </section>
  );
}