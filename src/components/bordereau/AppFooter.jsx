import React from 'react';

const LINKS = [
  { label: 'Catalogue', href: '/catalogue' },
  { label: 'Étagère', href: '/etagere' },
  { label: 'Missions', href: '/missions' },
  { label: 'Profil', href: '/profil' },
  { label: 'Aide', href: '/aide' },
];

export default function AppFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--bordero-line)', marginTop: 40, position: 'relative', zIndex: 1 }}>
      <div className="mx-auto flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between" style={{ maxWidth: 960 }}>
        <div className="min-w-0">
          <div className="font-playfair" style={{ fontSize: 16, fontWeight: 700, color: 'var(--bordeaux)', letterSpacing: 2 }}>
            BORDERO
          </div>
          <div className="font-body" style={{ fontStyle: 'italic', fontSize: 13, color: 'var(--encre-douce)', marginTop: 2 }}>
            Le manifeste des livres voyageurs.
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-ui"
              style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--encre-douce)', textDecoration: 'none' }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <div
        className="mx-auto flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ maxWidth: 960, borderTop: '1px solid var(--bordero-line)' }}
      >
        <div className="font-ui" style={{ fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', color: 'var(--encre-douce)' }}>
          © 2026 Bordero — Carnet de voyage littéraire
        </div>
        <div className="font-body" style={{ fontStyle: 'italic', fontSize: 11, color: 'var(--encre-douce)' }}>
          « Les livres voyagent mieux que leurs lecteurs. »
        </div>
      </div>
    </footer>
  );
}
