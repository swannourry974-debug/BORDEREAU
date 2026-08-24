import React from 'react';
import BorderoButton from './BorderoButton';
import BorderoCard from './BorderoCard';

export default function BorderoWishlist({ items = [], total, onImport, onToggle }) {
  return (
    <BorderoCard className="space-y-3">
      {items.map(item => (
        <div key={item.id || item.title} className="flex items-center justify-between gap-3 rounded-[12px] border p-3" style={{ borderColor: 'rgba(200,161,101,0.25)' }}>
          <div><div className="bordero-title text-sm">{item.title}</div><div className="bordero-ui text-xs opacity-65">{item.author} · {item.price}</div></div>
          <button type="button" onClick={() => onToggle?.(item)} className="min-h-[44px] min-w-[44px] text-[#D8B87A]">♡</button>
        </div>
      ))}
      {total && <div className="flex justify-between border-t pt-3 text-sm" style={{ borderColor: 'rgba(200,161,101,0.24)' }}><span>Total</span><strong>{total}</strong></div>}
      <BorderoButton className="w-full" onClick={onImport}>Importer sur Bordero</BorderoButton>
    </BorderoCard>
  );
}