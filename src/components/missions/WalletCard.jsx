import React from 'react';

export default function WalletCard({ soldeDisponible, gainsPrevisionnels, virementSuspendu, hideTransfer }) {
  const MIN_VIREMENT = 20;
  const peutVirer = soldeDisponible >= MIN_VIREMENT && !virementSuspendu;
  const manque = Math.max(0, MIN_VIREMENT - soldeDisponible).toFixed(2);

  return (
    <section className="relative mb-5 overflow-hidden bordero-card-premium bg-[#3B2A23] p-5 text-[#F3E8D2]">
      <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 font-heading text-8xl text-[#F3E8D2]/5">€</span>
      <div className="relative">
        <div className="font-ui text-[9px] font-extrabold uppercase tracking-[0.24em] text-[#C7A15A]/80">Portefeuille Voyageur</div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="border border-[#F3E8D2]/12 bg-[#F3E8D2]/6 p-3">
            <div className="font-ui text-[8px] uppercase tracking-[0.18em] text-[#F3E8D2]/55">Solde disponible</div>
            <div className="mt-1 font-heading text-3xl font-bold text-[#A8D5A2]">{soldeDisponible.toFixed(2)} €</div>
          </div>
          <div className="border border-[#F3E8D2]/12 bg-[#F3E8D2]/6 p-3">
            <div className="font-ui text-[8px] uppercase tracking-[0.18em] text-[#F3E8D2]/55">Gains prévisionnels</div>
            <div className="mt-1 font-heading text-3xl font-bold text-[#D7BB78]">{gainsPrevisionnels.toFixed(2)} €</div>
          </div>
        </div>
        {!hideTransfer && (
          <button
            disabled={!peutVirer}
            onClick={() => alert('Transfert bancaire initié !')}
            className="mt-4 min-h-[44px] w-full border px-4 font-ui text-[10px] font-extrabold uppercase tracking-[0.18em] disabled:cursor-not-allowed"
            style={{ background: peutVirer ? '#A8D5A2' : 'rgba(253,252,240,0.08)', color: peutVirer ? '#1E1A18' : 'rgba(253,252,240,0.38)', borderColor: peutVirer ? '#A8D5A2' : 'rgba(253,252,240,0.16)' }}
          >
            {virementSuspendu
              ? 'Virement suspendu (audit en cours)'
              : peutVirer
              ? 'Transférer vers ma banque'
              : `Encore ${manque} € pour débloquer votre virement`}
          </button>
        )}
      </div>
    </section>
  );
}