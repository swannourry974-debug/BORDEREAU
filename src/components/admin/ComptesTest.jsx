import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const PROFILS = [
  {
    id: 'admin',
    label: 'Administrateur',
    icon: '🔑',
    color: '#800020',
    role: 'admin',
    desc: 'Accès complet au dashboard admin, gestion des zones, validations.',
    defaultEmail: 'test.admin@bordero.app',
  },
  {
    id: 'lecteur',
    label: 'Lecteur',
    icon: '📖',
    color: '#1a3a5c',
    role: 'user',
    desc: 'Recherche de livres, commandes, suivi de livraison, étagère.',
    defaultEmail: 'test.lecteur@bordero.app',
  },
  {
    id: 'voyageur',
    label: 'Voyageur',
    icon: '✈️',
    color: '#8B6914',
    role: 'user',
    desc: 'Tableau de bord voyageur, missions, wallet, déclaration de vol.',
    defaultEmail: 'test.voyageur@bordero.app',
    extra: 'Après invitation, créez un VoyageurWallet et un Voyage pour ce compte.',
  },
  {
    id: 'relais',
    label: 'Point Relais',
    icon: '🏪',
    color: '#2d6a2d',
    role: 'user',
    desc: 'Tableau de bord relais, gestion du stock, scanner de colis.',
    defaultEmail: 'test.relais@bordero.app',
    extra: 'Après invitation, créez un PointRelais avec gerant_email = cet email.',
  },
];

export default function ComptesTest() {
  const [emails, setEmails] = useState(
    Object.fromEntries(PROFILS.map(p => [p.id, p.defaultEmail]))
  );
  const [statuts, setStatuts] = useState({});
  const [loading, setLoading] = useState({});

  const inviter = async (profil) => {
    const email = emails[profil.id]?.trim();
    if (!email) return;
    setLoading(l => ({ ...l, [profil.id]: true }));
    setStatuts(s => ({ ...s, [profil.id]: null }));
    try {
      await base44.users.inviteUser(email, profil.role);
      setStatuts(s => ({ ...s, [profil.id]: { ok: true, msg: `Invitation envoyée à ${email}` } }));
    } catch (e) {
      setStatuts(s => ({ ...s, [profil.id]: { ok: false, msg: e?.message || 'Erreur lors de l\'invitation' } }));
    }
    setLoading(l => ({ ...l, [profil.id]: false }));
  };

  const inviterTous = async () => {
    for (const profil of PROFILS) {
      await inviter(profil);
    }
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{
        background: 'rgba(128,0,32,0.06)', border: '1px dashed var(--bordeaux)',
        padding: '14px 18px', marginBottom: 24,
        display: 'flex', alignItems: 'flex-start', gap: 12,
      }}>
        <span style={{ fontSize: 20 }}>ℹ️</span>
        <div>
          <div className="font-special" style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 4 }}>
            Comment tester
          </div>
          <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'hsl(var(--muted-foreground))', lineHeight: 1.7 }}>
            Invitez les comptes ci-dessous, puis ouvrez chaque lien d'invitation dans un <strong>profil de navigateur différent</strong> (ou en navigation privée) pour simuler plusieurs utilisateurs simultanément.
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
        {PROFILS.map(profil => {
          const statut = statuts[profil.id];
          const isLoading = loading[profil.id];
          return (
            <div key={profil.id} style={{
              background: 'hsl(var(--card))', border: '1.5px solid hsl(var(--border))',
              borderTop: `4px solid ${profil.color}`, padding: '18px 20px',
              boxShadow: '2px 2px 0 rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 26 }}>{profil.icon}</span>
                <div>
                  <div className="font-playfair" style={{ fontWeight: 700, fontSize: 15, color: profil.color }}>{profil.label}</div>
                  <div className="font-special" style={{ fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>
                    rôle : {profil.role}
                  </div>
                </div>
              </div>

              <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 12, lineHeight: 1.6 }}>
                {profil.desc}
              </div>

              {profil.extra && (
                <div style={{
                  fontSize: 10, padding: '6px 10px', marginBottom: 12,
                  background: `${profil.color}10`, border: `1px dashed ${profil.color}`,
                  color: profil.color, fontFamily: 'IM Fell English, serif', fontStyle: 'italic', lineHeight: 1.5,
                }}>
                  ⚙️ {profil.extra}
                </div>
              )}

              <input
                type="email"
                value={emails[profil.id]}
                onChange={e => setEmails(em => ({ ...em, [profil.id]: e.target.value }))}
                placeholder="email@exemple.com"
                style={{
                  width: '100%', padding: '8px 10px', marginBottom: 10,
                  border: '1.5px solid hsl(var(--border))',
                  background: 'hsl(var(--background))',
                  fontFamily: 'Special Elite, monospace', fontSize: 11,
                  color: 'hsl(var(--foreground))', outline: 'none', boxSizing: 'border-box',
                }}
              />

              <button
                onClick={() => inviter(profil)}
                disabled={isLoading}
                style={{
                  width: '100%', padding: '10px 0',
                  background: isLoading ? 'hsl(var(--muted))' : profil.color,
                  color: 'var(--creme)', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Special Elite, monospace', fontSize: 10,
                  letterSpacing: 2, textTransform: 'uppercase',
                  transition: 'opacity 0.2s',
                }}
              >
                {isLoading ? 'Envoi…' : `✉️ Inviter le ${profil.label}`}
              </button>

              {statut && (
                <div style={{
                  marginTop: 10, padding: '7px 10px', fontSize: 11,
                  background: statut.ok ? 'rgba(45,106,45,0.08)' : 'rgba(128,0,32,0.08)',
                  border: `1px solid ${statut.ok ? '#2d6a2d' : 'var(--bordeaux)'}`,
                  color: statut.ok ? '#2d6a2d' : 'var(--bordeaux)',
                  fontFamily: 'IM Fell English, serif', fontStyle: 'italic',
                }}>
                  {statut.ok ? '✓' : '✗'} {statut.msg}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bouton tout inviter */}
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <button
          onClick={inviterTous}
          style={{
            padding: '12px 32px',
            background: 'var(--bordeaux)', color: 'var(--creme)',
            border: 'none', cursor: 'pointer',
            fontFamily: 'Special Elite, monospace', fontSize: 11,
            letterSpacing: 3, textTransform: 'uppercase',
            boxShadow: '3px 3px 0 var(--bordeaux-dark)',
          }}
        >
          ✉️ Inviter les 4 comptes d'un coup
        </button>
      </div>
    </div>
  );
}