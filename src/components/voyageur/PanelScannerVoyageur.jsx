import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { SectionTitle } from '@/components/bordereau/shared';
import ScanValidation from '@/components/missions/ScanValidation';
import JustificatifPhotoModal from './JustificatifPhotoModal';

const validationLabel = (status) => {
  if (status === 'validee') return 'Validée';
  if (status === 'rejetee') return 'Rejetée';
  return 'En attente';
};

export default function PanelScannerVoyageur() {
  const [missions, setMissions] = useState([]);
  const [validations, setValidations] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [photoMission, setPhotoMission] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    if (!user?.email) { setLoading(false); return; }
    const [userMissions, userCommandes] = await Promise.all([
      base44.entities.MissionVoyageur.filter({ voyageur_email: user.email }, '-updated_date', 100),
      base44.entities.Commande.filter({ voyageur_email: user.email }, '-updated_date', 100),
    ]);
    setMissions((userMissions || []).filter(m => ['acceptee', 'engagee'].includes(m.statut)));
    setValidations(userCommandes || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleValidated = async () => {
    if (selectedMission?.id) {
      await base44.entities.MissionVoyageur.update(selectedMission.id, { statut: 'engagee' });
    }
    setSelectedMission(null);
    await load();
  };

  const handlePhotoSaved = (updatedMission) => {
    setMissions(prev => prev.map(m => m.id === updatedMission.id ? updatedMission : m));
  };

  if (loading) return <div className="text-center py-10 font-fell italic text-encre/45">Chargement du scanner…</div>;

  return (
    <div>
      <SectionTitle>Scanner</SectionTitle>
      <div style={{ background: 'var(--papier)', border: '1.5px solid rgba(26,16,8,0.2)', padding: 16, marginBottom: 18, boxShadow: '3px 3px 0 rgba(26,16,8,0.10)' }}>
        <div className="font-special" style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 8 }}>
          Livres à valider
        </div>
        {missions.length === 0 ? (
          <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.45)' }}>Aucun livre à scanner pour le moment.</div>
        ) : missions.map(m => (
          <div key={m.id} style={{ borderTop: '1px dashed rgba(26,16,8,0.14)', padding: '12px 0', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <div>
              <div className="font-playfair" style={{ fontSize: 15, fontWeight: 700, color: 'var(--encre)' }}>{m.livre}</div>
              <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.5)' }}>{m.ville_destination || 'Destination'} · {m.statut}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, minWidth: 118 }}>
              <button onClick={() => setSelectedMission(m)} className="font-special" style={{ minHeight: 42, background: 'var(--cta-orange)', color: 'var(--cta-foreground)', border: 'none', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>Scanner</button>
              <button onClick={() => setPhotoMission(m)} className="font-special" style={{ minHeight: 42, background: m.justificatif_photo_uri ? 'rgba(45,106,45,0.12)' : 'var(--papier)', color: m.justificatif_photo_uri ? '#2d6a2d' : 'var(--bordeaux)', border: '1.5px dashed rgba(110,30,46,0.42)', fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase' }}>{m.justificatif_photo_uri ? 'Photo reçue' : 'Prendre en photo'}</button>
            </div>
          </div>
        ))}
      </div>

      <SectionTitle>Tableau des validations</SectionTitle>
      <div style={{ background: 'var(--papier)', border: '1.5px solid rgba(26,16,8,0.2)', overflowX: 'auto', boxShadow: '3px 3px 0 rgba(26,16,8,0.10)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 460 }}>
          <thead className="font-special" style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(26,16,8,0.48)' }}>
            <tr><th style={{ textAlign: 'left', padding: 12 }}>Livre</th><th style={{ textAlign: 'left', padding: 12 }}>ISBN</th><th style={{ textAlign: 'left', padding: 12 }}>Statut</th><th style={{ textAlign: 'left', padding: 12 }}>Ticket</th></tr>
          </thead>
          <tbody>
            {validations.length === 0 ? (
              <tr><td colSpan="4" className="font-fell" style={{ padding: 18, textAlign: 'center', fontStyle: 'italic', color: 'rgba(26,16,8,0.45)' }}>Aucune validation envoyée.</td></tr>
            ) : validations.map(v => (
              <tr key={v.id} style={{ borderTop: '1px dashed rgba(26,16,8,0.14)' }}>
                <td style={{ padding: 12, color: 'var(--encre)' }}>{v.livre_titre || 'Livre'}</td>
                <td style={{ padding: 12, color: 'rgba(26,16,8,0.62)' }}>{v.code_barre_isbn || '—'}</td>
                <td style={{ padding: 12, color: v.validation_admin === 'rejetee' ? '#b41414' : v.validation_admin === 'validee' ? '#2d6a2d' : 'var(--bordeaux)' }}>{validationLabel(v.validation_admin)}</td>
                <td style={{ padding: 12 }}>{v.ticket_caisse_url ? (String(v.ticket_caisse_url).startsWith('http') ? <a href={v.ticket_caisse_url} target="_blank" rel="noreferrer" style={{ color: 'var(--bordeaux)', textDecoration: 'underline' }}>Voir</a> : <span style={{ color: '#2d6a2d' }}>Privé</span>) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedMission && <ScanValidation mission={selectedMission} onClose={() => setSelectedMission(null)} onValidated={handleValidated} />}
      {photoMission && <JustificatifPhotoModal mission={photoMission} onClose={() => setPhotoMission(null)} onSaved={handlePhotoSaved} />}
    </div>
  );
}