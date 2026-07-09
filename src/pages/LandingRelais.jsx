import React from 'react';
import { base44 } from '@/api/base44Client';

export default function LandingRelais() {
  const handleConnect = () => {
    base44.auth.redirectToLogin(window.location.origin + '/?role=relais');
  };

  return (
    <div style={{ background: 'var(--creme)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', position: 'relative', overflow: 'hidden' }}>
      {/* Grain overlay */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")", opacity: 0.3 }} />

      <div style={{ fontSize: 64, opacity: 0.1, position: 'absolute', top: 40, right: 30, transform: 'rotate(-6deg)' }}>🏪</div>
      <div style={{ fontSize: 48, opacity: 0.07, position: 'absolute', bottom: 60, left: 20, transform: 'rotate(10deg)' }}>⬡</div>

      <div style={{ maxWidth: 400, width: '100%', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="font-special" style={{ fontSize: 11, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 12, opacity: 0.8 }}>
            BORDERO
          </div>
          <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.45)', letterSpacing: 2, marginBottom: 28 }}>
            Manifeste des livres voyageurs
          </div>

          {/* Role badge */}
          <div style={{
            display: 'inline-block',
            background: 'var(--sepia)',
            color: 'var(--creme)',
            fontFamily: 'Special Elite, monospace',
            fontSize: 10,
            letterSpacing: 4,
            textTransform: 'uppercase',
            padding: '6px 18px',
            marginBottom: 24,
          }}>
            🏪 ESPACE RELAIS
          </div>

          <div className="font-playfair" style={{ fontSize: 30, fontWeight: 700, color: 'var(--encre)', lineHeight: 1.2, marginBottom: 16 }}>
            Votre commerce,<br />
            <span style={{ fontStyle: 'italic', color: 'var(--bordeaux)' }}>point de dépôt.</span>
          </div>

          <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 14, color: 'rgba(26,16,8,0.6)', lineHeight: 1.7 }}>
            Devenez un point de retrait pour les livres voyageurs de votre quartier. Gérez les dépôts, retraits et borderos depuis votre tableau de bord.
          </div>
        </div>

        {/* Features */}
        <div style={{ marginBottom: 36 }}>
          {[
            { icon: '⬡', label: 'Scanner les borderos par QR code' },
            { icon: '📦', label: 'Gérer les dépôts & retraits en temps réel' },
            { icon: '🔔', label: 'Signaler un incident ou une anomalie' },
          ].map(({ icon, label }) => (
            <div key={label} style={{
              background: 'var(--papier)',
              border: '1px solid rgba(26,16,8,0.12)',
              padding: '14px 16px',
              marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: '2px 2px 0 rgba(26,16,8,0.06)',
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
              <span className="font-special" style={{ fontSize: 11, letterSpacing: 1, color: 'rgba(26,16,8,0.7)' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleConnect}
          style={{
            width: '100%',
            background: 'var(--sepia)',
            color: 'var(--creme)',
            border: 'none',
            padding: '18px 24px',
            fontFamily: 'Special Elite, monospace',
            fontSize: 12,
            letterSpacing: 4,
            textTransform: 'uppercase',
            cursor: 'pointer',
            position: 'relative',
            outline: '2px dashed rgba(139,105,20,0.4)',
            outlineOffset: 3,
            transition: 'all 0.15s',
          }}
        >
          Accéder à l'Espace Relais →
        </button>

        <div className="font-fell" style={{ textAlign: 'center', marginTop: 16, fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.4)' }}>
          Vous êtes un lecteur ou un voyageur ?{' '}
          <a href="/landing-lecteur" style={{ color: 'var(--bordeaux)', textDecoration: 'underline' }}>Lecteur</a>{' '}·{' '}
          <a href="/landing-voyageur" style={{ color: 'var(--bordeaux)', textDecoration: 'underline' }}>Voyageur</a>
        </div>
      </div>
    </div>
  );
}