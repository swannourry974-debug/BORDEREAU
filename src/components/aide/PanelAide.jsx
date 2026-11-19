import React, { useState } from 'react';

const CONTENU = {
  lecteur: {
    titre: 'Lecteurs',
    emoji: '📖',
    intro: 'Commander un livre, choisir sa route et suivre son arrivée au relais.',
    guide: [
      { step: '01', titre: 'Trouvez votre livre', desc: 'Parcourez le catalogue, scannez un ISBN ou recherchez par titre.' },
      { step: '02', titre: 'Choisissez votre mode', desc: 'Sélectionnez la destination, le relais et le mode Express ou Collecte.' },
      { step: '03', titre: 'Suivez votre livre', desc: 'Dans l’Étagère, le statut indique les étapes de la commande jusqu’à la remise.' },
    ],
    faq: [
      { q: 'Combien de temps dure la livraison ?', r: 'Le délai dépend du mode et de la destination : Express suit le trajet voyageur, Collecte suit le regroupement.' },
      { q: 'Comment suivre ma commande ?', r: 'Ouvrez l’onglet Étagère. Chaque livre affiche son statut et les prochaines étapes.' },
      { q: 'Où récupérer mon livre ?', r: 'Le retrait se fait au point relais choisi au moment de la commande.' },
    ],
  },
  voyageur: {
    titre: 'Voyageurs',
    emoji: '✈️',
    intro: 'Déclarer un trajet, accepter des missions et valider le dépôt des livres.',
    guide: [
      { step: '01', titre: 'Déclarez votre vol', desc: 'Indiquez votre ville de départ, votre destination et votre date de voyage.' },
      { step: '02', titre: 'Acceptez des missions', desc: 'Choisissez les livres compatibles avec votre trajet, dans la limite autorisée.' },
      { step: '03', titre: 'Validez les preuves', desc: 'Scannez les livres, gardez les justificatifs et déposez au relais partenaire.' },
    ],
    faq: [
      { q: 'Quel est le maximum de livres par trajet ?', r: 'Vous pouvez transporter jusqu’à 10 livres par voyage.' },
      { q: 'Comment recevoir mes gains ?', r: 'Votre portefeuille indique les gains disponibles et les conditions de demande de virement.' },
      { q: 'Que faire si je ne trouve pas un livre ?', r: 'Annulez la mission depuis l’application avant de confirmer l’achat.' },
    ],
  },
  relais: {
    titre: 'Points relais',
    emoji: '🏪',
    intro: 'Recevoir, stocker et remettre les livres avec validation à chaque passage.',
    guide: [
      { step: '01', titre: 'Réceptionnez le livre', desc: 'Le voyageur présente le bordero. Vous validez l’arrivée dans l’application.' },
      { step: '02', titre: 'Gardez le stock lisible', desc: 'Le livre reste associé à sa commande et au relais choisi.' },
      { step: '03', titre: 'Remettez au lecteur', desc: 'Le lecteur présente son code. Vous confirmez la remise finale.' },
    ],
    faq: [
      { q: 'Quand mon accès relais s’ouvre-t-il ?', r: 'Après validation administrateur, les outils de stock, scanner et profils relais deviennent accessibles.' },
      { q: 'Comment signaler un problème ?', r: 'Utilisez le panneau prévu dans l’espace relais ou contactez l’équipe Bordero depuis les canaux existants.' },
      { q: 'Comment mettre à jour mes horaires ?', r: 'Demandez la mise à jour de votre fiche relais pour conserver des informations fiables.' },
    ],
  },
};

function FAQ({ items }) {
  const [open, setOpen] = useState(null);
  return items.map((item, i) => (
    <div key={item.q} className="border-b border-dashed border-bordeaux/15 last:border-b-0">
      <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 bg-transparent py-4 text-left">
        <span className="font-ui text-sm font-bold text-encre">{item.q}</span>
        <span className="text-xl text-bordeaux">{open === i ? '−' : '+'}</span>
      </button>
      {open === i && <p className="pb-4 font-body text-lg leading-7 text-encre/70">{item.r}</p>}
    </div>
  ));
}

export default function PanelAide({ role = 'lecteur' }) {
  const roleKey = role === 'voyageur' ? 'voyageur' : role === 'relais' ? 'relais' : 'lecteur';
  const [activeRole, setActiveRole] = useState(roleKey);
  const content = CONTENU[activeRole];

  return (
    <div className="space-y-5">
      <header className="bordero-card-premium overflow-hidden p-6">
        <p className="bordero-heading-section">Centre d’aide</p>
        <h1 className="mt-3 font-heading text-4xl text-bordeaux">Guide des routes Bordero</h1>
        <p className="mt-3 font-body text-xl leading-8 text-encre/70">Retrouvez les réponses par profil : lecteur, voyageur ou point relais.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {Object.entries(CONTENU).map(([key, item]) => (
          <button key={key} onClick={() => setActiveRole(key)} className={`bordero-surface p-4 text-left transition-all ${activeRole === key ? 'ring-2 ring-sepia' : ''}`}>
            <div className="text-3xl">{item.emoji}</div>
            <div className="mt-3 font-ui text-xs font-extrabold uppercase tracking-[0.18em] text-bordeaux">{item.titre}</div>
            <p className="mt-2 font-body text-base leading-6 text-encre/65">{item.intro}</p>
          </button>
        ))}
      </div>

      <section className="bordero-card-premium p-5">
        <div className="mb-5 flex items-center gap-3">
          <span className="text-4xl">{content.emoji}</span>
          <div>
            <p className="font-ui text-[11px] font-extrabold uppercase tracking-[0.22em] text-cta">{content.titre}</p>
            <h2 className="font-heading text-3xl text-bordeaux">Étapes essentielles</h2>
          </div>
        </div>
        <div className="grid gap-3">
          {content.guide.map(({ step, titre, desc }) => (
            <div key={step} className="bordero-surface flex gap-4 p-4">
              <div className="font-ui text-xl font-extrabold text-bordeaux/40">{step}</div>
              <div>
                <h3 className="font-ui text-xs font-extrabold uppercase tracking-[0.18em] text-bordeaux">{titre}</h3>
                <p className="mt-1 font-body text-lg leading-7 text-encre/70">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bordero-surface p-5">
        <h2 className="font-heading text-3xl text-bordeaux">Questions fréquentes</h2>
        <div className="mt-3"><FAQ items={content.faq} /></div>
      </section>
    </div>
  );
}