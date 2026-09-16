import React, { useState, useEffect } from 'react';
import { SectionTitle, BtnCoupon } from './shared';
import { base44 } from '@/api/base44Client';

const FORFAITS = [
  { id: 'poche', name: 'Poche', price: '8,90', desc: '< 300g · roman' },
  { id: 'broche', name: 'Broché', price: '14,90', desc: '300g–800g' },
  { id: 'bd', name: 'BD', price: '12,90', desc: 'Bandes dessinées' },
  { id: 'beau', name: 'Beau Livre', price: '24,90', desc: '> 800g · illustré' },
];

export default function CommandeForm({ book, onClose }) {
  const [selectedForfait, setSelectedForfait] = useState('poche');
  const [selectedTransit, setSelectedTransit] = useState('express');
  const [loading, setLoading] = useState(false);
  const [adresse, setAdresse] = useState('');
  const [jaugeWidth, setJaugeWidth] = useState(0);

  useEffect(() => {
    setTimeout(() => setJaugeWidth(63), 300);
  }, []);

  const currentForfait = FORFAITS.find(f => f.id === selectedForfait);
  const total = currentForfait ? currentForfait.price + '€' : '—';

  const confirmer = async () => {
    if (window.self !== window.top) {
      alert('⚠️ Le paiement ne fonctionne que depuis l\'application publiée, pas depuis la prévisualisation.');
      return;
    }
    if (!adresse.trim()) {
      alert('Veuillez renseigner une adresse de livraison.');
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke('createCheckout', {
        book,
        forfait: selectedForfait,
        transit: selectedTransit,
        adresse,
        zone_id: book?.zone_id || null,
        zone_nom: book?.zone_nom || adresse,
        mode_livraison: selectedTransit,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        const msg = res.data?.error || 'Erreur lors de la création du paiement.';
        alert('❌ ' + msg);
      }
    } catch (e) {
      alert('❌ Erreur réseau : ' + (e?.message || 'réessayez plus tard.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'var(--papier)',
      border: '2px solid var(--encre)',
      padding: 20,
      boxShadow: '5px 5px 0 rgba(26,16,8,0.2)',
      marginBottom: 20,
      position: 'relative',
      animation: 'fadeSlideIn 0.3s ease',
    }}>
      {/* Title */}
      <div className="font-playfair" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="font-special" style={{ fontSize: 12, letterSpacing: 2, color: 'rgba(26,16,8,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>Commander</div>
          <div style={{ fontSize: 16 }}>{book.title}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--bordeaux)', lineHeight: 1 }}>✕</button>
      </div>

      {/* Forfait */}
      <SectionTitle>Forfait</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {FORFAITS.map(f => (
          <div
            key={f.id}
            onClick={() => setSelectedForfait(f.id)}
            style={{
              background: 'var(--papier)',
              border: `1.5px solid ${selectedForfait === f.id ? 'var(--bordeaux)' : 'rgba(26,16,8,0.25)'}`,
              padding: '14px 12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
              textAlign: 'center',
              boxShadow: selectedForfait === f.id ? '3px 3px 0 var(--bordeaux)' : 'none',
              background: selectedForfait === f.id ? 'rgba(128,0,32,0.04)' : 'var(--papier)',
            }}
          >
            {selectedForfait === f.id && (
              <span style={{ position: 'absolute', top: 6, right: 8, color: 'var(--bordeaux)', fontSize: 12 }}>✓</span>
            )}
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--encre)', marginBottom: 4 }}>{f.name}</div>
            <div className="font-playfair" style={{ fontSize: 22, fontWeight: 700, color: 'var(--bordeaux)', lineHeight: 1, marginBottom: 3 }}>{f.price}€</div>
            <div style={{ fontSize: 10, color: 'rgba(26,16,8,0.5)', letterSpacing: 0.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Transit */}
      <SectionTitle>Mode de transit</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {[
          { id: 'express', icon: '✈️', name: 'Express · Individuel', detail: 'Prochain vol disponible · 5–10 jours', badge: '+0€', badgeType: 'express' },
          { id: 'collecte', icon: '📦', name: 'Collecte · Carton 20kg', detail: 'Rempli à 63% · 5 livres manquants', badge: '-2€', badgeType: 'collecte' },
        ].map(t => (
          <div
            key={t.id}
            onClick={() => setSelectedTransit(t.id)}
            style={{
              background: selectedTransit === t.id ? 'rgba(128,0,32,0.03)' : 'var(--papier)',
              border: selectedTransit === t.id ? '1.5px solid var(--bordeaux)' : '1.5px dashed rgba(26,16,8,0.3)',
              padding: '14px 16px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <span style={{ fontSize: 28 }}>{t.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>{t.name}</div>
              <div className="font-fell" style={{ fontSize: 11, color: 'rgba(26,16,8,0.55)', fontStyle: 'italic' }}>{t.detail}</div>
            </div>
            <span style={{
              fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', padding: '3px 8px',
              border: '1px dashed',
              borderColor: t.badgeType === 'express' ? '#8B6914' : 'var(--bordeaux)',
              color: t.badgeType === 'express' ? '#8B6914' : 'var(--bordeaux)',
            }}>{t.badge}</span>
          </div>
        ))}
      </div>

      {/* Jauge */}
      <div style={{ background: 'var(--papier)', border: '1.5px solid var(--encre)', padding: 16, marginBottom: 20, boxShadow: '2px 2px 0 rgba(26,16,8,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>Jauge carton Miami</div>
            <div style={{ fontSize: 10, color: 'rgba(26,16,8,0.4)', marginTop: 2, fontStyle: 'italic' }}>Départ estimé : 3 mai 2026</div>
          </div>
          <div className="font-playfair" style={{ fontSize: 18, fontWeight: 700, color: 'var(--bordeaux)' }}>12,6 kg</div>
        </div>
        <div style={{ height: 24, background: 'var(--creme)', border: '1px solid rgba(26,16,8,0.3)', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'repeating-linear-gradient(45deg, var(--bordeaux) 0px, var(--bordeaux) 6px, rgba(128,0,32,0.6) 6px, rgba(128,0,32,0.6) 12px)',
            width: jaugeWidth + '%',
            transition: 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: 'rgba(26,16,8,0.4)', letterSpacing: 1 }}>
          <span>0 kg</span>
          <span>63% rempli · 7,4 kg restants</span>
          <span>20 kg</span>
        </div>
      </div>

      {/* Address */}
      <div style={{ marginBottom: 14 }}>
        <label className="font-special" style={{ display: 'block', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(26,16,8,0.55)', marginBottom: 5 }}>
          Adresse de livraison
        </label>
        <input
          className="font-special"
          placeholder="Point relais Miami..."
          value={adresse}
          onChange={e => setAdresse(e.target.value)}
          style={{
            width: '100%', background: 'var(--creme)', border: '1px solid rgba(26,16,8,0.35)',
            padding: '9px 12px', fontSize: 13, color: 'var(--encre)', outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--bordeaux)'}
          onBlur={e => e.target.style.borderColor = 'rgba(26,16,8,0.35)'}
        />
      </div>

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px dashed rgba(26,16,8,0.3)', paddingTop: 14, marginTop: 14 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>Total séquestre</div>
          <div style={{ fontSize: 9, color: 'rgba(26,16,8,0.4)', marginTop: 2, fontStyle: 'italic' }}>Libéré à la réception</div>
        </div>
        <div className="font-playfair" style={{ fontSize: 28, fontWeight: 700, color: 'var(--bordeaux)' }}>{total}</div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
        <BtnCoupon onClick={confirmer} disabled={loading} style={{ flex: 1, padding: 12 }}>
          {loading ? '⟳ Traitement...' : '✦ Confirmer & Payer'}
        </BtnCoupon>
        <BtnCoupon secondary onClick={onClose}>Annuler</BtnCoupon>
      </div>
    </div>
  );
}