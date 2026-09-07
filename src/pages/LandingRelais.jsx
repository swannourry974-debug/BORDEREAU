import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const TYPES_COMMERCE = ['Boulangerie', 'Café', 'Restaurant'];

const paysCode = (pays) => {
  const normalized = pays.trim().toLowerCase();
  if (normalized.includes('france')) return 'FR';
  if (normalized.includes('belgique')) return 'BE';
  if (normalized.includes('suisse')) return 'CH';
  if (normalized.includes('canada')) return 'CA';
  return pays.trim().slice(0, 2).toUpperCase() || 'FR';
};

export default function LandingRelais() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [entryMode, setEntryMode] = useState('choice');
  const [form, setForm] = useState({ nom_enseigne: '', identifiant_connexion: '', email: '', ville: '', pays: 'France', adresse: '', type_commerce: 'Boulangerie', horaires: '', telephone: '' });
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (u) {
        const pending = JSON.parse(localStorage.getItem('bordero_relais_pending_form') || 'null');
        const existing = (await base44.entities.PointRelais.filter({ gerant_email: u.email }, '-updated_date', 1))[0];
        if (existing) {
          setForm({
            nom_enseigne: existing.nom || '',
            identifiant_connexion: existing.identifiant_connexion || '',
            email: u.email,
            ville: existing.ville || '',
            pays: existing.pays_nom || existing.pays_code || 'France',
            adresse: existing.adresse || '',
            type_commerce: existing.type_commerce || 'Boulangerie',
            horaires: existing.horaires || '',
            telephone: existing.telephone || '',
          });
          setMessage(existing.validation_admin === 'valide' ? 'Votre accès Point Relais est validé.' : existing.validation_admin === 'rejete' ? 'Votre demande a été refusée. Vous pouvez la corriger et la renvoyer.' : 'Votre demande est en attente de validation administrateur.');
        } else {
          setForm(prev => ({ ...prev, ...(pending || {}), email: u.email }));
          if (pending) setEntryMode('signup');
        }
      }
      setChecking(false);
    }).catch(() => setChecking(false));
  }, []);

  const handleConnect = () => {
    base44.auth.redirectToLogin(window.location.origin + '/relais');
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.email) {
      localStorage.setItem('bordero_relais_pending_form', JSON.stringify(form));
      handleConnect();
      return;
    }
    setStatus('sending');
    setMessage('');
    try {
      const payload = {
        nom: form.nom_enseigne.trim(),
        identifiant_connexion: form.identifiant_connexion.trim(),
        adresse: form.adresse,
        ville: form.ville,
        pays_code: paysCode(form.pays),
        pays_nom: form.pays,
        type_commerce: form.type_commerce,
        horaires: form.horaires,
        telephone: form.telephone,
        gerant_email: user.email,
        validation_admin: 'en_attente',
        actif: false,
        stock_actuel: 0,
      };
      const existing = (await base44.entities.PointRelais.filter({ gerant_email: user.email }, '-updated_date', 1))[0];
      const relais = existing ? await base44.entities.PointRelais.update(existing.id, payload) : await base44.entities.PointRelais.create(payload);
      localStorage.removeItem('bordero_relais_pending_form');
      await base44.auth.updateMe({
        relais_validation_status: 'en_attente',
        relais_valide: false,
        point_relais_id: relais.id,
        relais_nom_boutique: payload.nom,
        relais_identifiant_connexion: payload.identifiant_connexion,
        relais_adresse: form.adresse,
        relais_ville: form.ville,
        relais_pays: form.pays,
        relais_type_commerce: form.type_commerce,
        relais_telephone: form.telephone,
        relais_horaires: form.horaires,
      });
      await base44.functions.invoke('notifierDemandeRelais', { relaisId: relais.id });
      setStatus('sent');
      setMessage('Demande envoyée. Un administrateur doit valider votre fiche avant l’ouverture du scanner, du stock et des profils relais.');
    } catch (err) {
      setStatus('error');
      setMessage('Impossible d’envoyer la demande pour le moment. Vérifiez les champs et réessayez.');
    }
  };

  return (
    <div style={{ background: 'var(--creme)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")", opacity: 0.3 }} />
      <div style={{ fontSize: 64, opacity: 0.1, position: 'absolute', top: 40, right: 30, transform: 'rotate(-6deg)' }}>🏪</div>

      <div style={{ maxWidth: 460, width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="font-special" style={{ fontSize: 11, letterSpacing: 5, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 12, opacity: 0.8 }}>BORDERO</div>
          <div style={{ display: 'inline-block', background: 'var(--sepia)', color: 'var(--creme)', fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', padding: '6px 18px', marginBottom: 20 }}>🏪 INSCRIPTION RELAIS</div>
          <div className="font-playfair" style={{ fontSize: 30, fontWeight: 700, color: 'var(--encre)', lineHeight: 1.2, marginBottom: 12 }}>Devenir<br /><span style={{ fontStyle: 'italic', color: 'var(--bordeaux)' }}>Point Relais.</span></div>
          <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 14, color: 'rgba(26,16,8,0.6)', lineHeight: 1.7 }}>Remplissez votre fiche commerce. L’accès au scanner et au stock sera ouvert seulement après validation administrateur.</div>
        </div>

        {!checking && !user && (
          <div style={{ background: 'var(--papier)', border: '1.5px solid rgba(26,16,8,0.2)', padding: 18, marginBottom: 18, textAlign: 'center' }}>
            <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.62)', marginBottom: 14 }}>Vous avez déjà un compte relais ou vous souhaitez inscrire votre commerce ?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={handleConnect} style={{ width: '100%', background: 'var(--cta-orange)', color: 'var(--cta-foreground)', border: 'none', padding: '14px 10px', fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>Se connecter</button>
              <button onClick={() => setEntryMode('signup')} style={{ width: '100%', background: 'transparent', color: 'var(--bordeaux)', border: '1.5px dashed var(--bordeaux)', padding: '14px 10px', fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>Inscription</button>
            </div>
          </div>
        )}

        {checking && <div className="font-fell" style={{ textAlign: 'center', fontStyle: 'italic', color: 'rgba(26,16,8,0.45)' }}>Chargement…</div>}

        {!checking && (user || entryMode === 'signup') && (
          <form onSubmit={handleSubmit} style={{ background: 'var(--papier)', border: '2px solid rgba(26,16,8,0.18)', padding: 18, boxShadow: '5px 5px 0 rgba(26,16,8,0.10)', color: '#111111' }}>
            {[
              ['nom_enseigne', "Nom de l'enseigne", 'Librairie du quartier'],
              ['identifiant_connexion', 'Identifiant relais souhaité', 'librairie-quartier'],
              ['horaires', "Horaires d'ouverture", 'Lun-Sam 8h-19h'],
              ['adresse', 'Adresse postale', '12 rue des livres'],
              ['email', 'Adresse mail', 'contact@commerce.fr'],
              ['ville', 'Ville', 'Paris'],
              ['pays', 'Pays', 'France'],
              ['telephone', 'Téléphone optionnel', '+33 6 00 00 00 00'],
            ].map(([field, label, placeholder]) => (
              <label key={field} style={{ display: 'block', marginBottom: 12 }}>
                <span className="font-special" style={{ display: 'block', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#111111', marginBottom: 5 }}>{label}</span>
                <input required={field !== 'telephone'} type={field === 'email' ? 'email' : 'text'} disabled={field === 'email' && !!user?.email} value={field === 'email' && user?.email ? user.email : form[field]} onChange={(e) => updateField(field, e.target.value)} placeholder={placeholder} style={{ width: '100%', background: field === 'email' && !!user?.email ? 'rgba(26,16,8,0.05)' : 'var(--creme)', border: '1.5px solid rgba(26,16,8,0.28)', padding: '11px 12px', fontSize: 13, color: '#111111' }} />
              </label>
            ))}

            <label style={{ display: 'block', marginBottom: 16 }}>
              <span className="font-special" style={{ display: 'block', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#111111', marginBottom: 5 }}>Type de commerce</span>
              <select required value={form.type_commerce} onChange={(e) => updateField('type_commerce', e.target.value)} style={{ width: '100%', background: 'var(--creme)', border: '1.5px solid rgba(26,16,8,0.28)', padding: '11px 12px', fontSize: 13, color: '#111111' }}>
                {TYPES_COMMERCE.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>

            <div className="font-fell" style={{ background: 'rgba(128,0,32,0.06)', border: '1px dashed var(--bordeaux)', padding: 12, marginBottom: 14, fontSize: 12, lineHeight: 1.6, color: '#111111' }}>
              Le mot de passe se crée et se réinitialise uniquement sur l’écran sécurisé de connexion Bordero. Utilisez le lien « mot de passe oublié » sur cet écran pour recevoir l’e-mail de réinitialisation.
              <button type="button" onClick={handleConnect} style={{ display: 'block', width: '100%', marginTop: 10, background: 'var(--cta-orange)', color: 'var(--cta-foreground)', border: 'none', padding: '12px 14px', fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>Créer / réinitialiser mon mot de passe</button>
            </div>

            {message && <div style={{ background: status === 'error' ? 'rgba(180,20,20,0.08)' : 'rgba(45,106,45,0.08)', border: `1px solid ${status === 'error' ? '#b41414' : '#2d6a2d'}`, padding: 12, marginBottom: 14, fontSize: 12, lineHeight: 1.6, color: status === 'error' ? '#b41414' : '#2d6a2d' }}>{message}</div>}

            <button type="submit" disabled={status === 'sending'} style={{ width: '100%', background: 'var(--cta-orange)', color: 'var(--cta-foreground)', border: 'none', padding: '16px 18px', fontFamily: 'Special Elite, monospace', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', cursor: status === 'sending' ? 'wait' : 'pointer', opacity: status === 'sending' ? 0.7 : 1 }}>{status === 'sending' ? 'Envoi…' : user ? 'Envoyer la demande' : 'Continuer vers la création du compte'}</button>
          </form>
        )}

        <div className="font-fell" style={{ textAlign: 'center', marginTop: 16, fontStyle: 'italic', fontSize: 11, color: 'rgba(26,16,8,0.4)' }}>
          Vous êtes un lecteur ou un voyageur ? <a href="/landing-lecteur" style={{ color: 'var(--bordeaux)', textDecoration: 'underline' }}>Lecteur</a> · <a href="/landing-voyageur" style={{ color: 'var(--bordeaux)', textDecoration: 'underline' }}>Voyageur</a>
        </div>
      </div>
    </div>
  );
}