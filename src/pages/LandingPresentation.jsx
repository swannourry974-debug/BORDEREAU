import React from 'react';
import PresentationHero from '@/components/landing/PresentationHero';
import PresentationCards from '@/components/landing/PresentationCards';

export default function LandingPresentation() {
  return (
    <main className="min-h-screen bg-[#F5E6CC] text-[#800020]">
      <PresentationHero />
      <PresentationCards />
      <section className="mx-auto max-w-5xl px-5 pb-12 text-center sm:px-8">
        <div className="rounded-[22px] border border-dashed border-[#C8A165] bg-[#F5E6CC]/80 p-6">
          <p className="font-body text-xl italic text-[#5A0015]/75">
            Bordero relie la passion des livres, les trajets réels et la confiance locale dans une expérience simple et premium.
          </p>
        </div>
      </section>
    </main>
  );
}