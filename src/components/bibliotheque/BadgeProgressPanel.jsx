import React from 'react';
import { BADGE_LEVELS, getReaderLevel } from './libraryUtils';

export default function BadgeProgressPanel({ count }) {
  const level = getReaderLevel(count);
  return (
    <section className="bordero-card mt-5 p-4">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div><h2 className="bordero-title text-xl" style={{ color: 'var(--bordeaux)' }}>Badges</h2><p className="text-xs" style={{ color: 'var(--encre-douce)' }}>Votre progression de collectionneur</p></div>
        <div className="text-sm" style={{ color: 'var(--sepia)' }}>{count} / {level.next.threshold} livres</div>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full" style={{ background: 'rgba(110,30,46,0.12)' }}><div className="h-full rounded-full" style={{ width: `${level.progress}%`, background: 'var(--sepia)' }} /></div>
      <div className="grid gap-2">
        {BADGE_LEVELS.map(badge => {
          const unlocked = count >= badge.threshold;
          return (
            <div key={badge.name} className="bordero-surface flex items-center gap-3 p-3" style={{ opacity: unlocked ? 1 : 0.55 }}>
              <span className="text-2xl" style={{ color: unlocked ? 'var(--sepia)' : 'var(--encre-douce)' }}>{unlocked ? badge.icon : '◌'}</span>
              <div>
                <div className="text-sm font-bold" style={{ color: 'var(--encre)' }}>{badge.name}</div>
                <div className="text-xs" style={{ color: 'var(--encre-douce)' }}>{badge.threshold} livres possédés</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
