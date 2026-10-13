import React, { useState } from 'react';

export default function CollapsedMissionList({ title, missions, renderMission }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mb-4 rounded-2xl border border-bordeaux/15 bg-papier p-3">
      <button onClick={() => setOpen(v => !v)} className="flex w-full items-center justify-between bg-transparent p-2 text-left font-ui text-[11px] uppercase tracking-[2px] text-bordeaux">
        <span>{title} · {missions.length}</span><span>{open ? '−' : '+'}</span>
      </button>
      {open && <div className="pt-2">{missions.length ? missions.map(renderMission) : <div className="p-4 text-center font-body text-sm italic text-bordeaux/45">Aucune mission.</div>}</div>}
    </section>
  );
}