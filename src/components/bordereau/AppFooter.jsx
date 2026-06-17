import React from 'react';

const LINKS = [
  { label: 'Catalogue', href: '/catalogue' },
  { label: 'Étagère', href: '/etagere' },
  { label: 'Missions', href: '/missions' },
  { label: 'Profil', href: '/profil' },
  { label: 'Aide', href: '/aide' },
];

const LEGAL = [
  { label: 'Conditions générales', href: '#' },
  { label: 'Politique de confidentialité', href: '#' },
  { label: 'Mentions légales', href: '#' },
];

export default function AppFooter() {
  return (
    <footer style={{
      background: '#F5F0DC',
      borderTop: '1.5px dashed #1a1008',
      marginTop: 40,
      position: 'relative',
      zIndex: 1,
    }}>
      {/* Double ligne registre ancien */}
      <div style={{ borderTop: '1px solid rgba(26,16,8,0.12)', marginBottom: 0 }} />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 32px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32 }}>

        {/* Colonne marque */}
        <div>
          <div className="font-playfair" style={{ fontSize: 20, fontWeight: 700, color: '#1a1008', marginBottom: 8, letterSpacing: 1 }}>
            Bordero
          </div>
          <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: '#8B6914', lineHeight: 1.7 }}>
            Carnet de voyage littéraire.<br />
            Des livres qui traversent les frontières,<br />
            portés par des mains humaines.
          </div>
        </div>

        {/* Navigation rapide */}
        <div>
          <div className="font-playfair" style={{ fontSize: 13, fontWeight: 700, color: '#1a1008', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14, borderBottom: '1px dashed rgba(26,16,8,0.2)', paddingBottom: 6 }}>
            Navigation
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LINKS.map(link => (
              <a
                key={link.label}
                href={link.href}
                className="font-special footer-link"
                style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#1a1008', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#800020'}
                onMouseLeave={e => e.currentTarget.style.color = '#1a1008'}
              >
                — {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Mentions légales */}
        <div>
          <div className="font-playfair" style={{ fontSize: 13, fontWeight: 700, color: '#1a1008', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14, borderBottom: '1px dashed rgba(26,16,8,0.2)', paddingBottom: 6 }}>
            Informations
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LEGAL.map(link => (
              <a
                key={link.label}
                href={link.href}
                className="font-special"
                style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#1a1008', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#8B6914'}
                onMouseLeave={e => e.currentTarget.style.color = '#1a1008'}
              >
                — {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Contact / Réseaux */}
        <div>
          <div className="font-playfair" style={{ fontSize: 13, fontWeight: 700, color: '#1a1008', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14, borderBottom: '1px dashed rgba(26,16,8,0.2)', paddingBottom: 6 }}>
            Contact
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a
              href="mailto:contact@bordero.app"
              className="font-special"
              style={{ fontSize: 10, letterSpacing: 1.5, color: '#1a1008', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#800020'}
              onMouseLeave={e => e.currentTarget.style.color = '#1a1008'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              contact@bordero.app
            </a>
            <a
              href="#"
              className="font-special"
              style={{ fontSize: 10, letterSpacing: 1.5, color: '#1a1008', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#800020'}
              onMouseLeave={e => e.currentTarget.style.color = '#1a1008'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              @bordero_app
            </a>
          </div>
        </div>
      </div>

      {/* Bande copyright */}
      <div style={{ borderTop: '1px dashed rgba(26,16,8,0.2)', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div className="font-special" style={{ fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(26,16,8,0.4)' }}>
          © 2026 Bordero — Carnet de voyage littéraire
        </div>
        <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 10, color: 'rgba(139,105,20,0.6)' }}>
          « Les livres voyagent mieux que leurs lecteurs. »
        </div>
      </div>
    </footer>
  );
}