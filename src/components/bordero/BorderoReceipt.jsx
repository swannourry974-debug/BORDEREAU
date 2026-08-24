import React from 'react';
import BorderoButton from './BorderoButton';

export default function BorderoReceipt({ title, date, total, children }) {
  return (
    <div className="rounded-[16px] border p-5 text-center" style={{ background: 'var(--bordeaux-dark)', borderColor: 'rgba(200,161,101,0.46)', color: 'var(--creme)' }}>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border text-3xl" style={{ borderColor: 'var(--or-clair)', color: 'var(--or-clair)' }}>✓</div>
      <h3 className="bordero-title text-xl">{title}</h3>
      <p className="bordero-body mt-1 text-sm opacity-70">{date}</p>
      <div className="my-4 border-y py-4 text-left" style={{ borderColor: 'rgba(200,161,101,0.28)' }}>{children}</div>
      <div className="mb-4 flex justify-between font-semibold"><span>Total</span><span>{total}</span></div>
      <BorderoButton className="w-full" onClick={() => window.print()}>Télécharger le reçu PDF</BorderoButton>
    </div>
  );
}