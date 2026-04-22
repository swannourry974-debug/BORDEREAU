import React from 'react';

export default function WelcomeCard({ eyebrow, title, subtitle }) {
  return (
    <div className="bg-bordeaux text-creme p-[18px] px-5 mb-5 relative overflow-hidden">
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[60px] opacity-10 pointer-events-none">✦</span>
      <div className="text-[9px] tracking-[3px] uppercase opacity-70 mb-[6px] font-typewriter">{eyebrow}</div>
      <div className="font-serif text-[20px] font-bold leading-tight" dangerouslySetInnerHTML={{ __html: title }} />
      {subtitle && (
        <div className="font-fell italic text-[12px] opacity-75 mt-[6px]">{subtitle}</div>
      )}
    </div>
  );
}