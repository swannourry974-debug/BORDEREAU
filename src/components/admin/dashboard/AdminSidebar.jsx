import React from 'react';
import { LayoutDashboard, LogOut } from 'lucide-react';

export default function AdminSidebar({ tabs, activeTab, onTabChange, isAgentBordeur, onOfficialLogin }) {
  return (
    <aside className="md:sticky md:top-0 md:h-screen md:w-72 shrink-0 bg-bordeaux text-creme border-r border-or/30 flex flex-col">
      <div className="p-5 border-b border-creme/15">
        <div onDoubleClick={onOfficialLogin} className="font-ui text-[18px] tracking-[5px] uppercase select-none">Bordero</div>
        <div className="font-body italic text-creme/70 text-sm mt-1">{isAgentBordeur ? 'Agent bordeur' : 'Console admin'}</div>
      </div>
      <nav className="p-3 flex md:flex-col gap-2 overflow-x-auto">
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`min-h-[44px] whitespace-nowrap text-left px-4 py-3 rounded-lg font-ui text-[12px] tracking-[1.5px] uppercase transition ${active ? 'bg-creme text-bordeaux shadow-lg' : 'text-creme/75 hover:bg-creme/10'}`}
            >
              <span className="inline-flex items-center gap-2"><LayoutDashboard size={15} />{tab.label}</span>
            </button>
          );
        })}
      </nav>
      <a href="/" className="m-3 mt-auto min-h-[44px] inline-flex items-center justify-center rounded-lg border border-creme/25 text-creme/80 font-ui text-[12px] tracking-[2px] uppercase">← App</a>
      <button
        type="button"
        onClick={onOfficialLogin}
        className="mx-3 mb-3 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg bg-cta px-4 py-3 font-ui text-[12px] font-bold uppercase tracking-[2px] text-cta-foreground shadow-lg shadow-black/15 transition hover:bg-cta-dark"
      >
        <LogOut size={15} />
        Déconnexion
      </button>
    </aside>
  );
}