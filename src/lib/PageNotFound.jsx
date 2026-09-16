import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Home, Search } from 'lucide-react';

const errorVisualUrl = 'https://media.base44.com/images/public/69e8b7d9fb460a4f0f638f97/32b86e285_ChatGPTImage16sept202611_37_16.png';

export default function PageNotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#071527] text-[#F3E8D2]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: `url(${errorVisualUrl})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#071527]/65 via-[#071527]/25 to-[#071527]/80" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#071527] via-transparent to-[#071527]/30" aria-hidden="true" />

      <section className="relative z-10 min-h-screen px-5 py-8 sm:px-10 lg:px-14 flex flex-col">
        <header className="flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-3 rounded-full bg-[#071527]/75 px-5 py-3 border border-[#C7A15A]/35 shadow-2xl backdrop-blur-sm">
            <BookOpen className="h-6 w-6 text-[#F3E8D2]" />
            <span className="font-heading text-2xl sm:text-3xl tracking-[0.16em] text-[#F3E8D2]">BORDERO</span>
          </Link>
          <Link to="/" className="hidden sm:inline-flex items-center gap-2 font-body text-lg text-[#F3E8D2] hover:text-[#D7BB78]">
            <Home className="h-5 w-5" /> Retour à l’accueil <ArrowRight className="h-5 w-5" />
          </Link>
        </header>

        <div className="flex-1 grid lg:grid-cols-[0.95fr_1.05fr] items-center gap-8 pt-12 pb-8">
          <div className="hidden lg:flex items-end min-h-[540px]">
            <div className="max-w-xs rotate-[-3deg] rounded-2xl bg-[#F3E8D2]/92 p-6 border border-[#C7A15A]/70 shadow-2xl text-center">
              <p className="font-body text-3xl italic leading-tight text-[#1E1A18]">Page introuvable</p>
              <p className="mt-3 font-body text-2xl italic text-[#6E1E2E]">Mais l’aventure continue !</p>
              <p className="mt-4 text-3xl">🐾</p>
            </div>
          </div>

          <div className="max-w-2xl justify-self-end text-center lg:text-left lg:pr-4">
            <p className="font-body text-xl sm:text-2xl italic text-[#F3E8D2]/90 rotate-[-4deg] inline-block mb-6">
              Parfois, on se trompe de page… mais chaque détour mène à une belle découverte.
            </p>
            <h1 className="font-heading text-[8rem] sm:text-[12rem] lg:text-[15rem] leading-none tracking-tight text-[#F3E8D2] drop-shadow-2xl">
              4<span className="inline-flex align-middle mx-1"><BookOpen className="h-20 w-20 sm:h-28 sm:w-28 lg:h-36 lg:w-36" /></span>4
            </h1>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-[#F3E8D2] mt-2">
              Oups ! Cette page s’est perdue en chemin…
            </h2>
            <p className="font-body text-xl sm:text-2xl text-[#F3E8D2]/90 max-w-xl mx-auto lg:mx-0 mt-5 leading-tight">
              Il semblerait que cette page n’existe pas ou qu’elle ait déjà pris un autre itinéraire. Mais pas d’inquiétude, de nombreuses belles histoires vous attendent ailleurs !
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/" className="inline-flex items-center justify-center gap-3 rounded-full bg-[#C2410C] px-8 py-4 font-ui text-sm font-bold uppercase tracking-[0.12em] text-[#FDFCF0] shadow-2xl hover:bg-[#9A3412]">
                <Home className="h-5 w-5" /> Retour à l’accueil <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/catalogue" className="inline-flex items-center justify-center gap-3 rounded-full border border-[#F3E8D2]/70 bg-[#071527]/45 px-7 py-4 font-ui text-sm font-semibold uppercase tracking-[0.1em] text-[#F3E8D2] backdrop-blur-sm hover:border-[#D7BB78] hover:text-[#D7BB78]">
                <Search className="h-5 w-5" /> Rechercher un livre
              </Link>
            </div>

            <p className="mt-8 font-body text-xl sm:text-2xl italic text-[#F3E8D2]/85">
              « Les plus belles découvertes naissent parfois des imprévus. »
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}