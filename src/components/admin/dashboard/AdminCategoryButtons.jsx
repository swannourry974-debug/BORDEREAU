import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function AdminCategoryButtons({ tabs, activeTab, onTabChange }) {
  return (
    <div className="rounded-2xl border border-bordeaux/20 bg-papier p-4 shadow-[4px_4px_0_rgba(26,16,8,0.10)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="font-ui text-[10px] uppercase tracking-[3px] text-bordeaux">Accès direct admin</div>
          <div className="font-body text-sm italic text-encre/60">Ouvrir rapidement chaque catégorie.</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`min-h-[48px] rounded-xl border px-3 py-2 text-left font-ui text-[10px] uppercase tracking-[1.4px] transition ${active ? 'border-cta bg-cta text-cta-foreground shadow-md' : 'border-bordeaux/20 bg-creme text-bordeaux hover:border-cta hover:text-cta'}`}
            >
              <span className="flex items-center justify-between gap-2">
                {tab.label}
                <ArrowRight size={13} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}