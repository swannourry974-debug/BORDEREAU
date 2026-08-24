import React, { useState } from 'react';
import { formatMoney, LIBRARY_COLORS } from './libraryUtils';

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
    <div className="border p-4" style={{ background: LIBRARY_COLORS.wine, borderColor: 'rgba(200,161,101,0.35)', color: LIBRARY_COLORS.cream }}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold">Wishlist Bordero</h2>
        <select value={sort} onChange={e => setSort(e.target.value)} className="bg-transparent border px-2 py-2 text-sm" style={{ borderColor: 'rgba(200,161,101,0.5)' }}>
          <option value="popularite">Popularité</option><option value="prix">Prix</option><option value="auteur">Auteur</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titre" className="px-3 py-2 text-sm text-[#800020] bg-[#F5E6CC] sm:col-span-2" />
        <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Auteur" className="px-3 py-2 text-sm text-[#800020] bg-[#F5E6CC]" />
        <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Prix" type="number" className="px-3 py-2 text-sm text-[#800020] bg-[#F5E6CC]" />
      </div>
      <button type="button" onClick={submit} className="w-full mb-4 py-3 font-bold" style={{ background: LIBRARY_COLORS.gold, color: LIBRARY_COLORS.wine }}>Ajouter à ma wishlist</button>
      <div className="space-y-2">
        {sorted.map(item => (
          <div key={item.id} className="flex items-center justify-between gap-3 border p-3" style={{ borderColor: 'rgba(200,161,101,0.25)' }}>
            <div><div className="font-bold text-sm">{item.title}</div><div className="text-xs opacity-65">{item.author || 'Auteur inconnu'} · {formatMoney(item.price)}</div></div>
            <button type="button" onClick={() => onDelete(item)} className="text-[#C8A165] min-w-[44px] min-h-[44px]">♡</button>
          </div>
        ))}
      </div>
      {items.length > 0 && <button type="button" onClick={() => onImport(sorted)} className="w-full mt-4 py-3 font-bold" style={{ background: LIBRARY_COLORS.cream, color: LIBRARY_COLORS.wine }}>Importer sur Bordero</button>}
    </div>
  );
}