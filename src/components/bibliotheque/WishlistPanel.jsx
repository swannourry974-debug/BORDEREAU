import React, { useState } from 'react';
import { formatMoney } from './libraryUtils';

export default function WishlistPanel({ items, onAdd, onDelete, onImport }) {
  const [sort, setSort] = useState('popularite');
  const [form, setForm] = useState({ title: '', author: '', price: '' });
  const sorted = [...items].sort((a, b) => {
    if (sort === 'prix') return (a.price || 0) - (b.price || 0);
    if (sort === 'auteur') return (a.author || '').localeCompare(b.author || '');
    return (b.popularity || 0) - (a.popularity || 0);
  });
  const submit = () => {
    if (!form.title.trim()) return;
    onAdd({ ...form, price: Number(form.price) || 0, popularity: Math.floor(60 + Math.random() * 40) });
    setForm({ title: '', author: '', price: '' });
  };
  return (
    <div className="bordero-card p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="bordero-title text-xl" style={{ color: 'var(--bordeaux)' }}>Wishlist Bordero</h2>
        <select value={sort} onChange={e => setSort(e.target.value)} className="bordero-ui border px-2 py-2 text-sm" style={{ borderColor: 'var(--bordero-line-strong)', background: 'var(--bordero-surface-strong)', color: 'var(--encre)', borderRadius: 'var(--bordero-radius-md)' }}>
          <option value="popularite">Popularité</option><option value="prix">Prix</option><option value="auteur">Auteur</option>
        </select>
      </div>
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titre" className="px-3 py-2 text-sm sm:col-span-2" />
        <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Auteur" className="px-3 py-2 text-sm" />
        <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Prix" type="number" className="px-3 py-2 text-sm" />
      </div>
      <button type="button" onClick={submit} className="bordero-action-primary mb-4 w-full py-3 text-xs">Ajouter à ma wishlist</button>
      <div className="space-y-2">
        {sorted.map(item => (
          <div key={item.id} className="bordero-surface flex items-center justify-between gap-3 p-3">
            <div><div className="text-sm font-bold" style={{ color: 'var(--encre)' }}>{item.title}</div><div className="text-xs" style={{ color: 'var(--encre-douce)' }}>{item.author || 'Auteur inconnu'} · {formatMoney(item.price)}</div></div>
            <button type="button" onClick={() => onDelete(item)} className="flex min-h-[44px] min-w-[44px] items-center justify-center" style={{ color: '#6E1E2E' }}>♡</button>
          </div>
        ))}
      </div>
      {items.length > 0 && <button type="button" onClick={() => onImport(sorted)} className="bordero-action-secondary mt-4 w-full py-3 text-xs">Importer sur Bordero</button>}
    </div>
  );
}
