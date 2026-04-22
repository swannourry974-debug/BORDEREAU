import React from 'react';
import { base44 } from '@/api/base44Client';

export default function LandingVoyageur() {
  const handleConnect = () => {
    base44.auth.redirectToLogin(window.location.origin + '/?role=voyageur');
  };

  return (
    <div style={{ background: 'var(--creme)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', position: 'relative', overflow: 'hidden' }}>
      {/* Grain overlay */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")", opacity: 0.3 }} />

      <div style={{ fontSize: 64, opacity: 0.1, position: 'absolute', top: 40, right: 30, transform: 'rotate(8deg)' }}>✈️</div>
      <div style={{ fontSize: 48, opacity: 0.07, position: 'absolute', bottom: 60, left: 20, transform: 'rotate(-12deg)' }}>◈</div>

      <div style={{ maxWidth: 400, width: '100%', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="font-special" style={{ fontSize: 11, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 12, opacity: 0.8 }}>
            BORDEREAU
          </div>
          <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.45)', letterSpacing: 2, marginBottom: 28 }}>
            Manifeste des livres voyageurs
          </div>

          {/* Role badge */}
          <div style={{
            display: 'inline-block',
            background: 'var(--encre)',
            color: 'var(--creme)',
            fontFamily: 'Special Elite, monospace',
            fontSize: 10,
            letterSpacing: 4,
            textTransform: 'uppercase',
            padding: '6px 18px',
            marginBottom: 24,
          }}>
            ✈ ESPACE VOYAGEUR
          </div>

          <div className="font-playfair" style={{ fontSize: 30, fontWeight: 700, color: 'var(--encre)', lineHeight: 1.2, marginBottom: 16 }}>
            Voyagez.<br />
            <span style={{ fontStyle: 'italic', color: 'var(--bordeaux)' }}>Soyez rémunéré.</span>
          </div>

          <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 14, color: 'rgba(26,16,8,0.6)', lineHeight: 1.7 }}>
            Transportez des livres dans votre valise lors de vos voyages et gagnez des commissions. Jusqu'à <strong>8 € par livre</strong>, 10 livres max par trajet.
          </div>
        </div>

        {/* Commission tiers */}
        <div style={{ background: 'var(--papier)', border: '1.5px solid var(--encre)', padding: 20, marginBottom: 36, boxShadow: '3px 3px 0 rgba(26,16,8,0.10)' }}>
          <div className="font-special" style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(26,16,8,0.5)', marginBottom: 14 }}>
            Barème de gratification
          </div>
          {[
            { rang: '1er livre', montant: '5,00 €' },
            { rang: '2e livre', montant: '6,50 €' },
            { rang: 'À partir du 3e', montant: '8,00 €' },
          ].map(({ rang, montant }) => (
            <div key={rang} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0',
              borderBottom: '1px dashed rgba(26,16,8,0.15)',
            }}>
              <span className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.7)' }}>{rang}</span>
              <span className="font-playfair" style={{ fontSize: 18, fontWeight: 700, color: 'var(--bordeaux)' }}>{montant}</span>
            </div>
          ))}
          <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.4)', marginTop: 10, textAlign: 'center' }}>
            Jusqu'à 75,50 € par trajet · Virement dès 20 €
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleConnect}
          style={{
            width: '100%',
            background: 'var(--encre)',
            color: 'var(--creme)',
            border: 'none',
            padding: '18px 24px',
            fontFamily: 'Special Elite, monospace',
            fontSize: 12,
            letterSpacing: 4,
            textTransform: 'uppercase',
            cursor: 'pointer',
            position: 'relative',
            outline: '2px dashed rgba(26,16,8,0.4)',
            outlineOffset: 3,
            transition: 'all 0.15s',
          }}
        >
          Devenir Voyageur →
        </button>

        <div className="font-fell" style={{ textAlign: 'center', marginTop: 16, fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.4)' }}>
          Vous êtes un lecteur ou un relais ?{' '}
          <a href="/landing-lecteur" style={{ color: 'var(--bordeaux)', textDecoration: 'underline' }}>Lecteur</a>{' '}·{' '}
          <a href="/landing-relais" style={{ color: 'var(--bordeaux)', textDecoration: 'underline' }}>Relais</a>
        </div>
      </div>
    </div>
  );
}