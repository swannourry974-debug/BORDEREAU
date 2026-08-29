import React, { useState } from 'react';

export default function RoleProfileForm({ role, currentUser, onSave, onBack, onClose }) {
  const [form, setForm] = useState({
    nom: currentUser?.nom || '',
    prenom: currentUser?.prenom || '',
    telephone: currentUser?.telephone || '',
    identifiant_connexion: currentUser?.identifiant_connexion || '',
    position_gps: currentUser?.position_gps || '',
    voyageur_destination: currentUser?.voyageur_destination || currentUser?.ville_destination || '',
  });
  const [gpsMessage, setGpsMessage] = useState('');
  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const getGps = () => {
    if (!navigator.geolocation) return setGpsMessage('GPS indisponible sur cet appareil.');
    setGpsMessage('Recherche de position…');
    navigator.geolocation.getCurrentPosition(pos => {
      update('position_gps', `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
      setGpsMessage('Position GPS ajoutée.');
    }, () => setGpsMessage('Autorisez la localisation ou saisissez votre position.'));
  };
  const submit = (e) => {
    e.preventDefault();
    const common = { nom: form.nom, prenom: form.prenom, telephone: form.telephone, adresse_mail_contact: currentUser?.email || '' };
    onSave(role, role === 'lecteur'
      ? { ...common, identifiant_connexion: form.identifiant_connexion, position_gps: form.position_gps, lecteur_profile_complete: true }
      : { ...common, voyageur_destination: form.voyageur_destination, ville_destination: form.voyageur_destination, voyageur_profile_complete: true }
    );
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <button type="button" onClick={onBack} className="text-[11px] text-bordeaux underline">← Changer de rôle</button>
      <h3 className="font-heading text-[22px] text-encre">Fiche d’accès {role === 'lecteur' ? 'Lecteur' : 'Voyageur'}</h3>
      <p className="text-[12px] text-encre/60 leading-relaxed">Ces informations restent sur votre compte pour vous reconnecter et retrouver directement votre espace Bordero. Le mot de passe est géré par la connexion sécurisée Bordero.</p>
      {['nom', 'prenom', 'telephone'].map(field => <label key={field} className="block font-ui text-[10px] uppercase tracking-[2px] text-bordeaux/65">{field === 'telephone' ? 'Numéro de téléphone' : field}<input required value={form[field]} onChange={e => update(field, e.target.value)} className="mt-1 w-full min-h-[44px] bg-papier border border-encre/20 px-3 text-[14px] text-encre normal-case tracking-normal" /></label>)}
      <label className="block font-ui text-[10px] uppercase tracking-[2px] text-bordeaux/65">Adresse mail<input disabled value={currentUser?.email || ''} className="mt-1 w-full min-h-[44px] bg-encre/5 border border-encre/15 px-3 text-[14px] text-encre normal-case tracking-normal" /></label>
      {role === 'lecteur' && <><label className="block font-ui text-[10px] uppercase tracking-[2px] text-bordeaux/65">Identifiant<input required value={form.identifiant_connexion} onChange={e => update('identifiant_connexion', e.target.value)} className="mt-1 w-full min-h-[44px] bg-papier border border-encre/20 px-3 text-[14px] text-encre normal-case tracking-normal" /></label><label className="block font-ui text-[10px] uppercase tracking-[2px] text-bordeaux/65">Position GPS<input required value={form.position_gps} onChange={e => update('position_gps', e.target.value)} className="mt-1 w-full min-h-[44px] bg-papier border border-encre/20 px-3 text-[14px] text-encre normal-case tracking-normal" /></label><button type="button" onClick={getGps} className="w-full min-h-[44px] border border-bordeaux text-bordeaux font-ui text-[11px] uppercase tracking-[2px]">Utiliser ma position GPS</button>{gpsMessage && <p className="text-[11px] text-encre/55 italic">{gpsMessage}</p>}</>}
      {role === 'voyageur' && <label className="block font-ui text-[10px] uppercase tracking-[2px] text-bordeaux/65">Choix de destination<input required value={form.voyageur_destination} onChange={e => update('voyageur_destination', e.target.value)} placeholder="Ex : Miami, Abidjan, Montréal" className="mt-1 w-full min-h-[44px] bg-papier border border-encre/20 px-3 text-[14px] text-encre normal-case tracking-normal" /></label>}
      <button type="submit" className="w-full min-h-[44px] bg-cta text-cta-foreground font-ui text-[11px] uppercase tracking-[2px]">Enregistrer et entrer</button>
      <button type="button" onClick={onClose} className="w-full min-h-[44px] bg-transparent text-encre/55 font-ui text-[11px] uppercase tracking-[2px]">Plus tard</button>
    </form>
  );
}