import React from 'react';
import { BADGE_LEVELS, getReaderLevel, LIBRARY_COLORS } from './libraryUtils';

export default function BadgeProgressPanel({ count }) {
  const level = getReaderLevel(count);
  return (
    <section className="mt-5 border p-5" style={{ background: 'linear-gradient(145deg, #FFF8EA, #F3E8D2)', borderColor: 'rgba(110,30,46,0.18)' }}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="font-ui text-[10px] font-extrabold uppercase tracking-[0.24em]" style={{ color: LIBRARY_COLORS.wine }}>Progression</div>
          <h2 className="mt-1 font-heading text-2xl font-bold" style={{ color: LIBRARY_COLORS.wine }}>Badges de collection</h2>
        </div>
        <div className="text-right font-ui text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: LIBRARY_COLORS.leather }}>{count} / {level.next.threshold} livres</div>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#3B2A23]/10"><div className="h-full rounded-full transition-all" style={{ width: `${level.progress}%`, background: LIBRARY_COLORS.gold }} /></div>
      <div className="grid gap-2 sm:grid-cols-2">
        {BADGE_LEVELS.map(badge => {
          const unlocked = count >= badge.threshold;
          return (
            <div key={badge.name} className="flex items-center gap-3 border p-3" style={{ background: unlocked ? 'rgba(199,161,90,0.14)' : 'rgba(255,248,234,0.54)', borderColor: unlocked ? 'rgba(110,30,46,0.26)' : 'rgba(110,30,46,0.12)', opacity: unlocked ? 1 : 0.68 }}>
              <span className="text-2xl">{unlocked ? badge.icon : '◌'}</span>
              <div><div className="font-heading text-[16px] font-bold text-[#6E1E2E]">{badge.name}</div><div className="font-body text-[13px] italic text-[#3B2A23]/58">{badge.threshold} livres possédés</div></div>
            </div>
          );
        })}
      </div>
    </section>
  );
}