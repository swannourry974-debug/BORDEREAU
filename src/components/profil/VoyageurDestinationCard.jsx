import React, { useState } from 'react';

export default function VoyageurDestinationCard({ user, onSave, saving }) {
  const [destination, setDestination] = useState(user?.voyageur_destination || user?.ville_destination || '');

  const submit = (e) => {
    e.preventDefault();
    onSave(destination.trim());
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
      <div>
        <div className="font-special" style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 8 }}>
          Destinations voyageur
        </div>
        <div className="font-fell" style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
          Modifiez votre destination principale pour adapter votre espace Voyageur et vos futures missions.
        </div>
      </div>
      <input
        required
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        placeholder="Ex : Miami, Abidjan, Montréal"
        className="font-special"
        style={{
          width: '100%',
          background: 'var(--creme)',
          border: '1px solid rgba(26,16,8,0.22)',
          padding: '11px 12px',
          fontSize: 12,
          color: 'var(--encre)',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <button
        type="submit"
        disabled={!destination.trim() || saving}
        className="font-special"
        style={{
          width: '100%',
          background: destination.trim() && !saving ? 'var(--cta-orange)' : 'rgba(26,16,8,0.18)',
          color: destination.trim() && !saving ? 'var(--cta-foreground)' : 'rgba(26,16,8,0.45)',
          border: 'none',
          padding: '12px 16px',
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          cursor: destination.trim() && !saving ? 'pointer' : 'not-allowed',
        }}
      >
        {saving ? 'Enregistrement…' : 'Enregistrer ma destination'}
      </button>
    </form>
  );
}