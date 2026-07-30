import React from 'react';
import CouponButton from '@/components/shared/CouponButton';

const STEPS = [
  { key: 'payee', label: 'En préparation' },
  { key: 'en_transit', label: 'Expédié / En cours d’acheminement' },
  { key: 'au_relais', label: 'Disponible en point relais / Livré' },
];

function activeIndex(statut) {
  if (statut === 'livree' || statut === 'au_relais') return 2;
  if (statut === 'en_transit') return 1;
  if (statut === 'payee') return 0;
  return -1;
}

function factureHtml(commande) {
  const date = new Date(commande.facture_emise_le || commande.created_date || Date.now()).toLocaleDateString('fr-FR');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Facture Bordero</title></head><body style="font-family:Arial,sans-serif;padding:32px;color:#1a1008"><h1>Facture Bordero</h1><p><strong>Référence :</strong> ${commande.facture_reference || commande.id}</p><p><strong>Date :</strong> ${date}</p><hr><p><strong>Livre :</strong> ${commande.livre_titre || ''}</p><p><strong>Auteur :</strong> ${commande.livre_auteur || ''}</p><p><strong>Destination :</strong> ${commande.zone_nom || ''}</p><p><strong>Mode :</strong> ${commande.mode_livraison || ''}</p><h2>Total : ${(commande.montant_paye || 0).toFixed(2)} €</h2><p>Merci d'avoir choisi Bordero.</p></body></html>`;
}

export default function CommandeFactureModal({ commande, onClose }) {
  if (!commande) return null;
  const current = activeIndex(commande.statut);

  const downloadFacture = () => {
    const blob = new Blob([factureHtml(commande)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture-bordero-${commande.facture_reference || commande.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(26,16,8,0.62)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 520, maxHeight: '88vh', overflowY: 'auto', background: 'var(--creme)', padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>Suivi & facture</div>
            <div className="font-playfair" style={{ fontSize: 20, fontWeight: 700 }}>{commande.livre_titre}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--bordeaux)', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ background: 'var(--papier)', border: '1.5px solid hsl(var(--border))', padding: 14, marginBottom: 14 }}>
          {STEPS.map((step, index) => {
            const done = index <= current;
            return (
              <div key={step.key} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: index === STEPS.length - 1 ? 0 : 10 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: done ? 'var(--bordeaux)' : 'hsl(var(--border))', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: done ? 700 : 400, color: done ? 'var(--encre)' : 'hsl(var(--muted-foreground))' }}>{step.label}</span>
              </div>
            );
          })}
        </div>

        <div style={{ background: 'rgba(45,106,45,0.08)', border: '1px dashed #2d6a2d', padding: 12, fontSize: 12, lineHeight: 1.6, marginBottom: 14 }}>
          Génération de facture et suivi activés. Mode choisi : {commande.suivi_facturation_mode === 'email' ? 'e-mail uniquement' : "via l'application"}.
        </div>

        <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 14 }}>
          Facture {commande.facture_reference || commande.id} · Total {(commande.montant_paye || 0).toFixed(2)} € · {commande.zone_nom || 'Destination à confirmer'}
        </div>

        <CouponButton onClick={downloadFacture} className="w-full py-3">Télécharger la facture</CouponButton>
      </div>
    </div>
  );
}