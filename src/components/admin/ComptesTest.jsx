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
    role: 'lecteur',
    desc: 'Recherche de livres, commandes, suivi de livraison, étagère.',
    defaultEmail: 'test.lecteur@bordero.app',
  },
  {
    id: 'voyageur',
    label: 'Voyageur',
    icon: '✈️',
    color: '#8B6914',
    role: 'voyageur',
    desc: 'Tableau de bord voyageur, missions, wallet, déclaration de vol.',
    defaultEmail: 'test.voyageur@bordero.app',
    extra: 'Le bouton de liaison crée automatiquement son wallet et un vol de test.',
  },
  {
    id: 'relais',
    label: 'Point Relais',
    icon: '🏪',
    color: '#2d6a2d',
    role: 'relais',
    desc: 'Tableau de bord relais, gestion du stock, scanner de colis.',
    defaultEmail: 'test.relais@bordero.app',
    extra: 'Le bouton de liaison crée automatiquement le Point Relais validé.',
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
      await base44.users.inviteUser(email, profil.role === 'admin' ? 'admin' : 'user');
      setStatuts(s => ({ ...s, [profil.id]: { ok: true, msg: `Invitation envoyée à ${email}` } }));
    } catch (e) {
      setStatuts(s => ({ ...s, [profil.id]: { ok: false, msg: e?.message || 'Erreur lors de l\'invitation' } }));
    }
    setLoading(l => ({ ...l, [profil.id]: false }));
  };

  const lierAuSysteme = async (profil) => {
    const email = emails[profil.id]?.trim();
    if (!email) return;
    const loadingKey = `link_${profil.id}`;
    setLoading(l => ({ ...l, [loadingKey]: true }));
    setStatuts(s => ({ ...s, [profil.id]: null }));
    try {
      const users = await base44.entities.User.filter({ email });
      const user = users[0];
      if (!user) {
        setStatuts(s => ({ ...s, [profil.id]: { ok: false, msg: 'Compte introuvable : ouvrez d’abord le lien d’invitation.' } }));
        setLoading(l => ({ ...l, [loadingKey]: false }));
        return;
      }

      const updates = { role: profil.role };

      if (profil.id === 'voyageur') {
        const wallets = await base44.entities.VoyageurWallet.filter({ user_email: email });
        if (wallets.length === 0) {
          await base44.entities.VoyageurWallet.create({ user_email: email, solde_disponible: 35, gains_previsionnels: 18, livres_actifs: 2, trajet_actif: 'Paris → New York · Test' });
        }
        const voyages = await base44.entities.Voyage.filter({ voyageur_email: email });
        if (voyages.length === 0) {
          await base44.entities.Voyage.create({ voyageur_email: email, depart_ville: 'Paris', arrivee_ville: 'New York', date_vol: '2026-09-15', actif: true });
        }
      }

      if (profil.id === 'relais') {
        let relais = (await base44.entities.PointRelais.filter({ gerant_email: email }))[0];
        if (!relais) {
          relais = await base44.entities.PointRelais.create({ nom: 'Point Relais Test', adresse: 'Adresse test', ville: 'New York', pays_code: 'US', gerant_email: email, validation_admin: 'valide', actif: true, stock_actuel: 0, horaires: 'Lun-Sam 9h-19h' });
        }
        updates.relais_valide = true;
        updates.relais_validation_status = 'valide';
        updates.relais_valide_le = new Date().toISOString();
        updates.point_relais_id = relais.id;
        updates.relais_nom_boutique = relais.nom;
        updates.relais_adresse = relais.adresse;
        updates.relais_ville = relais.ville;
        updates.relais_horaires = relais.horaires;
      }

      await base44.entities.User.update(user.id, updates);
      setStatuts(s => ({ ...s, [profil.id]: { ok: true, msg: `${email} est lié au rôle ${profil.label}` } }));
    } catch (e) {
      setStatuts(s => ({ ...s, [profil.id]: { ok: false, msg: e?.message || 'Impossible de lier ce compte.' } }));
    }
    setLoading(l => ({ ...l, [loadingKey]: false }));
  };

  const inviterTous = async () => {
    for (const profil of PROFILS) {
      await inviter(profil);
    }
  };

  const lierTous = async () => {
    for (const profil of PROFILS) {
      await lierAuSysteme(profil);
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
          const isLinking = loading[`link_${profil.id}`];
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
                  marginBottom: 8,
                }}
              >
                {isLoading ? 'Envoi…' : `✉️ Inviter le ${profil.label}`}
              </button>

              <button
                onClick={() => lierAuSysteme(profil)}
                disabled={isLinking}
                style={{
                  width: '100%', padding: '10px 0',
                  background: isLinking ? 'hsl(var(--muted))' : 'var(--cta-orange)',
                  color: 'var(--cta-foreground)', border: 'none', cursor: isLinking ? 'not-allowed' : 'pointer',
                  fontFamily: 'Special Elite, monospace', fontSize: 10,
                  letterSpacing: 2, textTransform: 'uppercase',
                  transition: 'opacity 0.2s',
                }}
              >
                {isLinking ? 'Liaison…' : '🔗 Lier à l’application'}
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
            marginRight: 10,
          }}
        >
          ✉️ Inviter les 4 comptes d'un coup
        </button>
        <button
          onClick={lierTous}
          style={{
            padding: '12px 32px',
            background: 'var(--cta-orange)', color: 'var(--cta-foreground)',
            border: 'none', cursor: 'pointer',
            fontFamily: 'Special Elite, monospace', fontSize: 11,
            letterSpacing: 3, textTransform: 'uppercase',
            boxShadow: '3px 3px 0 var(--cta-orange-dark)',
          }}
        >
          🔗 Lier les 4 comptes
        </button>
      </div>
    </div>
  );
}