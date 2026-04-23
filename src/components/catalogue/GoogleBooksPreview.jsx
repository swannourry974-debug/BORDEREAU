import React, { useEffect, useRef, useState } from 'react';

export default function GoogleBooksPreview({ isbn, title }) {
  const containerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [noPreview, setNoPreview] = useState(false);

  useEffect(() => {
    if (!isbn && !title) return;

    // Charge le script Google Books une seule fois
    const scriptId = 'google-books-script';
    const loadPreview = () => {
      if (!window.google?.books) return;
      const viewer = new window.google.books.DefaultViewer(containerRef.current);
      const query = isbn ? `ISBN:${isbn}` : title;
      viewer.load(
        query,
        () => setNoPreview(true),   // onFailure
        () => setLoaded(true)        // onSuccess
      );
    };

    if (window.google?.books) {
      loadPreview();
    } else {
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://www.google.com/books/jsapi.js';
        script.onload = () => {
          window.google.books.load();
          // petit délai pour que l'API soit prête
          setTimeout(loadPreview, 300);
        };
        document.head.appendChild(script);
      } else {
        // Script déjà chargé, attendre que google.books soit dispo
        const interval = setInterval(() => {
          if (window.google?.books) {
            clearInterval(interval);
            loadPreview();
          }
        }, 200);
      }
    }
  }, [isbn, title]);

  if (noPreview) return (
    <div style={{
      background: 'rgba(26,16,8,0.04)',
      border: '1px dashed rgba(26,16,8,0.2)',
      padding: '16px',
      textAlign: 'center',
      fontFamily: 'IM Fell English, serif',
      fontStyle: 'italic',
      fontSize: 12,
      color: 'rgba(26,16,8,0.45)',
    }}>
      Aperçu non disponible pour ce livre
    </div>
  );

  return (
    <div>
      {!loaded && (
        <div style={{
          padding: '12px',
          textAlign: 'center',
          fontFamily: 'Special Elite, monospace',
          fontSize: 11,
          color: 'rgba(26,16,8,0.4)',
          letterSpacing: 1,
        }}>
          Chargement de l'aperçu…
        </div>
      )}
      <div
        ref={containerRef}
        style={{ width: '100%', height: loaded ? 300 : 0, overflow: 'hidden', transition: 'height 0.3s' }}
      />
    </div>
  );
}