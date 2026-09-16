import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const errorVisual = 'https://media.base44.com/images/public/69e8b7d9fb460a4f0f638f97/b74f298b0_ChatGPTImage16sept202611_39_57.png';

export default function PageNotFound() {
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#0f2237] text-[#F8F1E7]"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(9,19,31,0.18), rgba(9,19,31,0.36)), url(${errorVisual})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/25" />

      <section className="relative z-10 min-h-screen px-6 py-8 sm:px-10 flex flex-col items-center">
        <div className="text-center pt-3 sm:pt-6">
          <div className="mx-auto mb-2 h-9 w-20 text-[#F8F1E7]">
            <svg viewBox="0 0 120 58" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M57 45C43 35 27 32 8 35C14 20 27 12 56 22C57 29 57 37 57 45Z" fill="currentColor" />
              <path d="M63 45C77 35 93 32 112 35C106 20 93 12 64 22C63 29 63 37 63 45Z" fill="currentColor" />
              <path d="M60 47V18" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="font-ui text-4xl sm:text-5xl font-extrabold tracking-[0.12em] leading-none">BORDERO</p>
          <p className="font-ui mt-3 text-xs sm:text-sm tracking-[0.45em] uppercase text-[#F8F1E7]/90">Explorer · Découvrir · Partager</p>
        </div>

        <div className="flex-1 w-full max-w-6xl mx-auto grid lg:grid-cols-[1fr_0.95fr] items-center">
          <div className="hidden lg:block" />
          <div className="text-center lg:text-left mt-16 lg:mt-0 lg:pl-6">
            <h1 className="font-heading text-[8rem] sm:text-[12rem] lg:text-[13rem] leading-[0.76] text-[#F8F1E7] drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
              404
            </h1>
            <h2 className="font-body mt-8 text-4xl sm:text-5xl text-[#F8F1E7] drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)]">
              Page introuvable
            </h2>
            <div className="my-7 h-[3px] w-20 bg-[#D7BB78] mx-auto lg:mx-32 rounded-full" />
            <p className="font-body text-2xl sm:text-3xl leading-snug max-w-xl mx-auto lg:mx-0 text-[#F8F1E7]/95 drop-shadow-[0_3px_10px_rgba(0,0,0,0.4)]">
              Il semble que cette page se soit égarée quelque part entre deux aventures...
            </p>
            <Link
              to="/"
              className="font-ui mt-9 inline-flex items-center justify-center gap-5 rounded-full border-2 border-[#D7BB78] bg-[#0f2237]/92 px-9 py-4 text-lg font-bold text-[#F8F1E7] shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition-all duration-300 hover:bg-[#C2410C] hover:border-[#F3E8D2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D7BB78]"
            >
              Retour à l’accueil
              <ArrowRight className="h-6 w-6" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}