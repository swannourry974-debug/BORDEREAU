import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Truck, BarChart3, Layers } from 'lucide-react';

const CATEGORY_MAP = [
  { id: 'all', label: 'Toutes', icon: Layers },
  { id: 'validations', label: 'Validations', icon: ShieldCheck },
  { id: 'operations', label: 'Opérations', icon: Truck },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function AdminCategoryButtons({ tabs, activeTab, onTabChange }) {
  const [selectedCat, setSelectedCat] = useState('all');

  const filteredTabs = selectedCat === 'all'
    ? tabs
    : tabs.filter(t => t.category === selectedCat);

  return (
    <div className="rounded-2xl border border-bordeaux/20 bg-papier p-4 shadow-[4px_4px_0_rgba(26,16,8,0.10)] space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bordeaux/10 pb-3">
        <div>
          <div className="font-ui text-[10px] uppercase tracking-[3px] text-bordeaux font-bold">Console Administrateur</div>
          <div className="font-body text-xs italic text-encre/60">Accès rapide aux modules de gestion</div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1 bg-creme p-1 rounded-xl border border-bordeaux/15">
          {CATEGORY_MAP.map(cat => {
            const CatIcon = cat.icon;
            const active = selectedCat === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-ui text-[10px] uppercase tracking-[1px] transition flex items-center gap-1.5 ${
                  active
                    ? 'bg-bordeaux text-creme shadow-xs font-bold'
                    : 'text-bordeaux/70 hover:bg-bordeaux/10'
                }`}
              >
                <CatIcon size={12} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {filteredTabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`min-h-[44px] rounded-xl border px-3 py-2 text-left font-ui text-[10px] uppercase tracking-[1.2px] transition ${
                active
                  ? 'border-cta bg-cta text-cta-foreground shadow-md font-bold'
                  : 'border-bordeaux/20 bg-creme text-bordeaux hover:border-cta hover:text-cta'
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 truncate">
                  <span>{tab.icon || '📌'}</span>
                  <span className="truncate">{tab.label}</span>
                </span>
                <ArrowRight size={12} className="shrink-0" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
