import React from 'react';
import { LayoutDashboard, LogOut, ShieldCheck, Truck, BarChart3 } from 'lucide-react';

const CATEGORY_MAP = [
  { id: 'validations', label: 'Validations & Dashboard', icon: ShieldCheck },
  { id: 'operations', label: 'Opérations & Suivi', icon: Truck },
  { id: 'analytics', label: 'Analytics & Rapports', icon: BarChart3 },
];

export default function AdminSidebar({ tabs, activeTab, onTabChange, isAgentBordeur, onOfficialLogin }) {
  return (
    <aside className="md:sticky md:top-0 md:h-screen md:w-72 shrink-0 bg-bordeaux text-creme border-r border-or/30 flex flex-col">
      <div className="p-5 border-b border-creme/15">
        <div onDoubleClick={onOfficialLogin} className="font-ui text-[18px] tracking-[5px] uppercase select-none">Bordero</div>
        <div className="font-body italic text-creme/70 text-sm mt-1">{isAgentBordeur ? 'Agent bordeur' : 'Console admin'}</div>
      </div>
      <nav className="p-3 flex md:flex-col gap-4 overflow-y-auto flex-1">
        {CATEGORY_MAP.map(cat => {
          const categoryTabs = tabs.filter(t => t.category === cat.id);
          if (categoryTabs.length === 0) return null;
          const CatIcon = cat.icon;
          return (
            <div key={cat.id} className="space-y-1">
              <div className="px-3 py-1 font-ui text-[9px] uppercase tracking-[2px] text-creme/50 flex items-center gap-1.5">
                <CatIcon size={12} />
                <span>{cat.label}</span>
              </div>
              <div className="flex md:flex-col gap-1">
                {categoryTabs.map(tab => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      className={`min-h-[40px] w-full whitespace-nowrap text-left px-3 py-2 rounded-lg font-ui text-[11px] tracking-[1.2px] uppercase transition flex items-center justify-between ${active ? 'bg-creme text-bordeaux font-bold shadow-md' : 'text-creme/80 hover:bg-creme/10'}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span>{tab.icon || '📌'}</span>
                        <span>{tab.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="p-3 border-t border-creme/15 flex flex-col gap-2">
        <a href="/" className="min-h-[40px] inline-flex items-center justify-center rounded-lg border border-creme/25 text-creme/80 font-ui text-[11px] tracking-[2px] uppercase hover:bg-creme/10">← App Client</a>
        <button
          type="button"
          onClick={onOfficialLogin}
          className="min-h-[40px] inline-flex items-center justify-center gap-2 rounded-lg bg-cta px-4 py-2 font-ui text-[11px] font-bold uppercase tracking-[2px] text-cta-foreground shadow-md transition hover:bg-cta-dark"
        >
          <LogOut size={14} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
