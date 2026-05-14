import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const STATUT_CONFIG = {
  en_attente_paiement: { label: 'En attente', color: 'var(--sepia)', bg: 'rgba(139,105,20,0.08)' },
  payee:               { label: 'Payé', color: 'var(--bordeaux)', bg: 'rgba(128,0,32,0.06)' },
  en_transit:          { label: 'En transit', color: '#1a3a5c', bg: 'rgba(26,58,92,0.06)' },
  au_relais:           { label: 'Au relais', color: '#8B6914', bg: 'rgba(139,105,20,0.08)' },
  livree:              { label: 'Livré ✓', color: '#2d6a2d', bg: 'rgba(45,106,45,0.06)' },
  litige:              { label: 'Litige', color: '#b41414', bg: 'rgba(180,20,20,0.06)' },
};

export default function PanelWalletLecteur() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (!u) { setLoading(false); return; }
      const data = await base44.entities.Commande.filter({ lecteur_email: u.email }, '-created_date', 50);
      setCommandes(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalEconomies = commandes
    .filter(c => c.statut !== 'en_attente_paiement' && c.economie_realisee > 0)
    .reduce((sum, c) => sum + (c.economie_realisee || 0), 0);

  const nbLivres = commandes.filter(c => c.statut === 'livree').length;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.4)' }}>Chargement…</div>
      </div>
    );
  }

  return (
    <div>
      {/* Carte solde */}
      <div style={{
        background: 'var(--encre)', color: 'var(--creme)',
        padding: '20px', marginBottom: 20, position: 'relative', overflow: 'hidden',
      }}>
        <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 80, opacity: 0.05, fontFamily: 'Playfair Display, serif' }}>📚</span>
        <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.6, marginBottom: 14 }}>
          Portefeuille Lecteur
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.55, marginBottom: 4 }}>
              💰 Économies réalisées
            </div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, color: '#f0c040' }}>
              {totalEconomies > 0 ? `${totalEconomies.toFixed(2)} €` : '—'}
            </div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, opacity: 0.45, marginTop: 3 }}>
              vs UPS Express
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.55, marginBottom: 4 }}>
              Livres reçus
            </div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, color: '#a8d5a2' }}>
              {nbLivres}
            </div>
          </div>
        </div>
      </div>

      {/* Historique */}
      <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        Historique des commandes
        <span style={{ flex: 1, height: 1, background: 'repeating-linear-gradient(90deg, var(--bordeaux) 0, var(--bordeaux) 4px, transparent 4px, transparent 8px)' }} />
      </div>

      {commandes.length === 0 ? (
        <div style={{ background: 'var(--papier)', border: '1.5px dashed rgba(26,16,8,0.2)', padding: 32, textAlign: 'center' }}>
          <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.45)' }}>
            Aucune commande pour le moment.
          </div>
        </div>
      ) : commandes.map(c => {
        const cfg = STATUT_CONFIG[c.statut] || STATUT_CONFIG.en_attente_paiement;
        const date = c.created_date ? new Date(c.created_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
        return (
          <div key={c.id} style={{
            background: cfg.bg, border: `1px solid ${cfg.color}33`,
            borderLeft: `3px solid ${cfg.color}`,
            padding: '12px 14px', marginBottom: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 13, fontWeight: 700 }}>{c.livre_titre || '—'}</div>
                <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 10, color: 'rgba(26,16,8,0.5)', marginTop: 3 }}>
                  {c.livre_auteur || ''} · {c.zone_nom || ''} · {date}
                </div>
                {c.mode_livraison && (
                  <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, color: 'rgba(26,16,8,0.4)', marginTop: 2 }}>
                    {c.mode_livraison === 'express' ? '⚡ Express' : '📦 Collectif'}
                  </div>
                )}
                {c.economie_realisee > 0 && (
                  <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, color: '#8B6914', marginTop: 3, background: 'rgba(139,105,20,0.08)', padding: '2px 6px', display: 'inline-block' }}>
                    💰 −{c.economie_realisee.toFixed(2)} € vs UPS
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 700, color: cfg.color }}>
                  {c.montant_paye ? c.montant_paye.toFixed(2) + ' €' : '—'}
                </div>
                <div style={{
                  marginTop: 4, fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase',
                  padding: '2px 6px', border: `1px solid ${cfg.color}`, color: cfg.color,
                  fontFamily: 'Special Elite, monospace', display: 'inline-block',
                }}>
                  {cfg.label}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}