import React, { useEffect, useState } from 'react';

export default function JaugeBlock() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(63), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-papier border-[1.5px] border-encre p-4 mb-5 shadow-[2px_2px_0_rgba(26,16,8,0.15)]">
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-[10px] tracking-[2px] uppercase font-typewriter">Jauge carton Miami</div>
          <div className="text-[10px] text-foreground/40 mt-[2px] italic font-fell">Départ estimé : 3 mai 2026</div>
        </div>
        <div className="font-serif text-[18px] font-bold text-bordeaux">12,6 kg</div>
      </div>
      <div className="h-6 bg-creme border border-foreground/30 relative overflow-hidden">
        <div
          className="h-full jauge-fill-pattern transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="flex justify-between mt-[6px] text-[9px] text-foreground/40 tracking-[1px] font-typewriter">
        <span>0 kg</span>
        <span>63% rempli · 7,4 kg restants</span>
        <span>20 kg</span>
      </div>
    </div>
  );
}