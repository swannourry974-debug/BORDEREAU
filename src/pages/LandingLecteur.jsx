import React from 'react';
import { base44 } from '@/api/base44Client';

export default function LandingLecteur() {
  const handleConnect = () => {
    base44.auth.redirectToLogin(window.location.origin + '/?role=lecteur');
  };

  return (
    <div style={{ background: 'var(--creme)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', position: 'relative', overflow: 'hidden' }}>
      {/* Grain overlay */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")", opacity: 0.3 }} />

      {/* Decorative book icon */}
      <div style={{ fontSize: 64, marginBottom: 8, opacity: 0.15, position: 'absolute', top: 40, right: 30, transform: 'rotate(12deg)' }}>📚</div>
      <div style={{ fontSize: 48, marginBottom: 8, opacity: 0.08, position: 'absolute', bottom: 60, left: 20, transform: 'rotate(-8deg)' }}>✦</div>

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
            background: 'var(--bordeaux)',
            color: 'var(--creme)',
            fontFamily: 'Special Elite, monospace',
            fontSize: 10,
            letterSpacing: 4,
            textTransform: 'uppercase',
            padding: '6px 18px',
            marginBottom: 24,
          }}>
            ✦ ESPACE LECTEUR
          </div>

          <div className="font-playfair" style={{ fontSize: 30, fontWeight: 700, color: 'var(--encre)', lineHeight: 1.2, marginBottom: 16 }}>
            Vos livres, livrés<br />
            <span style={{ fontStyle: 'italic', color: 'var(--bordeaux)' }}>par des voyageurs</span>
          </div>

          <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 14, color: 'rgba(26,16,8,0.6)', lineHeight: 1.7 }}>
            Commandez des livres rares ou introuvables localement. Des voyageurs les ramènent dans leurs valises, directement à votre relais.
          </div>
        </div>

        {/* Features */}
        <div style={{ marginBottom: 36 }}>
          {[
            { icon: '🌍', label: 'Livres du monde entier' },
            { icon: '✈️', label: 'Transport par des voyageurs certifiés' },
            { icon: '🏪', label: 'Retrait dans votre relais local' },
          ].map(({ icon, label }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 0',
              borderBottom: '1px dashed rgba(26,16,8,0.15)',
            }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span className="font-special" style={{ fontSize: 11, letterSpacing: 1, color: 'rgba(26,16,8,0.7)' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleConnect}
          style={{
            width: '100%',
            background: 'var(--bordeaux)',
            color: 'var(--creme)',
            border: 'none',
            padding: '18px 24px',
            fontFamily: 'Special Elite, monospace',
            fontSize: 12,
            letterSpacing: 4,
            textTransform: 'uppercase',
            cursor: 'pointer',
            position: 'relative',
            outline: '2px dashed var(--bordeaux)',
            outlineOffset: 3,
            transition: 'all 0.15s',
          }}
        >
          Accéder au Catalogue →
        </button>

        <div className="font-fell" style={{ textAlign: 'center', marginTop: 16, fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.4)' }}>
          Vous êtes un voyageur ou un relais ?{' '}
          <a href="/landing-voyageur" style={{ color: 'var(--bordeaux)', textDecoration: 'underline' }}>Voyageur</a>{' '}·{' '}
          <a href="/landing-relais" style={{ color: 'var(--bordeaux)', textDecoration: 'underline' }}>Relais</a>
        </div>
      </div>
    </div>
  );
}