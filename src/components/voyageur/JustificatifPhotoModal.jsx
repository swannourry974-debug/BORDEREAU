import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function JustificatifPhotoModal({ mission, onClose, onSaved }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(mission?.justificatif_photo_preview || '');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const pickFile = (e) => {
    const nextFile = e.target.files?.[0];
    if (!nextFile) return;
    setFile(nextFile);
    setDone(false);
    setError('');
    const reader = new FileReader();
    reader.onload = event => setPreview(event.target.result);
    reader.readAsDataURL(nextFile);
  };

  const savePhoto = async () => {
    if (!file || saving) return;
    setSaving(true);
    setError('');
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const updated = await base44.entities.MissionVoyageur.update(mission.id, {
        justificatif_photo_uri: file_uri,
        justificatif_photo_nom: file.name,
        justificatif_photo_date: new Date().toISOString(),
      });
      setDone(true);
      onSaved?.(updated);
    } catch (e) {
      setError('Impossible d’enregistrer la photo. Vous pouvez recommencer.');
    }
    setSaving(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(26,16,8,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 440, background: 'var(--creme)', border: '2px solid var(--bordeaux)', padding: 20, boxShadow: '6px 6px 0 rgba(110,30,46,0.25)' }}>
        <div className="font-special" style={{ fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 6 }}>Justificatif mission</div>
        <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.58)', marginBottom: 16 }}>{mission?.livre || 'Mission voyageur'}</div>
        <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={pickFile} style={{ display: 'none' }} />
        <button type="button" onClick={() => inputRef.current?.click()} className="font-special" style={{ width: '100%', minHeight: 150, border: '2px dashed rgba(110,30,46,0.42)', background: 'var(--papier)', color: 'var(--bordeaux)', padding: 14, cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase', fontSize: 11 }}>
          {preview ? <img src={preview} alt="Justificatif" style={{ maxHeight: 180, maxWidth: '100%', objectFit: 'contain' }} /> : '📷 Prendre en photo'}
        </button>
        {done && <div className="font-fell" style={{ marginTop: 12, fontSize: 13, fontStyle: 'italic', color: '#2d6a2d' }}>Photo associée à la mission.</div>}
        {error && <div className="font-fell" style={{ marginTop: 12, fontSize: 13, fontStyle: 'italic', color: '#b41414' }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
          <button type="button" onClick={() => { setFile(null); setPreview(''); setDone(false); setError(''); inputRef.current?.click(); }} className="font-special" style={{ background: 'transparent', color: 'var(--bordeaux)', border: '1.5px dashed var(--bordeaux)', padding: '12px 10px', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>Recommencer</button>
          <button type="button" onClick={done ? onClose : savePhoto} disabled={!file && !done} className="font-special" style={{ background: file || done ? 'var(--cta-orange)' : 'rgba(26,16,8,0.14)', color: file || done ? 'var(--cta-foreground)' : 'rgba(26,16,8,0.38)', border: 'none', padding: '12px 10px', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>{saving ? 'Envoi…' : done ? 'Fermer' : 'Enregistrer'}</button>
        </div>
      </div>
    </div>
  );
}