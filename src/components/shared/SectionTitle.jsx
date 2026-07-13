import React from 'react';

export default function SectionTitle({ children }) {
  return (
    <div className="font-fell italic text-[10px] sm:text-[11px] tracking-[1.6px] sm:tracking-[3px] uppercase text-primary flex items-center gap-2 my-5 sm:my-6 first:mt-0 min-w-0">
      <span className="min-w-0 break-words">{children}</span>
      <span className="flex-1 min-w-6 h-px section-dash" />
    </div>
  );
}