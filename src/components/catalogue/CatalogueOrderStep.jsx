import React, { useState } from 'react';
import CouponButton from '@/components/shared/CouponButton';
import { useCart } from '@/lib/CartContext';
import { getComparativeSavings } from '@/lib/comparativeRates';

export default function CatalogueOrderStep({ selectedCity, selectedRelay, deliveryMode, onBack, onPay }) {
  const { items, total, removeItem } = useCart();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(['Bordero : Bonjour, nous suivons votre commande et vous préviendrons à chaque étape.']);
  const savings = items.reduce((sum, item) => {
    const comparative = item.comparative || getComparativeSavings(item.adresse, item.prixVal);
    return sum + comparative.savings;
  }, 0);

  return (
    <div className="space-y-4">
      <div className="bg-bordeaux text-creme p-4 shadow-[3px_3px_0_rgba(26,16,8,0.18)]">
        <div className="font-typewriter text-[9px] tracking-[3px] uppercase opacity-70 mb-2">Commande Bordero</div>
        <h2 className="font-serif text-[23px] font-bold leading-tight">Résumé, facture et suivi</h2>
        <p className="font-fell italic text-[12px] opacity-80 mt-2 leading-relaxed">
          {deliveryMode === 'express' ? 'Express' : 'Collectif malle'} · {selectedCity?.emoji} {selectedCity?.label} · {selectedRelay?.name}
        </p>
      </div>

      <div className="bg-papier border-[1.5px] border-encre p-4 shadow-[3px_3px_0_rgba(26,16,8,0.14)]">
        <div className="font-typewriter text-[10px] tracking-[2px] uppercase text-bordeaux mb-3">Résumé de la commande</div>
        {items.length === 0 ? (
          <div className="font-fell italic text-[13px] text-foreground/50 py-4 text-center">Ajoutez un livre depuis la page de recherche.</div>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const comparative = item.comparative || getComparativeSavings(item.adresse, item.prixVal);
              return (
                <div key={item.cartId} className="border border-encre/15 bg-creme p-3 flex gap-3 justify-between">
                  <div className="min-w-0">
                    <div className="font-serif text-[15px] font-bold text-encre break-words">{item.book.title}</div>
                    <div className="font-fell italic text-[12px] text-foreground/55">{item.book.author}</div>
                    <div className="font-typewriter text-[9px] tracking-[1px] uppercase text-foreground/45 mt-1">Forfait {item.forfait} · {item.transit === 'express' ? 'Express' : 'Collectif'}</div>
                    <div className="text-[11px] text-[#2d6a2d] mt-2">Gain colis : <strong>{comparative.savings.toFixed(0)} €</strong></div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-serif text-[17px] font-bold text-bordeaux">{item.prixVal.toFixed(2)} €</div>
                    <button onClick={() => removeItem(item.cartId)} className="bg-transparent border-none text-[9px] underline text-destructive mt-2">Retirer</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-papier border-[1.5px] border-encre/25 p-4">
          <div className="font-typewriter text-[10px] tracking-[2px] uppercase text-bordeaux mb-3">Facture</div>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between"><span>Sous-total livraison</span><strong>{total.toFixed(2)} €</strong></div>
            <div className="flex justify-between text-[#2d6a2d]"><span>Économies estimées</span><strong>{savings.toFixed(0)} €</strong></div>
            <div className="border-t border-dashed border-encre/25 pt-2 flex justify-between font-serif text-[20px] font-bold text-bordeaux"><span>Total</span><span>{total.toFixed(2)} €</span></div>
          </div>
        </div>

        <div className="bg-papier border-[1.5px] border-encre/25 p-4">
          <div className="font-typewriter text-[10px] tracking-[2px] uppercase text-bordeaux mb-3">Suivi de commande</div>
          {['Commande préparée', 'Achat du livre', 'Transit vers relais', 'Retrait lecteur'].map((step, index) => (
            <div key={step} className="flex gap-3 items-center mb-2 last:mb-0">
              <span className={`w-6 h-6 flex items-center justify-center text-[10px] rounded-full ${index === 0 ? 'bg-bordeaux text-creme' : 'bg-creme border border-encre/20 text-foreground/45'}`}>{index + 1}</span>
              <span className="font-fell italic text-[12px] text-foreground/70">{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-papier border-[1.5px] border-encre p-4">
        <div className="font-typewriter text-[10px] tracking-[2px] uppercase text-bordeaux mb-2">Messagerie lecteur ↔ Bordero</div>
        <div className="space-y-2 mb-3">
          {messages.map((msg, index) => (
            <div key={index} className="bg-creme border border-encre/15 p-3 font-fell italic text-[12px] text-foreground/60">{msg}</div>
          ))}
        </div>
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Écrire un message à Bordero..." className="w-full min-h-[86px] bg-creme border border-encre/25 p-3 text-[13px] outline-none focus:border-bordeaux" />
        <CouponButton secondary onClick={() => { if (!message.trim()) return; setMessages(prev => [...prev, `Lecteur : ${message.trim()}`]); setMessage(''); }} className="w-full mt-2">Envoyer le message</CouponButton>
      </div>

      <div className="flex gap-2">
        <CouponButton secondary onClick={onBack} className="flex-1">Retour recherche</CouponButton>
        <CouponButton onClick={onPay} disabled={items.length === 0} className="flex-1">Payer / finaliser</CouponButton>
      </div>
    </div>
  );
}