import React from 'react';

export default function SectionTitle({ children }) {
  return (
    <div className="font-fell italic text-[11px] tracking-[3px] uppercase text-primary flex items-center gap-2 my-6 first:mt-0">
      {children}
      <span className="flex-1 h-px section-dash" />
    </div>
  );
}