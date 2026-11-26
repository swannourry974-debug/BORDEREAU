import React, { useState } from 'react';

export default function CollapsedMissionList({ title, missions, renderMission }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="bordero-card mb-4 p-3">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="bordero-ui flex min-h-[44px] w-full items-center justify-between bg-transparent p-2 text-left text-[11px] uppercase tracking-[2px]"
        style={{ color: 'var(--bordeaux)' }}
      >
        <span>{title} · {missions.length}</span>
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="pt-2">
          {missions.length
            ? missions.map(renderMission)
            : <div className="bordero-copy p-4 text-center text-sm italic">Aucune mission.</div>}
        </div>
      )}
    </section>
  );
}
