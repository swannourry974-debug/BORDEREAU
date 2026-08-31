import React from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function PresentationHero() {
  const login = () => base44.auth.redirectToLogin('/catalogue');

  return (
    <section className="relative overflow-hidden px-5 pb-10 pt-10 sm:px-8 sm:pt-16">
      <div className="mx-auto max-w-5xl rounded-[28px] border border-[#C8A165] bg-[#F5E6CC] p-6 shadow-2xl shadow-[#800020]/15 sm:p-10">
        <div className="grid items-center gap-8 md:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="font-ui text-xs font-bold uppercase tracking-[0.28em] text-[#C2410C]">Bordero</p>
            <h1 className="mt-4 font-heading text-4xl font-extrabold leading-tight text-[#800020] sm:text-6xl">
              Faites voyager les livres autrement.
            </h1>
            <p className="mt-5 font-body text-xl leading-8 text-[#5A0015]/80">
              Une bibliothèque vivante où les lecteurs commandent, les voyageurs transportent et les points relais sécurisent chaque remise.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={login} className="min-h-11 rounded-2xl bg-[#C2410C] px-6 py-3 font-ui text-sm font-bold uppercase tracking-[0.16em] text-[#FDFCF0] shadow-lg shadow-[#C2410C]/25">
                Se connecter
              </button>
              <Link to="/landing-lecteur" className="min-h-11 rounded-2xl border border-[#800020]/30 px-6 py-3 text-center font-ui text-sm font-bold uppercase tracking-[0.16em] text-[#800020]">
                Découvrir
              </Link>
            </div>
          </div>
          <div className="rounded-[28px] border border-[#800020]/20 bg-[#800020] p-5 text-[#F5E6CC] shadow-xl">
            <div className="rounded-2xl border border-[#C8A165]/50 bg-[#2E1111] p-5">
              <div className="font-heading text-3xl">▥ Bibliothèque Vivante</div>
              <div className="mt-5 space-y-3 font-ui text-sm text-[#F5E6CC]/80">
                <div className="rounded-xl bg-[#F5E6CC]/10 p-4">📚 Lecteurs : trouvez et suivez vos livres.</div>
                <div className="rounded-xl bg-[#F5E6CC]/10 p-4">✈️ Voyageurs : acceptez des missions rémunérées.</div>
                <div className="rounded-xl bg-[#F5E6CC]/10 p-4">📦 Relais : validez les dépôts et retraits.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}