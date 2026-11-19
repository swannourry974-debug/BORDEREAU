import React, { useState } from 'react';
import { formatMoney, LIBRARY_COLORS } from './libraryUtils';

export default function WishlistPanel({ items, onAdd, onDelete, onImport }) {
  const [sort, setSort] = useState('recent');
  const [form, setForm] = useState({ title: '', author: '', price: '' });
  const sorted = [...items].sort((a, b) => {
    if (sort === 'prix') return (a.price || 0) - (b.price || 0);
    if (sort === 'auteur') return (a.author || '').localeCompare(b.author || '');
    return String(b.created_date || '').localeCompare(String(a.created_date || ''));
  });
  const submit = () => {
    if (!form.title.trim()) return;
    onAdd({ title: form.title.trim(), author: form.author.trim(), price: Number(form.price) || 0 });
    setForm({ title: '', author: '', price: '' });
  };
  return (
    <section className="overflow-hidden border" style={{ background: 'linear-gradient(145deg, #FFF8EA, #F7EEDC)', borderColor: 'rgba(110,30,46,0.18)' }}>
      <div className="border-b p-5" style={{ borderColor: 'rgba(110,30,46,0.14)' }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-ui text-[10px] font-extrabold uppercase tracking-[0.24em]" style={{ color: LIBRARY_COLORS.wine }}>Carnet d’envies</div>
            <h2 className="mt-1 font-heading text-3xl font-bold leading-tight" style={{ color: LIBRARY_COLORS.wine }}>Wishlist Bordero</h2>
            <p className="mt-1 font-body text-[15px] italic text-[#3B2A23]/62">Notez les prochains titres à faire voyager.</p>
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)} className="border px-3 py-3 font-ui text-xs font-bold uppercase tracking-[0.12em]" style={{ background: '#FFF8EA', borderColor: 'rgba(110,30,46,0.24)', color: LIBRARY_COLORS.leather }}>
            <option value="recent">Récent</option>
            <option value="prix">Prix</option>
            <option value="auteur">Auteur</option>
          </select>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-4">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titre" className="border px-3 py-3 font-ui text-sm sm:col-span-2" style={{ background: '#fff', borderColor: 'rgba(110,30,46,0.2)', color: '#374151' }} />
          <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Auteur" className="border px-3 py-3 font-ui text-sm" style={{ background: '#fff', borderColor: 'rgba(110,30,46,0.2)', color: '#374151' }} />
          <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Prix" type="number" className="border px-3 py-3 font-ui text-sm" style={{ background: '#fff', borderColor: 'rgba(110,30,46,0.2)', color: '#374151' }} />
        </div>
        <button type="button" onClick={submit} className="mt-3 w-full py-3 font-ui text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ background: LIBRARY_COLORS.orange, color: '#FDFCF0' }}>Ajouter à ma wishlist</button>
      </div>
      {sorted.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-4xl">♡</div>
          <div className="mt-3 font-heading text-xl font-bold" style={{ color: LIBRARY_COLORS.wine }}>Aucune envie enregistrée</div>
          <p className="mx-auto mt-2 max-w-xs font-body text-[15px] italic text-[#3B2A23]/58">Ajoutez un titre pour préparer votre prochaine commande.</p>
        </div>
      ) : (
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {sorted.map(item => (
            <article key={item.id} className="flex items-stretch overflow-hidden border" style={{ background: '#FFF8EA', borderColor: 'rgba(110,30,46,0.14)' }}>
              <div className="flex w-16 shrink-0 items-center justify-center" style={{ background: LIBRARY_COLORS.wine, color: LIBRARY_COLORS.cream }}>
                <span className="font-heading text-2xl">B</span>
              </div>
              <div className="min-w-0 flex-1 p-3">
                <div className="font-heading text-[17px] font-bold leading-tight text-[#6E1E2E] line-clamp-2">{item.title}</div>
                <div className="mt-1 font-body text-[13px] italic text-[#3B2A23]/65 line-clamp-1">{item.author || 'Auteur inconnu'}</div>
                <div className="mt-3 font-ui text-[10px] font-bold uppercase tracking-[0.14em] text-[#3B2A23]/50">{formatMoney(item.price)}</div>
              </div>
              <button type="button" onClick={() => onDelete(item)} className="min-h-[44px] w-12 border-l font-ui text-lg font-bold" style={{ borderColor: 'rgba(110,30,46,0.14)', color: LIBRARY_COLORS.wine }} aria-label={`Retirer ${item.title} de la wishlist`}>×</button>
            </article>
          ))}
        </div>
      )}
      {items.length > 0 && <button type="button" onClick={() => onImport(sorted)} className="m-4 mt-0 w-[calc(100%-2rem)] py-3 font-ui text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ background: LIBRARY_COLORS.wine, color: LIBRARY_COLORS.cream }}>Importer sur Bordero</button>}
    </section>
  );
}