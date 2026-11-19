import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const TYPES_COMMERCE = ['Boulangerie', 'Café', 'Restaurant'];
const CONFIG_PLACEHOLDER = 'À configurer';

const cleanInviteValue = (value) => {
  const decoded = String(value || '').trim();
  return decoded && decoded !== CONFIG_PLACEHOLDER ? decoded : '';
};

const getInvitePrefill = () => {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('finaliser_relais')) return null;
  return {
    nom_enseigne: cleanInviteValue(params.get('nom')),
    email: cleanInviteValue(params.get('email')),
    ville: cleanInviteValue(params.get('ville')),
    pays: cleanInviteValue(params.get('pays')) || 'France',
    adresse: cleanInviteValue(params.get('adresse')),
    type_commerce: TYPES_COMMERCE.includes(cleanInviteValue(params.get('type_commerce'))) ? cleanInviteValue(params.get('type_commerce')) : 'Boulangerie',
    horaires: cleanInviteValue(params.get('horaires')),
    telephone: cleanInviteValue(params.get('telephone')),
  };
};

const paysCode = (pays) => {
  const normalized = pays.trim().toLowerCase();
  if (normalized.includes('france')) return 'FR';
  if (normalized.includes('belgique')) return 'BE';
  if (normalized.includes('suisse')) return 'CH';
  if (normalized.includes('canada')) return 'CA';
  return pays.trim().slice(0, 2).toUpperCase() || 'FR';
};

export default function LandingRelais() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [invitePrefill] = useState(() => getInvitePrefill());
  const [entryMode, setEntryMode] = useState(invitePrefill ? 'signup' : 'choice');
  const [form, setForm] = useState({ nom_enseigne: '', identifiant_connexion: '', email: '', ville: '', pays: 'France', adresse: '', type_commerce: 'Boulangerie', horaires: '', telephone: '', ...(invitePrefill || {}) });
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
            nom_enseigne: cleanInviteValue(existing.nom),
            identifiant_connexion: cleanInviteValue(existing.identifiant_connexion),
            email: u.email,
            ville: cleanInviteValue(existing.ville),
            pays: cleanInviteValue(existing.pays_nom || existing.pays_code) || 'France',
            adresse: cleanInviteValue(existing.adresse),
            type_commerce: TYPES_COMMERCE.includes(cleanInviteValue(existing.type_commerce)) ? cleanInviteValue(existing.type_commerce) : 'Boulangerie',
            horaires: cleanInviteValue(existing.horaires),
            telephone: cleanInviteValue(existing.telephone),
          });
          setMessage(existing.validation_admin === 'valide' ? 'Votre accès Point Relais est validé.' : existing.validation_admin === 'rejete' ? 'Votre demande a été refusée. Vous pouvez la corriger et la renvoyer.' : 'Votre demande est en attente de validation administrateur.');
        } else {
          setForm(prev => ({ ...prev, ...(invitePrefill || {}), ...(pending || {}), email: u.email }));
          if (pending || invitePrefill) setEntryMode('signup');
        }
      }
      setChecking(false);
    }).catch(() => setChecking(false));
  }, []);

  const handleConnect = () => {
    if (user) {
      navigate('/stock');
      return;
    }
    base44.auth.redirectToLogin(window.location.href);
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
    <main className="min-h-screen bordero-shell px-5 py-6 text-encre sm:px-8 lg:px-10">
      <section className="mx-auto max-w-6xl">
        <nav className="flex flex-wrap items-center justify-between gap-4 py-4">
          <Link to="/" className="font-ui text-xs font-extrabold uppercase tracking-[0.32em] text-bordeaux">Bordero</Link>
          <div className="flex gap-3 font-ui text-[11px] font-bold uppercase tracking-[0.18em] text-bordeaux/70">
            <Link to="/landing-lecteur">Lecteur</Link>
            <Link to="/landing-voyageur">Voyageur</Link>
          </div>
        </nav>

        <div className="grid gap-8 py-8 lg:grid-cols-[0.96fr_1.04fr] lg:items-start">
          <aside className="bordero-card-premium p-7 sm:p-10 lg:sticky lg:top-8">
            <span className="bordero-badge">🏪 Point relais</span>
            <h1 className="bordero-heading-display mt-6 text-5xl sm:text-6xl">Devenez l’escale locale des livres voyageurs.</h1>
            <p className="mt-6 font-body text-2xl leading-9 text-encre/72">
              Bordero confie aux commerces partenaires la réception, le stockage et la remise des livres dans un parcours simple à contrôler.
            </p>
            <div className="mt-8 grid gap-3">
              {['Réception guidée', 'Stock visible', 'Remise sécurisée'].map(item => (
                <div key={item} className="rounded-2xl border border-bordeaux/15 bg-creme/40 p-4 font-ui text-xs font-extrabold uppercase tracking-[0.18em] text-bordeaux">{item}</div>
              ))}
            </div>
          </aside>

          <div>
            {!checking && !user && entryMode === 'choice' && (
              <div className="bordero-surface mb-5 p-6 text-center">
                <h2 className="font-heading text-3xl text-bordeaux">Connectez votre commerce à Bordero.</h2>
                <p className="mx-auto mt-3 max-w-xl font-body text-xl leading-8 text-encre/70">Connectez-vous si votre relais existe déjà, ou démarrez une fiche partenaire à valider.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button onClick={handleConnect} className="bordero-action-primary px-5 py-3 text-xs">Se connecter</button>
                  <button onClick={() => setEntryMode('signup')} className="bordero-action-secondary px-5 py-3 text-xs">Inscription relais</button>
                </div>
              </div>
            )}

            {checking && <div className="bordero-surface p-6 text-center font-body text-xl italic text-encre/60">Chargement…</div>}

            {!checking && (user || entryMode === 'signup') && (
              <form className="bordero-readable-auth-form bordero-card-premium p-5 sm:p-6" onSubmit={handleSubmit}>
                <p className="bordero-heading-section">Fiche commerce</p>
                <h2 className="mt-3 font-heading text-3xl text-bordeaux">Demande d’accès Point Relais</h2>
                <p className="mt-2 font-body text-lg leading-7 text-encre/70">L’accès au scanner et au stock sera ouvert après validation administrateur.</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
                    <label key={field} className="block">
                      <span className="mb-2 block font-ui text-[10px] font-extrabold uppercase tracking-[0.18em] text-gray-700">{label}</span>
                      <input required={field !== 'telephone'} type={field === 'email' ? 'email' : 'text'} disabled={field === 'email' && !!user?.email} value={field === 'email' && user?.email ? user.email : form[field]} onChange={(e) => updateField(field, e.target.value)} placeholder={placeholder} className="bordero-input px-3 py-2 text-sm" />
                    </label>
                  ))}
                </div>

                <label className="mt-4 block">
                  <span className="mb-2 block font-ui text-[10px] font-extrabold uppercase tracking-[0.18em] text-gray-700">Type de commerce</span>
                  <select required value={form.type_commerce} onChange={(e) => updateField('type_commerce', e.target.value)} className="bordero-input px-3 py-2 text-sm">
                    {TYPES_COMMERCE.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>

                <div className="mt-5 rounded-2xl border border-dashed border-bordeaux/35 bg-bordeaux/5 p-4 font-body text-base leading-7 text-gray-800">
                  Le mot de passe se crée et se réinitialise uniquement sur l’écran sécurisé de connexion Bordero. Utilisez le lien « mot de passe oublié » sur cet écran pour recevoir l’e-mail de réinitialisation.
                  <button type="button" onClick={handleConnect} className="bordero-action-primary mt-3 w-full px-4 py-3 text-[10px]">Créer / réinitialiser mon mot de passe</button>
                </div>

                {message && <div className={`mt-5 rounded-2xl border p-4 text-sm leading-6 ${status === 'error' ? 'border-red-700 bg-red-50 text-red-700' : 'border-green-700 bg-green-50 text-green-700'}`}>{message}</div>}

                <button type="submit" disabled={status === 'sending'} className="bordero-action-primary mt-5 w-full px-5 py-4 text-xs disabled:cursor-wait disabled:opacity-70">{status === 'sending' ? 'Envoi…' : user ? 'Envoyer la demande' : 'Continuer vers la création du compte'}</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}