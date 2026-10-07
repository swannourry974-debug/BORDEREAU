import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import MesLivres from '@/components/profil/MesLivres';
import VoyageurDestinationCard from '@/components/profil/VoyageurDestinationCard';
import VoyageurFinanceRubriques from '@/components/profil/VoyageurFinanceRubriques';
import LangSwitcher from '@/components/shared/LangSwitcher';
import { useLang } from '@/lib/LangContext';

const DISTINCTIONS = [
  { id: 'petit_courrier', emoji: '📬', key: 'distinction_petit_courrier', seuil: 1 },
  { id: 'globe_trotteur', emoji: '🌍', key: 'distinction_globe_trotteur', seuil: 10 },
  { id: 'ambassadeur', emoji: '🎖️', key: 'distinction_ambassadeur', seuil: 30 },
];

export default function PanelProfil() {
  const { t } = useLang();
  const [user, setUser] = useState(null);
  const [missionsLivrees, setMissionsLivrees] = useState(0);
  const [missionsEnCours, setMissionsEnCours] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [relaisForm, setRelaisForm] = useState({ nom: '', adresse: '', ville: '', horaires: '' });
  const [relaisSaving, setRelaisSaving] = useState(false);
  const [relaisMessage, setRelaisMessage] = useState('');
  const [destinationSaving, setDestinationSaving] = useState(false);
  const [destinationMessage, setDestinationMessage] = useState('');

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (!u) return;
      setRelaisForm({
        nom: u.relais_nom_boutique || '',
        adresse: u.relais_adresse || '',
        ville: u.relais_ville || '',
        horaires: u.relais_horaires || '',
      });
      const [livrees, toutesMissions] = await Promise.all([
        base44.entities.MissionVoyageur.filter({ voyageur_email: u.email, statut: 'livree' }),
        base44.entities.MissionVoyageur.filter({ voyageur_email: u.email }, '-updated_date', 100),
      ]);
      setMissionsLivrees(livrees.length);
      setMissionsEnCours((toutesMissions || []).filter(m => ['acceptee', 'engagee'].includes(m.statut)));
    }).catch(() => {});
  }, []);

  const sectionStyle = {
    background: 'var(--papier)',
    border: '1.5px solid rgba(26,16,8,0.25)',
    padding: 20,
    marginBottom: 16,
    boxShadow: '3px 3px 0 rgba(26,16,8,0.10)',
  };

  const handleLogout = () => base44.auth.logout('/');

  const handleDestinationSave = async (destination) => {
    setDestinationSaving(true);
    setDestinationMessage('');
    const updates = { role: 'voyageur', voyageur_destination: destination, ville_destination: destination, voyageur_profile_complete: true, role_prompt_seen: true };
    try {
      const updated = await base44.auth.updateMe(updates);
      setUser(updated || { ...user, ...updates });
      setDestinationMessage('Destination voyageur enregistrée.');
    } catch (e) {
      setDestinationMessage('Impossible d’enregistrer la destination pour le moment.');
    }
    setDestinationSaving(false);
  };

  const handleRelaisSubmit = async (e) => {
    e.preventDefault();
    setRelaisSaving(true);
    setRelaisMessage('');
    const updates = {
      relais_nom_boutique: relaisForm.nom.trim(),
      relais_adresse: relaisForm.adresse.trim(),
      relais_ville: relaisForm.ville.trim(),
      relais_horaires: relaisForm.horaires.trim(),
      relais_valide: false,
      relais_validation_status: 'en_attente',
    };
    try {
      const updated = await base44.auth.updateMe(updates);
      setUser(updated || { ...user, ...updates });
      setRelaisMessage('Demande envoyée : un administrateur va vérifier votre point relais.');
    } catch (e) {
      setRelaisMessage('Impossible d’envoyer la demande pour le moment.');
    }
    setRelaisSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'SUPPRIMER') return;
    setDeleteLoading(true);
    try {
      const missions = await base44.entities.MissionVoyageur.filter({ voyageur_email: user?.email });
      for (const m of missions) await base44.entities.MissionVoyageur.delete(m.id);
      const wallets = await base44.entities.VoyageurWallet.filter({ user_email: user?.email });
      for (const w of wallets) await base44.entities.VoyageurWallet.delete(w.id);
      await base44.auth.logout('/landing-lecteur');
    } catch (e) {
      alert('Erreur lors de la suppression. Contactez le support.');
      setDeleteLoading(false);
    }
  };

  const relaisFormComplete = relaisForm.nom.trim() && relaisForm.adresse.trim() && relaisForm.ville.trim() && relaisForm.horaires.trim();
  const showRelaisRegistration = user?.role === 'relais' && user?.relais_validation_status !== 'valide';
  const isVoyageur = user?.role === 'voyageur';

  return (
    <div>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '8px 0' }}>
        <div style={sectionStyle}>
          <div className="font-special" style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: 12 }}>
            {t('profil_compte')}
          </div>
          <div className="font-playfair" style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            {user?.full_name || '—'}
          </div>
          <div className="font-fell" style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--muted-foreground)' }}>
            {user?.email || '—'}
          </div>
        </div>

        {isVoyageur && (
          <div style={sectionStyle}>
            <VoyageurDestinationCard user={user} onSave={handleDestinationSave} saving={destinationSaving} />
            {destinationMessage && <div className="font-fell" style={{ marginTop: 10, fontSize: 12, fontStyle: 'italic', color: 'var(--bordeaux)', lineHeight: 1.5 }}>{destinationMessage}</div>}
          </div>
        )}

        {showRelaisRegistration && (
          <div style={sectionStyle}>
            <div className="font-special" style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 10 }}>
              Inscription Point Relais
            </div>
            <div className="font-fell" style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--muted-foreground)', marginBottom: 14, lineHeight: 1.6 }}>
              Renseignez les informations de votre boutique pour envoyer votre demande de validation.
            </div>
            <form onSubmit={handleRelaisSubmit} style={{ display: 'grid', gap: 10 }}>
              {[
                ['nom', 'Nom de la boutique'],
                ['adresse', 'Adresse complète'],
                ['ville', 'Ville'],
                ['horaires', 'Horaires d’ouverture'],
              ].map(([field, label]) => (
                <input key={field} required className="font-special" placeholder={label} value={relaisForm[field]} onChange={e => setRelaisForm(prev => ({ ...prev, [field]: e.target.value }))} style={{ width: '100%', background: 'var(--creme)', border: '1px solid rgba(26,16,8,0.22)', padding: '11px 12px', fontSize: 12, color: 'var(--encre)', outline: 'none', boxSizing: 'border-box' }} />
              ))}
              <button type="submit" disabled={!relaisFormComplete || relaisSaving} className="font-special" style={{ width: '100%', background: relaisFormComplete ? 'var(--cta-orange)' : 'rgba(26,16,8,0.18)', color: relaisFormComplete ? 'var(--cta-foreground)' : 'rgba(26,16,8,0.45)', border: 'none', padding: '12px 16px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: relaisFormComplete && !relaisSaving ? 'pointer' : 'not-allowed' }}>
                {relaisSaving ? 'Envoi…' : 'Envoyer ma demande relais'}
              </button>
              {relaisMessage && <div className="font-fell" style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--bordeaux)', lineHeight: 1.5 }}>{relaisMessage}</div>}
            </form>
          </div>
        )}

        <div style={sectionStyle}>
          <div className="font-special" style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(26,16,8,0.45)', marginBottom: 14 }}>
            {t('profil_distinctions')}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
            {DISTINCTIONS.map(d => {
              const debloque = missionsLivrees >= d.seuil;
              return (
                <div key={d.id} style={{ flex: 1, textAlign: 'center', padding: '14px 8px', background: debloque ? 'rgba(128,0,32,0.06)' : 'rgba(26,16,8,0.03)', border: debloque ? '1.5px solid var(--bordeaux)' : '1.5px dashed rgba(26,16,8,0.15)', filter: debloque ? 'none' : 'grayscale(1)', opacity: debloque ? 1 : 0.45, transition: 'all 0.3s' }}>
                  <div style={{ fontSize: 28, marginBottom: 6, userSelect: 'none', WebkitUserSelect: 'none' }}>{d.emoji}</div>
                  <div className="font-special" style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: debloque ? 'var(--bordeaux)' : 'rgba(26,16,8,0.4)', lineHeight: 1.3, userSelect: 'none', WebkitUserSelect: 'none' }}>{t(d.key)}</div>
                  <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 10, color: 'rgba(26,16,8,0.35)', marginTop: 4, userSelect: 'none', WebkitUserSelect: 'none' }}>
                    {debloque ? t('distinction_obtenu') : t('distinction_seuil', { n: d.seuil })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.4)', marginTop: 12, textAlign: 'center' }}>
            {t(missionsLivrees !== 1 ? 'profil_missions_count_plural' : 'profil_missions_count', { n: missionsLivrees })}
          </div>
        </div>

        {isVoyageur ? (
          <>
            <VoyageurFinanceRubriques user={user} sectionStyle={sectionStyle} />
            <div style={sectionStyle}>
              <div className="font-special" style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(26,16,8,0.45)', marginBottom: 14 }}>
                Mission en cours
              </div>
            {missionsEnCours.length === 0 ? (
              <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.45)' }}>Aucune mission en cours.</div>
            ) : missionsEnCours.map(m => (
              <div key={m.id} style={{ borderTop: '1px dashed rgba(26,16,8,0.14)', padding: '10px 0' }}>
                <div className="font-playfair" style={{ fontSize: 15, fontWeight: 700, color: 'var(--encre)' }}>{m.livre}</div>
                <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.5)' }}>{m.ville_destination || 'Destination'} · {m.statut}</div>
              </div>
            ))}
            </div>
            </>
            ) : (
          <>
            <div style={sectionStyle}>
              <div className="font-special" style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(26,16,8,0.45)', marginBottom: 16 }}>
                {t('profil_livres')}
              </div>
              <MesLivres userEmail={user?.email} />
            </div>
            <div style={sectionStyle}>
              <LangSwitcher />
            </div>
          </>
        )}

        <div style={sectionStyle}>
          <button onClick={handleLogout} className="font-special" style={{ width: '100%', background: 'none', border: '1.5px solid var(--encre)', padding: '12px 16px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', color: 'var(--encre)', transition: 'all 0.2s' }}>
            {t('profil_logout')}
          </button>
        </div>

        {!isVoyageur && (
          <div style={{ ...sectionStyle, borderColor: 'rgba(180,20,20,0.4)', background: 'rgba(180,20,20,0.03)' }}>
            <div className="font-special" style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#b41414', marginBottom: 12 }}>
              {t('profil_danger')}
            </div>
            {!showDeleteConfirm ? (
              <>
                <div className="font-fell" style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--muted-foreground)', marginBottom: 14, lineHeight: 1.6 }}>
                  La suppression de votre compte est irréversible. Toutes vos données (missions, wallet, historique) seront définitivement effacées.
                </div>
                <button onClick={() => setShowDeleteConfirm(true)} className="font-special" style={{ width: '100%', background: 'none', border: '1.5px dashed rgba(180,20,20,0.5)', padding: '12px 16px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', color: '#b41414' }}>
                  Supprimer mon compte
                </button>
              </>
            ) : (
              <>
                <div className="font-fell" style={{ fontSize: 13, fontStyle: 'italic', color: '#b41414', marginBottom: 12, lineHeight: 1.6 }}>
                  Tapez <strong>SUPPRIMER</strong> pour confirmer la suppression définitive de votre compte.
                </div>
                <input className="font-special" placeholder="SUPPRIMER" value={confirmText} onChange={e => setConfirmText(e.target.value)} style={{ width: '100%', background: 'var(--creme)', border: '1px solid rgba(180,20,20,0.5)', padding: '9px 12px', fontSize: 13, color: 'var(--encre)', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleDeleteAccount} disabled={confirmText !== 'SUPPRIMER' || deleteLoading} className="font-special" style={{ flex: 1, background: confirmText === 'SUPPRIMER' ? '#b41414' : 'rgba(180,20,20,0.2)', border: 'none', padding: '12px 16px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: confirmText === 'SUPPRIMER' ? 'pointer' : 'not-allowed', color: 'white', transition: 'all 0.2s' }}>
                    {deleteLoading ? '⟳ Suppression...' : 'Confirmer'}
                  </button>
                  <button onClick={() => { setShowDeleteConfirm(false); setConfirmText(''); }} className="font-special" style={{ background: 'none', border: '1.5px solid var(--encre)', padding: '12px 16px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', color: 'var(--encre)' }}>
                    Annuler
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}