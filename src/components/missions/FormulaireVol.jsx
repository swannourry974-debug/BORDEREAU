import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function FormulaireVol({ user, onVolDeclare }) {
  const [form, setForm] = useState({ depart_ville: '', arrivee_ville: '', date_vol: '' });
  const [documentVol, setDocumentVol] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    setMessage('');
    if (!form.depart_ville || !form.arrivee_ville || !form.date_vol || !documentVol) return;
    if (new Date(`${form.date_vol}T00:00:00`) <= new Date(new Date().setHours(0, 0, 0, 0))) {
      setMessage('Le vol doit être futur pour être validé.');
      return;
    }
    if (user?.voyageur_bloque || user?.voyageur_validation_status === 'bloque') {
      setMessage('Votre profil voyageur est bloqué. Contactez l’équipe Bordero depuis l’aide.');
      return;
    }
    setLoading(true);
    try {
      const anciensVoyages = await base44.entities.Voyage.filter({ voyageur_email: user?.email || '' });
      const tentatives = Math.max(user?.voyageur_tentatives_validation || 0, anciensVoyages?.length || 0);
      if (tentatives >= 6 || anciensVoyages.some(v => v.validation_admin === 'bloque')) {
        await base44.auth.updateMe({ voyageur_validation_status: 'bloque', voyageur_bloque: true, voyageur_tentatives_validation: tentatives });
        setMessage('Votre profil voyageur est bloqué après 6 essais de validation.');
        setLoading(false);
        return;
      }
      const upload = await base44.integrations.Core.UploadFile({ file: documentVol });
      const voyage = await base44.entities.Voyage.create({
        ...form,
        voyageur_email: user?.email || '',
        confirmation_vol_url: upload.file_url,
        confirmation_vol_nom: documentVol.name,
        validation_admin: 'en_attente',
        tentative_validation: tentatives + 1,
        actif: false,
      });
      await base44.auth.updateMe({ voyageur_validation_status: 'en_attente', voyageur_valide: false, voyageur_tentatives_validation: tentatives + 1, voyageur_bloque: false });
      setSuccess(true);
      onVolDeclare && onVolDeclare(voyage);
    } catch (e) {
      alert('Erreur lors de la déclaration. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '10px 12px', background: 'var(--bordero-surface-strong)', border: '1.5px solid var(--bordero-line-strong)', fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'var(--encre)', outline: 'none', boxSizing: 'border-box', marginBottom: 12 };
  const labelStyle = { fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--encre-douce)', marginBottom: 5, display: 'block' };

  if (success) {
    return (
      <div className="bordero-note" data-tone="valide" style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
        <div className="bordero-title" style={{ fontSize: 16, marginBottom: 4 }}>Vol envoyé en validation</div>
        <div className="bordero-copy" style={{ fontSize: 13, marginBottom: 14, color: 'inherit' }}>
          Un administrateur doit vérifier votre confirmation de vol avant l’accès aux missions.
        </div>
        <button
          type="button"
          onClick={() => { setSuccess(false); setForm({ depart_ville: '', arrivee_ville: '', date_vol: '' }); setDocumentVol(null); }}
          className="bordero-action-secondary bordero-ui"
          style={{ padding: '8px 16px', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}
        >
          Envoyer un autre vol
        </button>
      </div>
    );
  }

  return (
    <div className="bordero-card p-5">
      <div style={{ fontSize: 32, marginBottom: 12, textAlign: 'center' }}>✈️</div>
      <label style={labelStyle}>Ville de départ</label>
      <input style={inputStyle} placeholder="ex: Paris CDG" value={form.depart_ville} onChange={e => setForm(f => ({ ...f, depart_ville: e.target.value }))} />
      <label style={labelStyle}>Ville d'arrivée</label>
      <input style={inputStyle} placeholder="ex: Miami, FL" value={form.arrivee_ville} onChange={e => setForm(f => ({ ...f, arrivee_ville: e.target.value }))} />
      <label style={labelStyle}>Date du vol futur</label>
      <input type="date" style={inputStyle} value={form.date_vol} onChange={e => setForm(f => ({ ...f, date_vol: e.target.value }))} />
      <label style={labelStyle}>Mail/PDF de confirmation du vol</label>
      <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.eml,.txt" style={inputStyle} onChange={e => setDocumentVol(e.target.files?.[0] || null)} />
      <div className="bordero-copy" style={{ fontSize: 13, marginBottom: 12 }}>
        Joignez la confirmation officielle du vol futur. Après 6 essais refusés, le profil est bloqué ; une tentative frauduleuse peut être bloquée immédiatement.
      </div>
      {message && (
        <div className="bordero-note" data-tone="alerte" style={{ marginBottom: 12, fontSize: 13 }}>{message}</div>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !form.depart_ville || !form.arrivee_ville || !form.date_vol || !documentVol}
        className="bordero-action-primary w-full text-[11px]"
        style={{ opacity: (!form.depart_ville || !form.arrivee_ville || !form.date_vol || !documentVol) ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? '⟳ Envoi en validation…' : '✦ Envoyer pour validation'}
      </button>
    </div>
  );
}
