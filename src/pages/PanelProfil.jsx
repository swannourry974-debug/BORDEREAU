import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const DISTINCTIONS = [
  { id: 'petit_courrier', emoji: '📬', nom: 'Petit Courrier', seuil: 1 },
  { id: 'globe_trotteur', emoji: '🌍', nom: 'Globe-Trotteur', seuil: 10 },
  { id: 'ambassadeur', emoji: '🎖️', nom: 'Ambassadeur', seuil: 30 },
];

export default function PanelProfil() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [missionsLivrees, setMissionsLivrees] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (!u) return;
      const livrees = await base44.entities.MissionVoyageur.filter({ voyageur_email: u.email, statut: 'livree' });
      setMissionsLivrees(livrees.length);
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'SUPPRIMER') return;
    setDeleteLoading(true);
    try {
      // Supprimer les données utilisateur liées
      const missions = await base44.entities.MissionVoyageur.filter({ voyageur_email: user?.email });
      for (const m of missions) {
        await base44.entities.MissionVoyageur.delete(m.id);
      }
      const wallets = await base44.entities.VoyageurWallet.filter({ user_email: user?.email });
      for (const w of wallets) {
        await base44.entities.VoyageurWallet.delete(w.id);
      }
      await base44.auth.logout('/landing-lecteur');
    } catch (e) {
      alert('Erreur lors de la suppression. Contactez le support.');
      setDeleteLoading(false);
    }
  };

  const sectionStyle = {
    background: 'var(--papier)',
    border: '1.5px solid rgba(26,16,8,0.25)',
    padding: 20,
    marginBottom: 16,
    boxShadow: '3px 3px 0 rgba(26,16,8,0.10)',
  };

  return (
    <div style={{ background: 'hsl(var(--background))', minHeight: '100vh', paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--bordeaux)',
        paddingTop: `calc(18px + env(safe-area-inset-top, 0px))`,
        paddingBottom: 14,
        paddingLeft: 20,
        paddingRight: 20,
        boxShadow: '0 3px 12px rgba(128,0,32,0.4)',
      }}>
        <div className="font-special" style={{ fontSize: 20, color: 'var(--creme)', letterSpacing: 4, textTransform: 'uppercase' }}>
          Profil
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        {/* Identité */}
        <div style={sectionStyle}>
          <div className="font-special" style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: 12 }}>
            Compte
          </div>
          <div className="font-playfair" style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            {user?.full_name || '—'}
          </div>
          <div className="font-fell" style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--muted-foreground)' }}>
            {user?.email || '—'}
          </div>
        </div>

        {/* Mes Distinctions */}
        <div style={sectionStyle}>
          <div className="font-special" style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(26,16,8,0.45)', marginBottom: 14 }}>
            Mes Distinctions
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
            {DISTINCTIONS.map(d => {
              const debloque = missionsLivrees >= d.seuil;
              return (
                <div key={d.id} style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '14px 8px',
                  background: debloque ? 'rgba(128,0,32,0.06)' : 'rgba(26,16,8,0.03)',
                  border: debloque ? '1.5px solid var(--bordeaux)' : '1.5px dashed rgba(26,16,8,0.15)',
                  filter: debloque ? 'none' : 'grayscale(1)',
                  opacity: debloque ? 1 : 0.45,
                  transition: 'all 0.3s',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 6, userSelect: 'none', WebkitUserSelect: 'none' }}>{d.emoji}</div>
                  <div className="font-special" style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: debloque ? 'var(--bordeaux)' : 'rgba(26,16,8,0.4)', lineHeight: 1.3, userSelect: 'none', WebkitUserSelect: 'none' }}>
                    {d.nom}
                  </div>
                  <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 10, color: 'rgba(26,16,8,0.35)', marginTop: 4, userSelect: 'none', WebkitUserSelect: 'none' }}>
                    {debloque ? '✓ Obtenu' : `≥ ${d.seuil} livr.`}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.4)', marginTop: 12, textAlign: 'center' }}>
            {missionsLivrees} mission{missionsLivrees !== 1 ? 's' : ''} livrée{missionsLivrees !== 1 ? 's' : ''} au total
          </div>
        </div>

        {/* Déconnexion */}
        <div style={sectionStyle}>
          <button
            onClick={handleLogout}
            className="font-special"
            style={{
              width: '100%', background: 'none',
              border: '1.5px solid var(--encre)', padding: '12px 16px',
              fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
              cursor: 'pointer', color: 'var(--encre)', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.target.style.background = 'hsl(var(--muted))'}
            onMouseLeave={e => e.target.style.background = 'none'}
          >
            ✦ Se déconnecter
          </button>
        </div>

        {/* Zone danger */}
        <div style={{
          ...sectionStyle,
          borderColor: 'rgba(180,20,20,0.4)',
          background: 'rgba(180,20,20,0.03)',
        }}>
          <div className="font-special" style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#b41414', marginBottom: 12 }}>
            Zone de danger
          </div>

          {!showDeleteConfirm ? (
            <>
              <div className="font-fell" style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--muted-foreground)', marginBottom: 14, lineHeight: 1.6 }}>
                La suppression de votre compte est irréversible. Toutes vos données (missions, wallet, historique) seront définitivement effacées.
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="font-special"
                style={{
                  width: '100%', background: 'none',
                  border: '1.5px dashed rgba(180,20,20,0.5)', padding: '12px 16px',
                  fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
                  cursor: 'pointer', color: '#b41414',
                }}
              >
                Supprimer mon compte
              </button>
            </>
          ) : (
            <>
              <div className="font-fell" style={{ fontSize: 13, fontStyle: 'italic', color: '#b41414', marginBottom: 12, lineHeight: 1.6 }}>
                Tapez <strong>SUPPRIMER</strong> pour confirmer la suppression définitive de votre compte.
              </div>
              <input
                className="font-special"
                placeholder="SUPPRIMER"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                style={{
                  width: '100%', background: 'var(--creme)',
                  border: '1px solid rgba(180,20,20,0.5)',
                  padding: '9px 12px', fontSize: 13,
                  color: 'var(--encre)', outline: 'none',
                  marginBottom: 12, boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== 'SUPPRIMER' || deleteLoading}
                  className="font-special"
                  style={{
                    flex: 1, background: confirmText === 'SUPPRIMER' ? '#b41414' : 'rgba(180,20,20,0.2)',
                    border: 'none', padding: '12px 16px',
                    fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
                    cursor: confirmText === 'SUPPRIMER' ? 'pointer' : 'not-allowed',
                    color: 'white', transition: 'all 0.2s',
                  }}
                >
                  {deleteLoading ? '⟳ Suppression...' : 'Confirmer'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setConfirmText(''); }}
                  className="font-special"
                  style={{
                    background: 'none', border: '1.5px solid var(--encre)',
                    padding: '12px 16px', fontSize: 11, letterSpacing: 2,
                    textTransform: 'uppercase', cursor: 'pointer', color: 'var(--encre)',
                  }}
                >
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}