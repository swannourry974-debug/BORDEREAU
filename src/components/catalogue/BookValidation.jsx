import React, { useState } from 'react';
import CouponButton from '@/components/shared/CouponButton';
import ZoneSelector from '@/components/catalogue/ZoneSelector';
import VentilationCard from '@/components/catalogue/VentilationCard';
import { base44 } from '@/api/base44Client';
import { ZONES, POIDS_FORMAT, genererCodeSecret, getQuotaKg } from '@/lib/tarifsConfig';

const POIDS = POIDS_FORMAT;
const SEUIL_ALERTE_PAGES = 400;

function AlertePoids({ format, pages }) {
  if (!pages) return null;
  const attendu = format === 'Poche' ? 200 : 550;
  const calcule = Math.round(pages * 1.2);
  if (Math.abs(calcule - attendu) < 150) return null;

  return (
    <div style={{
      background: 'rgba(128,0,32,0.08)', border: '1px dashed var(--bordeaux)',
      padding: '10px 14px', marginBottom: 14, fontFamily: 'IM Fell English, serif',
      fontStyle: 'italic', fontSize: 12, color: 'var(--bordeaux)', lineHeight: 1.6,
    }}>
      ⚠️ Attention : ce livre ({pages} pages, ~{calcule}g) semble hors-norme pour un format {format}. Vérifiez le format réel avant de commander.
    </div>
  );
}

export default function BookValidation({ book, zone: zoneProp, onConfirm, onCancel }) {
  const [format, setFormat] = useState(book?.type === 'Broché' ? 'Broché' : 'Poche');
  const [prix, setPrix] = useState(book?.priceVal || '');
  const [condition, setCondition] = useState('neuf');
  const [modeLivraison, setModeLivraison] = useState('express');
  const [loading, setLoading] = useState(false);

  // Zone : utiliser la prop si fournie, sinon demander à l'utilisateur
  const defaultZone = zoneProp
    ? Object.values(ZONES).find(z => z.id === zoneProp?.id || z.label === zoneProp?.zone_nom) || ZONES.INTERNATIONAL
    : null;
  const [selectedZone, setSelectedZone] = useState(defaultZone);
  const [showZoneSelector, setShowZoneSelector] = useState(!defaultZone);

  const zone = selectedZone;
  const fraisService = zone
    ? (modeLivraison === 'express' ? zone.express.prix_client : zone.collectif.cout_moyen_livre)
    : 0;

  const poids = POIDS[format] || 200;
  const prixNum = parseFloat(String(prix).replace(',', '.')) || 0;
  const total = (prixNum + fraisService).toFixed(2);

  const handleConfirm = async () => {
    if (!zone) {
      alert('Veuillez sélectionner une zone de destination.');
      return;
    }
    if (!prixNum || prixNum < 1) {
      alert('Veuillez indiquer le prix TTC du livre (au dos du livre).');
      return;
    }
    setLoading(true);
    try {
      const codeSecret = genererCodeSecret();
      const commande = await base44.entities.Commande.create({
        livre_titre: book.title,
        livre_auteur: book.author,
        livre_type: format,
        code_barre_isbn: book.isbn || '',
        mode_livraison: modeLivraison,
        montant_paye: parseFloat(total),
        statut: 'en_attente_paiement',
        zone_nom: zone.label,
        zone_id: zone.id,
        notes: `Prix achat: ${prixNum}€ · Format: ${format} · Poids: ~${poids}g · Condition: ${condition} · Code: ${codeSecret}`,
        prix_livre_neuf: prixNum,
        code_secret: codeSecret,
      });
      // Stocker l'ID dans qr_code_depot pour que le scanner relais puisse retrouver la commande
      await base44.entities.Commande.update(commande.id, { qr_code_depot: commande.id });
      onConfirm({ book, format, prix: prixNum, total, poids, zone, modeLivraison, codeSecret, commandeId: commande.id });
    } catch (e) {
      alert('Erreur lors de la commande. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--papier)', border: '2px solid var(--encre)', padding: 20, marginBottom: 16, position: 'relative', boxShadow: '5px 5px 0 rgba(26,16,8,0.15)' }}>
      {/* Titre */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>
            Valider la commande
          </div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 16, color: 'var(--encre)' }}>
            {book?.title}
          </div>
          <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--sepia)' }}>
            {book?.author}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', padding: '3px 7px', border: '1px solid var(--encre)' }}>
              Format : {book?.type || format}
            </span>
            <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', padding: '3px 7px', border: '1px solid var(--bordeaux)', color: 'var(--bordeaux)' }}>
              Prix estimé : {book?.price || (prix ? `${String(prix).replace('.', ',')} €` : '—')}
            </span>
          </div>
        </div>
        {(book?.coverUrl || book?.coverId) && (
          <img
            src={book.coverUrl || `https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg`}
            alt={book.title}
            style={{ width: 52, height: 72, objectFit: 'cover', border: '1px solid hsl(var(--border))', flexShrink: 0 }}
          />
        )}
      </div>

      {/* Sélecteur de zone */}
      {showZoneSelector ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>
            Zone de destination
          </div>
          <ZoneSelector selected={selectedZone?.id} onSelect={z => { setSelectedZone(z); setShowZoneSelector(false); }} mode={modeLivraison} />
        </div>
      ) : zone && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '8px 12px', background: 'rgba(26,16,8,0.04)', border: '1px dashed hsl(var(--border))' }}>
          <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 11, letterSpacing: 1 }}>
            {zone.emoji} {zone.label} · {modeLivraison === 'express' ? `${zone.express.prix_client.toFixed(2)} €` : `~${zone.collectif.cout_moyen_livre.toFixed(2)} €`}
          </span>
          <button onClick={() => setShowZoneSelector(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Special Elite, monospace', fontSize: 9, color: 'var(--bordeaux)', letterSpacing: 1 }}>
            Changer
          </button>
        </div>
      )}

      {/* Mode livraison */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>
          Mode de livraison
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['express', '✈ Express', 'Voyageur individuel'], ['collectif', '📦 Collectif', 'Malle groupée']].map(([val, label, sub]) => (
            <button key={val} onClick={() => setModeLivraison(val)} style={{
              flex: 1, padding: '10px 8px', border: modeLivraison === val ? '2px solid var(--bordeaux)' : '1px dashed hsl(var(--border))',
              background: modeLivraison === val ? 'rgba(128,0,32,0.07)' : 'transparent',
              color: modeLivraison === val ? 'var(--bordeaux)' : 'hsl(var(--muted-foreground))',
              cursor: 'pointer', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 11, letterSpacing: 1 }}>{label}</div>
              <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 10, marginTop: 2 }}>{sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Ventilation des frais */}
      {zone && <VentilationCard zone={zone} mode={modeLivraison} />}

      {/* ISBN */}
      {book?.isbn && (
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'hsl(var(--muted-foreground))', marginBottom: 14, letterSpacing: 1 }}>
          ISBN : {book.isbn}
        </div>
      )}

      {/* Alerte poids hors norme */}
      <AlertePoids format={format} pages={book?.pages} />

      {/* Format */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>
          Format du livre
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Poche', 'Broché', 'BD', 'Relié'].map(f => (
            <button key={f} onClick={() => setFormat(f)} style={{
              flex: 1, padding: '8px 4px', border: format === f ? '2px solid var(--bordeaux)' : '1px dashed hsl(var(--border))',
              background: format === f ? 'rgba(128,0,32,0.08)' : 'transparent',
              color: format === f ? 'var(--bordeaux)' : 'hsl(var(--muted-foreground))',
              fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 1,
              cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.15s',
            }}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
          Poids estimé : ~{POIDS[format]}g
        </div>
      </div>

      {/* Condition */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>
          État du livre
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setCondition('neuf')} style={{
            flex: 1, padding: '8px 4px', border: condition === 'neuf' ? '2px solid var(--bordeaux)' : '1px dashed hsl(var(--border))',
            background: condition === 'neuf' ? 'rgba(128,0,32,0.08)' : 'transparent',
            color: condition === 'neuf' ? 'var(--bordeaux)' : 'hsl(var(--muted-foreground))',
            fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase',
          }}>
            ✦ Neuf
          </button>
          <button onClick={() => setCondition('occasion')} disabled style={{
            flex: 1, padding: '8px 4px', border: '1px dashed hsl(var(--border))',
            background: 'transparent', color: 'hsl(var(--muted-foreground))', opacity: 0.4,
            fontFamily: 'Special Elite, monospace', fontSize: 10, letterSpacing: 1, cursor: 'not-allowed', textTransform: 'uppercase',
          }}>
            Occasion (bientôt)
          </button>
        </div>
        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
          Le livre doit être acheté neuf en librairie agréée.
        </div>
      </div>

      {/* Prix TTC (Loi Lang) */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>
          Prix TTC au dos du livre — Loi Lang *
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number"
            min="1"
            step="0.01"
            value={prix}
            onChange={e => setPrix(e.target.value)}
            placeholder="9,90"
            style={{
              flex: 1, padding: '10px 12px', fontFamily: 'Playfair Display, serif',
              fontSize: 18, fontWeight: 700, color: 'var(--encre)',
              background: 'var(--creme)', border: '1.5px solid hsl(var(--border))',
              outline: 'none', textAlign: 'right',
            }}
          />
          <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 16, color: 'var(--encre)' }}>€</span>
        </div>
        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
          * Prix unique du livre neuf (obligatoire pour le calcul)
        </div>
      </div>

      {/* Total dynamique */}
      <div style={{ borderTop: '1.5px dashed rgba(26,16,8,0.2)', paddingTop: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 11, color: 'hsl(var(--muted-foreground))', letterSpacing: 1 }}>Prix du livre</span>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 13 }}>{prixNum ? `${prixNum.toFixed(2)} €` : '—'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 11, color: 'hsl(var(--muted-foreground))', letterSpacing: 1 }}>
            Frais de service ({modeLivraison === 'express' ? 'Express' : 'Collectif'})
          </span>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 13 }}>{fraisService.toFixed(2)} €</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid hsl(var(--border))', paddingTop: 8, marginTop: 4 }}>
          <span style={{ fontFamily: 'Special Elite, monospace', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>Total séquestre</span>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, color: 'var(--bordeaux)' }}>{prixNum ? `${total} €` : '—'}</span>
        </div>
      </div>

      {/* Boutons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <CouponButton onClick={handleConfirm} disabled={loading} style={{ flex: 1 }}>
          {loading ? '⟳ ...' : '✦ Confirmer & Payer'}
        </CouponButton>
        <CouponButton secondary onClick={onCancel}>Annuler</CouponButton>
      </div>
    </div>
  );
}