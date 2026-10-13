import React from 'react';
import { Search } from 'lucide-react';

export default function StickySearchBar({ value, onChange, placeholder }) {
  return (
    <div className="sticky top-2 z-40 mx-auto mb-4 w-full max-w-3xl px-1">
      <div className="relative rounded-2xl border-2 border-cta bg-papier/95 shadow-[0_10px_24px_rgba(194,65,12,0.16)] backdrop-blur">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cta" size={22} />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-14 w-full bg-transparent pl-12 pr-4 font-ui text-[15px] text-bordeaux placeholder:text-bordeaux/45 outline-none focus:shadow-[0_0_0_4px_rgba(194,65,12,0.16)] sm:h-16 sm:text-base"
        />
      </div>
    </div>
  );
}