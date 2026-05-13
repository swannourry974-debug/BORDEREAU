import React, { useState } from 'react';

const CONTENU = {
  lecteur: {
    titre: 'Aide Lecteur',
    emoji: '📖',
    guide: [
      { step: '01', titre: 'Trouvez votre livre', desc: 'Parcourez le catalogue et scannez le code-barres ISBN ou recherchez par titre.' },
      { step: '02', titre: 'Choisissez votre forfait', desc: 'Sélectionnez le type de livre (Poche, Broché, BD…) et le mode de livraison.' },
      { step: '03', titre: 'Payez en ligne', desc: 'Le paiement sécurisé est effectué via Stripe. Vous recevez une confirmation.' },
      { step: '04', titre: 'Suivez votre livre', desc: 'Dans l\'Étagère, suivez l\'état en temps réel : payé → en transit → au relais → livré.' },
      { step: '05', titre: 'Retirez au relais', desc: 'Présentez votre bordereau au point relais pour récupérer votre livre.' },
    ],
    faq: [
      { q: 'Combien de temps dure la livraison ?', r: 'En mode Express : 2 à 5 jours selon la destination. En mode Collectif : 7 à 21 jours.' },
      { q: 'Puis-je changer mon point relais ?', r: 'Non, le point relais est fixé à la commande. Contactez le support si nécessaire.' },
      { q: 'Comment suivre ma commande ?', r: 'Dans l\'onglet "Étagère", chaque livre affiche son statut en temps réel.' },
      { q: 'Que faire si mon livre n\'arrive pas ?', r: 'Passé la date limite, signalez un litige depuis votre étagère ou contactez le support.' },
    ],
  },
  voyageur: {
    titre: 'Aide Voyageur',
    emoji: '✈️',
    guide: [
      { step: '01', titre: 'Déclarez votre vol', desc: 'Renseignez votre trajet (ville départ → arrivée) et la date de votre vol.' },
      { step: '02', titre: 'Acceptez des missions', desc: 'Consultez les missions disponibles sur votre trajet et acceptez celles qui vous conviennent (max 10 livres).' },
      { step: '03', titre: 'Achetez les livres', desc: 'Achetez chaque livre en librairie et conservez le ticket de caisse.' },
      { step: '04', titre: 'Validez avec l\'app', desc: 'Scannez le code-barres ISBN du livre et prenez en photo le ticket de caisse.' },
      { step: '05', titre: 'Déposez au relais', desc: 'À destination, déposez les livres au point relais partenaire. Scannez le bordereau.' },
      { step: '06', titre: 'Recevez votre commission', desc: 'Une fois validé, votre commission est créditée sur votre portefeuille.' },
    ],
    faq: [
      { q: 'Quel est le maximum de livres par trajet ?', r: 'Vous pouvez transporter jusqu\'à 10 livres par voyage.' },
      { q: 'Comment recevoir mes gains ?', r: 'Dans votre Portefeuille, demandez un virement quand vous atteignez 20 €.' },
      { q: 'Que faire si je ne trouve pas le livre ?', r: 'Annulez la mission depuis l\'application. La pénalité ne s\'applique que si vous avez déjà confirmé l\'achat.' },
      { q: 'L\'achat est-il remboursé en cas de rejet ?', r: 'Si votre ticket est validé par notre équipe, le remboursement est inclus dans la commission.' },
    ],
  },
  relais: {
    titre: 'Aide Point Relais',
    emoji: '⬡',
    guide: [
      { step: '01', titre: 'Réception d\'un colis', desc: 'Quand un voyageur arrive, il scanne son bordereau sur l\'app. Vous validez la réception.' },
      { step: '02', titre: 'Stockage', desc: 'Rangez le livre à l\'emplacement indiqué et notez la référence.' },
      { step: '03', titre: 'Notification lecteur', desc: 'Le lecteur est automatiquement notifié par email que son livre est disponible.' },
      { step: '04', titre: 'Remise au lecteur', desc: 'Le lecteur présente son bordereau (QR code). Scannez-le et confirmez la remise.' },
      { step: '05', titre: 'Commission', desc: 'Votre commission est versée mensuellement selon le nombre de livres traités.' },
    ],
    faq: [
      { q: 'Comment signaler un problème avec un colis ?', r: 'Utilisez le panneau de signalement dans l\'application ou contactez directement le support.' },
      { q: 'Combien de temps garder un livre non retiré ?', r: 'La date limite est indiquée sur chaque commande. Maximum 30 jours sauf accord.' },
      { q: 'Comment mettre à jour mes horaires ?', r: 'Contactez le support Bordereau pour mettre à jour vos informations de relais.' },
      { q: 'Comment calculer ma commission ?', r: 'Chaque livre géré vous rapporte une part fixe définie dans les tarifs de votre zone.' },
    ],
  },
};

function FAQ({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ borderBottom: '1px dashed rgba(26,16,8,0.15)' }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: '100%', textAlign: 'left', background: 'none', border: 'none',
              padding: '14px 0', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}
          >
            <span className="font-special" style={{ fontSize: 11, letterSpacing: 1, color: 'var(--encre)' }}>{item.q}</span>
            <span style={{ color: 'var(--bordeaux)', fontSize: 14, flexShrink: 0, transition: 'transform 0.2s', transform: open === i ? 'rotate(90deg)' : 'none' }}>›</span>
          </button>
          {open === i && (
            <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.65)', paddingBottom: 14, lineHeight: 1.6 }}>
              {item.r}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PanelAide({ role = 'lecteur' }) {
  const [tab, setTab] = useState('guide');

  const roleKey = role === 'voyageur' ? 'voyageur' : role === 'relais' ? 'relais' : 'lecteur';
  const content = CONTENU[roleKey];

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'var(--bordeaux)', color: 'var(--creme)',
        padding: '18px 20px', marginBottom: 20, position: 'relative', overflow: 'hidden',
      }}>
        <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 60, opacity: 0.1 }}>?</span>
        <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.7, marginBottom: 6, fontFamily: 'Special Elite, monospace' }}>
          Centre d'aide
        </div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
          {content.emoji} {content.titre}
        </div>
        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, opacity: 0.75, marginTop: 6 }}>
          Guide & FAQ
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: 24, border: '1.5px solid var(--bordeaux)' }}>
        {[{ id: 'guide', label: '📋 Guide étape par étape' }, { id: 'faq', label: '❓ FAQ' }].map((t, i) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '12px 8px',
            background: tab === t.id ? 'var(--bordeaux)' : 'var(--papier)',
            color: tab === t.id ? 'var(--creme)' : 'var(--bordeaux)',
            border: 'none', borderRight: i === 0 ? '1.5px solid var(--bordeaux)' : 'none',
            fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 2,
            textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'guide' && (
        <div>
          {content.guide.map(({ step, titre, desc }) => (
            <div key={step} style={{
              display: 'flex', gap: 16, marginBottom: 16,
              background: 'var(--papier)', border: '1px solid rgba(26,16,8,0.12)',
              padding: '14px 16px', borderLeft: '3px solid var(--bordeaux)',
            }}>
              <div style={{
                fontFamily: 'Special Elite, monospace', fontSize: 18, fontWeight: 700,
                color: 'var(--bordeaux)', opacity: 0.4, minWidth: 32, lineHeight: 1,
              }}>{step}</div>
              <div>
                <div className="font-special" style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4, color: 'var(--encre)' }}>{titre}</div>
                <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.65)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'faq' && (
        <div style={{ background: 'var(--papier)', border: '1px solid rgba(26,16,8,0.12)', padding: '0 16px' }}>
          <FAQ items={content.faq} />
        </div>
      )}

      {/* Contact */}
      <div style={{
        marginTop: 24, background: 'rgba(128,0,32,0.04)',
        border: '1.5px dashed rgba(128,0,32,0.3)', padding: 18, textAlign: 'center',
      }}>
        <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.6)', marginBottom: 8 }}>
          Vous n'avez pas trouvé votre réponse ?
        </div>
        <a
          href="mailto:support@bordereau.app"
          style={{
            fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 2,
            textTransform: 'uppercase', color: 'var(--bordeaux)', textDecoration: 'none',
          }}
        >
          ✦ Contacter le support
        </a>
      </div>
    </div>
  );
}