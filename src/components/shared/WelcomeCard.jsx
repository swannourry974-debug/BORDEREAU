import React from 'react';

export default function WelcomeCard({ eyebrow, title, subtitle }) {
  return (
    <div className="bg-bordeaux text-creme p-4 sm:p-[18px] sm:px-5 mb-5 relative overflow-hidden">
      <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[44px] sm:text-[60px] opacity-10 pointer-events-none">✦</span>
      <div className="text-[8px] sm:text-[9px] tracking-[2px] sm:tracking-[3px] uppercase opacity-70 mb-[6px] font-typewriter leading-snug">{eyebrow}</div>
      <div className="font-serif text-[18px] sm:text-[20px] font-bold leading-tight break-words" dangerouslySetInnerHTML={{ __html: title }} />
      {subtitle && (
        <div className="font-fell italic text-[11px] sm:text-[12px] opacity-75 mt-[6px] leading-snug break-words">
          {typeof subtitle === 'string' ? subtitle : subtitle}
        </div>
      )}
    </div>
  );
}