import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { BtnCoupon } from '../bordereau/shared';
import ISBNScanner from '../catalogue/ISBNScanner';

// Simule un scan de code-barres ISBN via caméra (input file fallback)
export default function ScanValidation({ mission, onValidated, onClose }) {
  const [step, setStep] = useState('isbn'); // isbn | ticket | confirming | done
  const [isbn, setIsbn] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [ticketFile, setTicketFile] = useState(null);
  const [ticketPreview, setTicketPreview] = useState(null);
  const [ticketAmount, setTicketAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const ticketRef = useRef();

  const handleIsbnSubmit = () => {
    if (!isbn.trim()) { setError('Veuillez saisir ou scanner l\'ISBN'); return; }
    setError('');
    setStep('ticket');
  };

  const handleTicketChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setTicketFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setTicketPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (!ticketFile) { setError('Veuillez photographier le ticket de caisse'); return; }
    setLoading(true);
    setError('');

    const montantTicket = Number(String(ticketAmount).replace(',', '.')) || 0;
    if (montantTicket <= 0) { setLoading(false); setError('Veuillez saisir le montant du ticket de caisse'); return; }

    // Upload privé du ticket
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: ticketFile });

    // Cherche la commande liée à cette mission ou crée un enregistrement temporaire
    // On crée une commande de validation si elle n'existe pas encore
    const commandes = await base44.entities.Commande.filter({ livre_titre: mission.livre });
    const commande = commandes[0];

    if (commande) {
      const prixAttendu = Number(commande.prix_livre_neuf || 0);
      const ecartPrix = prixAttendu > 0 ? Math.round((montantTicket - prixAttendu) * 100) / 100 : 0;
      const alertePrix = prixAttendu > 0 && Math.abs(ecartPrix) > 2;
      await base44.entities.Commande.update(commande.id, {
        code_barre_isbn: isbn,
        ticket_caisse_url: file_uri,
        ticket_montant: montantTicket,
        ecart_prix_ticket: ecartPrix,
        alerte_prix_livre: alertePrix ? `Écart ticket ${ecartPrix.toFixed(2)} € par rapport au prix Google.` : '',
        scan_valide_par_voyageur: true,
        voyageur_email: (await base44.auth.me())?.email,
        validation_admin: alertePrix ? 'en_attente' : 'validee',
        statut: 'payee',
      });
    } else {
      await base44.entities.Commande.create({
        livre_titre: mission.livre || mission.livre_titre,
        lecteur_email: mission.lecteur_email || 'inconnu@bordero.com',
        zone_nom: mission.ville_destination || mission.ville || '',
        mode_livraison: 'express',
        code_barre_isbn: isbn,
        ticket_caisse_url: file_uri,
        ticket_montant: montantTicket,
        prix_livre_neuf: 0,
        prix_livre_a_rembourser: true,
        ecart_prix_ticket: 0,
        alerte_prix_livre: 'Prix Google indisponible : remboursement achat à régulariser sur justificatif.',
        scan_valide_par_voyageur: true,
        voyageur_email: (await base44.auth.me())?.email,
        validation_admin: 'en_attente',
        statut: 'en_transit',
      });
    }

    setLoading(false);
    setStep('done');
    setTimeout(() => {
      onValidated && onValidated();
    }, 1800);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(26,16,8,0.82)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--creme)', width: '100%', maxWidth: 520,
        borderRadius: '0', borderTop: '3px solid var(--bordeaux)',
        padding: 24, maxHeight: '90vh', overflowY: 'auto', position: 'relative', zIndex: 1001,
        animation: 'fadeSlideIn 0.3s ease',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div className="font-special" style={{ fontSize: 14, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--bordeaux)' }}>
              Validation d'achat
            </div>
            <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
              {mission.livre || mission.livre_titre}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'hsl(var(--muted-foreground))' }}>✕</button>
        </div>

        {/* Étapes */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['isbn', 'ticket', 'confirming', 'done'].slice(0,3).map((s, i) => (
            <div key={s} style={{ flex: 1, height: 3, background: step === 'isbn' && i === 0 ? 'var(--bordeaux)' : step === 'ticket' && i <= 1 ? 'var(--bordeaux)' : (step === 'confirming' || step === 'done') && i <= 2 ? 'var(--bordeaux)' : 'hsl(var(--border))' }} />
          ))}
        </div>

        {/* Étape 1 : ISBN */}
        {step === 'isbn' && (
          <div>
            <div className="font-special" style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16, color: 'hsl(var(--muted-foreground))' }}>
              Étape 1 — Scanner le code-barres du livre
            </div>

            <button
              type="button"
              onClick={() => onValidated && onValidated()}
              style={{
                width: '100%', background: '#1a3a5c', color: 'var(--creme)', border: 'none',
                padding: '14px 16px', marginBottom: 16, cursor: 'pointer',
                fontFamily: 'Special Elite, monospace', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
              }}
            >
              ✓ Valider l'achat et passer en transit
            </button>

            {/* Bouton scan caméra */}
            {showScanner && (
              <ISBNScanner
                onResult={(detectedIsbn) => {
                  setIsbn(detectedIsbn);
                  setShowScanner(false);
                }}
                onClose={() => setShowScanner(false)}
              />
            )}

            <button
              onClick={() => setShowScanner(true)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: '2px dashed hsl(var(--border))', padding: '28px 20px', cursor: 'pointer',
                marginBottom: 16, background: 'var(--papier)', gap: 10, width: '100%',
              }}
            >
              <span style={{ fontSize: 40 }}>📷</span>
              <span className="font-special" style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--bordeaux)' }}>
                Scanner avec la caméra
              </span>
              <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                Pointez vers le code-barres ISBN du livre
              </span>
            </button>

            <div style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 11, marginBottom: 12 }}>— ou saisir manuellement —</div>

            <input
              type="text"
              placeholder="ISBN (ex: 978-2-07-036822-8)"
              value={isbn}
              onChange={e => setIsbn(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px',
                border: '1.5px solid hsl(var(--border))',
                background: 'hsl(var(--background))', color: 'hsl(var(--foreground))',
                fontFamily: "'Special Elite', monospace", fontSize: 14,
                marginBottom: 12, boxSizing: 'border-box',
              }}
            />

            {isbn && (
              <div style={{
                background: 'rgba(45,106,45,0.08)', border: '1px solid #2d6a2d',
                padding: '8px 12px', marginBottom: 12, fontSize: 13,
              }}>
                ✅ ISBN détecté : <strong>{isbn}</strong>
              </div>
            )}

            {error && <div style={{ color: 'var(--bordeaux)', fontSize: 12, marginBottom: 8 }}>{error}</div>}

            <BtnCoupon onClick={handleIsbnSubmit} disabled={!isbn.trim()}>
              Continuer →
            </BtnCoupon>
          </div>
        )}

        {/* Étape 2 : Ticket de caisse */}
        {step === 'ticket' && (
          <div>
            <div className="font-special" style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16, color: 'hsl(var(--muted-foreground))' }}>
              Étape 2 — Photographier le ticket de caisse
            </div>

            <div style={{
              background: 'rgba(128,0,32,0.06)', border: '1px dashed var(--bordeaux)',
              padding: '12px 16px', marginBottom: 20, fontSize: 12,
              fontFamily: 'IM Fell English, serif', fontStyle: 'italic', lineHeight: 1.6,
            }}>
              📋 Le ticket de caisse prouve l'achat du livre. Il sera vérifié par notre équipe avant de valider votre commission.
            </div>

            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: '2px dashed hsl(var(--border))', padding: '28px 20px', cursor: 'pointer',
              marginBottom: 16, background: 'var(--papier)', gap: 10,
            }}>
              <input
                ref={ticketRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleTicketChange}
              />
              {ticketPreview ? (
                <img src={ticketPreview} alt="Ticket" style={{ maxHeight: 180, maxWidth: '100%', objectFit: 'contain' }} />
              ) : (
                <>
                  <span style={{ fontSize: 40 }}>🧾</span>
                  <span className="font-special" style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--bordeaux)' }}>
                    Prendre en photo
                  </span>
                  <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                    Ticket de caisse du livre acheté
                  </span>
                </>
              )}
            </label>

            {ticketPreview && (
              <div style={{
                background: 'rgba(45,106,45,0.08)', border: '1px solid #2d6a2d',
                padding: '8px 12px', marginBottom: 12, fontSize: 13,
              }}>
                ✅ Photo du ticket capturée
              </div>
            )}

            <label className="font-special" style={{ display: 'block', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>
              Montant payé sur le ticket
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={ticketAmount}
              onChange={e => setTicketAmount(e.target.value)}
              placeholder="Ex : 12.90"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontFamily: "'Special Elite', monospace", fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }}
            />

            {error && <div style={{ color: 'var(--bordeaux)', fontSize: 12, marginBottom: 8 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 12 }}>
              <BtnCoupon secondary onClick={() => setStep('isbn')}>← Retour</BtnCoupon>
              <BtnCoupon onClick={() => { if (!ticketFile) { setError('Veuillez photographier le ticket'); return; } if (!(Number(String(ticketAmount).replace(',', '.')) > 0)) { setError('Veuillez saisir le montant du ticket'); return; } setError(''); setStep('confirming'); }}>
                Continuer →
              </BtnCoupon>
            </div>
          </div>
        )}

        {/* Étape 3 : Confirmation */}
        {step === 'confirming' && (
          <div>
            <div className="font-special" style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16, color: 'hsl(var(--muted-foreground))' }}>
              Étape 3 — Confirmer l'envoi
            </div>

            <div style={{ background: 'hsl(var(--card))', border: '1.5px solid hsl(var(--border))', padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Livre</div>
                  <div className="font-playfair" style={{ fontWeight: 700 }}>{mission.livre || mission.livre_titre}</div>
                  <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>ISBN : {isbn}</div>
                  <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>Ticket : {Number(String(ticketAmount).replace(',', '.')).toFixed(2)} €</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Ticket</div>
                  <img src={ticketPreview} alt="Ticket" style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain', border: '1px solid hsl(var(--border))' }} />
                </div>
              </div>
            </div>

            <div className="font-fell" style={{
              fontStyle: 'italic', fontSize: 12, color: 'hsl(var(--muted-foreground))',
              lineHeight: 1.7, marginBottom: 20, padding: '12px 16px',
              background: 'rgba(128,0,32,0.05)', borderLeft: '3px solid var(--bordeaux)',
            }}>
              En soumettant ces informations, vous confirmez avoir acheté ce livre et êtes prêt à le transporter. Votre commission sera débloquée après validation par notre équipe.
            </div>

            {error && <div style={{ color: 'var(--bordeaux)', fontSize: 12, marginBottom: 8 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 12 }}>
              <BtnCoupon secondary onClick={() => setStep('ticket')}>← Retour</BtnCoupon>
              <BtnCoupon onClick={handleConfirm} disabled={loading}>
                {loading ? '⟳ Envoi en cours...' : '✓ Soumettre à l\'admin'}
              </BtnCoupon>
            </div>
          </div>
        )}

        {/* Étape done */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📬</div>
            <div className="font-special" style={{ fontSize: 16, letterSpacing: 3, textTransform: 'uppercase', color: '#2d6a2d', marginBottom: 8 }}>
              Soumis avec succès
            </div>
            <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'hsl(var(--muted-foreground))', lineHeight: 1.7 }}>
              Votre achat est en attente de validation par notre équipe.<br />
              Le lecteur sera notifié dès que la livraison sera confirmée.
            </div>
            <div style={{ marginTop: 20 }}>
              <div className="font-special animate-stamp" style={{
                display: 'inline-block',
                border: '3px solid #2d6a2d', color: '#2d6a2d',
                fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
                padding: '6px 12px',
              }}>EN ATTENTE ADMIN</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}