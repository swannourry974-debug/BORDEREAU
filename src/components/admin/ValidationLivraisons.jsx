import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function ValidationLivraisons() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});
  const [filter, setFilter] = useState('en_attente');

  const load = () => {
    setLoading(true);
    base44.entities.Commande.filter({ scan_valide_par_voyageur: true })
      .then(data => setCommandes(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleValidate = async (commande, decision) => {
    setProcessing(commande.id);

    await base44.entities.Commande.update(commande.id, {
      validation_admin: decision,
      admin_notes: adminNotes[commande.id] || '',
      statut: decision === 'validee' ? 'en_transit' : 'litige',
      notification_lecteur_envoyee: decision === 'validee',
    });

    // Envoyer une notification email au lecteur si validé
    if (decision === 'validee' && commande.lecteur_email) {
      await base44.integrations.Core.SendEmail({
        to: commande.lecteur_email,
        subject: `✅ Votre livre "${commande.livre_titre}" est en route !`,
        body: `Bonjour,\n\nBonne nouvelle ! L'achat de votre livre "${commande.livre_titre}" a été validé par notre équipe.\n\nVotre voyageur est maintenant engagé et transportera votre livre vers ${commande.zone_nom}.\n\nVous pouvez suivre l'état de votre commande dans votre espace Bordero.\n\nMerci de votre confiance,\nL'équipe Bordero`,
      });
    }

    setProcessing(null);
    load();
  };

  const filtered = commandes.filter(c => {
    if (filter === 'en_attente') return c.validation_admin === 'en_attente' || !c.validation_admin;
    if (filter === 'validee') return c.validation_admin === 'validee';
    if (filter === 'rejetee') return c.validation_admin === 'rejetee';
    return true;
  });

  const countEnAttente = commandes.filter(c => c.validation_admin === 'en_attente' || !c.validation_admin).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="font-special" style={{ fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>
            Validations de livraison
          </div>
          {countEnAttente > 0 && (
            <div style={{ fontSize: 11, color: 'var(--bordeaux)', marginTop: 4 }}>
              ⚠️ {countEnAttente} en attente de validation
            </div>
          )}
        </div>
        <button onClick={load} className="font-special" style={{
          background: 'transparent', border: '1px dashed hsl(var(--border))',
          padding: '6px 14px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
          cursor: 'pointer', color: 'hsl(var(--muted-foreground))',
        }}>⟳ Actualiser</button>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { id: 'en_attente', label: `En attente (${countEnAttente})` },
          { id: 'validee', label: 'Validées' },
          { id: 'rejetee', label: 'Rejetées' },
          { id: 'all', label: 'Toutes' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className="font-special" style={{
            padding: '6px 14px', border: `1.5px solid ${filter === f.id ? 'var(--bordeaux)' : 'hsl(var(--border))'}`,
            background: filter === f.id ? 'var(--bordeaux)' : 'transparent',
            color: filter === f.id ? 'var(--creme)' : 'hsl(var(--muted-foreground))',
            fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
          }}>{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="font-fell" style={{ fontStyle: 'italic', color: 'hsl(var(--muted-foreground))', textAlign: 'center', padding: 40, fontSize: 14 }}>
          Aucune validation à traiter pour ce filtre.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filtered.map(c => {
            const isPending = c.validation_admin === 'en_attente' || !c.validation_admin;
            const isValidee = c.validation_admin === 'validee';
            const isRejetee = c.validation_admin === 'rejetee';

            return (
              <div key={c.id} style={{
                background: 'hsl(var(--card))',
                border: `2px solid ${isPending ? 'hsl(var(--border))' : isValidee ? '#2d6a2d' : 'var(--bordeaux)'}`,
                padding: 20,
                boxShadow: isPending ? '3px 3px 0 rgba(26,16,8,0.1)' : 'none',
              }}>
                {/* Header commande */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div className="font-playfair" style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                      {c.livre_titre}
                    </div>
                    <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span>📧 Lecteur : {c.lecteur_email}</span>
                      <span>✈️ Voyageur : {c.voyageur_email || '—'}</span>
                      <span>🌍 Destination : {c.zone_nom}</span>
                    </div>
                    {c.code_barre_isbn && (
                      <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
                        📦 ISBN scanné : <strong>{c.code_barre_isbn}</strong>
                      </div>
                    )}
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    border: `1.5px solid ${isPending ? '#8B6914' : isValidee ? '#2d6a2d' : 'var(--bordeaux)'}`,
                    color: isPending ? '#8B6914' : isValidee ? '#2d6a2d' : 'var(--bordeaux)',
                    fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Special Elite, monospace',
                  }}>
                    {isPending ? '⏳ En attente' : isValidee ? '✅ Validée' : '❌ Rejetée'}
                  </div>
                </div>

                {/* Ticket de caisse */}
                {c.ticket_caisse_url && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>
                      Ticket de caisse fourni par le voyageur
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <img
                        src={c.ticket_caisse_url}
                        alt="Ticket de caisse"
                        style={{ maxHeight: 200, maxWidth: 200, objectFit: 'contain', border: '1.5px solid hsl(var(--border))', background: 'white' }}
                      />
                      <a
                        href={c.ticket_caisse_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 11, color: 'var(--bordeaux)', textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        🔍 Voir en grand
                      </a>
                    </div>
                  </div>
                )}

                {/* Zone décision admin */}
                {isPending && (
                  <div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', display: 'block', marginBottom: 6 }}>
                        Notes (optionnel)
                      </label>
                      <textarea
                        value={adminNotes[c.id] || ''}
                        onChange={e => setAdminNotes(n => ({ ...n, [c.id]: e.target.value }))}
                        placeholder="Remarques sur la validation ou le rejet..."
                        rows={2}
                        style={{
                          width: '100%', padding: '8px 12px',
                          border: '1.5px solid hsl(var(--border))',
                          background: 'hsl(var(--background))', color: 'hsl(var(--foreground))',
                          fontFamily: "'Special Elite', monospace", fontSize: 12,
                          resize: 'vertical', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        onClick={() => handleValidate(c, 'validee')}
                        disabled={processing === c.id}
                        className="font-special"
                        style={{
                          background: '#2d6a2d', color: 'white', border: 'none',
                          padding: '10px 20px', cursor: processing === c.id ? 'not-allowed' : 'pointer',
                          fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
                          opacity: processing === c.id ? 0.6 : 1,
                        }}
                      >
                        {processing === c.id ? '⟳...' : '✅ Valider & Notifier le lecteur'}
                      </button>
                      <button
                        onClick={() => handleValidate(c, 'rejetee')}
                        disabled={processing === c.id}
                        className="font-special"
                        style={{
                          background: 'transparent', color: 'var(--bordeaux)',
                          border: '1.5px solid var(--bordeaux)',
                          padding: '10px 20px', cursor: processing === c.id ? 'not-allowed' : 'pointer',
                          fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
                          opacity: processing === c.id ? 0.6 : 1,
                        }}
                      >
                        ❌ Rejeter
                      </button>
                    </div>
                  </div>
                )}

                {/* Résultat si déjà traité */}
                {!isPending && (
                  <div style={{
                    background: isValidee ? 'rgba(45,106,45,0.08)' : 'rgba(128,0,32,0.08)',
                    border: `1px solid ${isValidee ? '#2d6a2d' : 'var(--bordeaux)'}`,
                    padding: '10px 14px', fontSize: 12,
                  }}>
                    {isValidee ? '✅ Livraison validée — lecteur notifié par email.' : '❌ Livraison rejetée.'}
                    {c.admin_notes && <div style={{ marginTop: 6, fontStyle: 'italic', color: 'hsl(var(--muted-foreground))' }}>Note : {c.admin_notes}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}