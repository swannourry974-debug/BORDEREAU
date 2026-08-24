import React from 'react';
import { BADGE_LEVELS, getReaderLevel, LIBRARY_COLORS } from './libraryUtils';

export default function BadgeProgressPanel({ count }) {
  const level = getReaderLevel(count);
  return (
    <section className="border p-4 mt-5" style={{ background: LIBRARY_COLORS.wine, borderColor: 'rgba(200,161,101,0.35)', color: LIBRARY_COLORS.cream }}>
      <div className="flex justify-between items-end gap-4 mb-3">
        <div><h2 className="text-xl font-bold">Badges</h2><p className="text-xs opacity-65">Votre progression de collectionneur</p></div>
        <div className="text-right text-[#C8A165] text-sm">{count} / {level.next.threshold} livres</div>
      </div>
      <div className="h-2 bg-black/30 overflow-hidden mb-4"><div className="h-full" style={{ width: `${level.progress}%`, background: LIBRARY_COLORS.gold }} /></div>
      <div className="grid gap-2">
        {BADGE_LEVELS.map(badge => {
          const unlocked = count >= badge.threshold;
          return <div key={badge.name} className="flex items-center gap-3 border p-3 opacity-100" style={{ borderColor: unlocked ? 'rgba(200,161,101,0.48)' : 'rgba(245,230,204,0.14)' }}><span className="text-2xl">{unlocked ? badge.icon : '◌'}</span><div><div className="font-bold text-sm">{badge.name}</div><div className="text-xs opacity-60">{badge.threshold} livres possédés</div></div></div>;
        })}
      </div>
    </section>
  );
}