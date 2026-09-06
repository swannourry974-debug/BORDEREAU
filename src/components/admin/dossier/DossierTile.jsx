import React from 'react';

export default function DossierTile({ index, title, body, color }) {
  return (
    <article className="relative min-h-[150px] rounded-2xl border border-bordeaux/35 bg-creme p-4 shadow-[8px_8px_0_rgba(128,0,32,0.12)]">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-bordeaux/30 font-ui text-xs font-bold" style={{ backgroundColor: color }}>
          {index + 1}
        </span>
        <h4 className="font-heading text-lg leading-tight text-bordeaux">{title}</h4>
      </div>
      <p className="font-body text-[17px] leading-snug text-bordeaux/80">{body}</p>
    </article>
  );
}