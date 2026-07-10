import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ProfilsTableau from '../relais/ProfilsTableau';
import NotationRelais from '../relais/NotationRelais';

const STATUT_LABELS = {
  payee: { label: 'Payé', color: 'var(--bordeaux)' },
  en_transit: { label: '🚚 En transit', color: '#1a3a5c' },
  au_relais: { label: '📦 Au relais', color: '#8B6914' },
  livree: { label: '✓ Livré', color: '#2d6a2d' },
  litige: { label: '⚠️ Litige', color: '#b41414' },
};

export default function PanelStock() {
  const [view, setView] = useState('stock');
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relais, setRelais] = useState(null);
  const [user, setUser] = useState(null);
  const [stockCount, setStockCount] = useState(0);
  const [relayActive, setRelayActive] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState('idle');

  const load = async () => {
    setLoading(true);
    try {
      const u = await base44.auth.me();
      setUser(u);
      if (!u) { setLoading(false); return; }
      const r = await base44.entities.PointRelais.filter({ gerant_email: u.email });
      setRelais(r[0] || null);
      setRelayActive(r[0]?.actif !== false);

      // Charger toutes les commandes liées à ce relais
      let cmds = [];
      if (r[0]) {
        cmds = await base44.entities.Commande.filter({ point_relais_id: r[0].id }, '-created_date', 100);
      } else {
        // Admin sans relais assigné : voir toutes
        cmds = await base44.entities.Commande.list('-created_date', 100);
      }
      setCommandes(cmds || []);
      setStockCount(r[0]?.stock_actuel ?? (cmds || []).filter(c => c.statut === 'au_relais').length);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStockCount = async (nextValue) => {
    const next = Math.max(0, nextValue);
    setStockCount(next);
    if (relais) {
      await base44.entities.PointRelais.update(relais.id, { stock_actuel: next });
      setRelais(prev => prev ? { ...prev, stock_actuel: next } : prev);
    }
  };

  const toggleRelayActive = async () => {
    const next = !relayActive;
    setRelayActive(next);
    if (relais) {
      await base44.entities.PointRelais.update(relais.id, { actif: next });
      setRelais(prev => prev ? { ...prev, actif: next } : prev);
    }
  };

  const notifyInventoryChange = async () => {
    if (!user?.email) return;
    setNotificationStatus('sending');
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: 'Mise à jour du stock relais',
        body: `Votre stock relais vient d'être mis à jour : ${stockCount} colis enregistrés. Statut du relais : ${relayActive ? 'actif' : 'inactif'}.`,
      });
      setNotificationStatus('sent');
    } catch (e) {
      setNotificationStatus('error');
    }
  };

  const auRelais = commandes.filter(c => c.statut === 'au_relais');
  const enTransit = commandes.filter(c => c.statut === 'en_transit');
  const livrees = commandes.filter(c => c.statut === 'livree');

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'var(--bordeaux)', color: 'var(--creme)',
        padding: '18px 20px', marginBottom: 20, position: 'relative', overflow: 'hidden'
      }}>
        <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 60, opacity: 0.1 }}>⬡</span>
        <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.7, marginBottom: 6, fontFamily: 'Special Elite, monospace' }}>
          Tableau de bord · Relais
        </div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
          Gestion du stock
        </div>
        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, opacity: 0.75, marginTop: 6 }}>
          {auRelais.length} colis en attente · Stock : {stockCount} · Relais {relayActive ? 'actif' : 'inactif'}
        </div>
      </div>

      {/* Contrôles relais */}
      <div style={{
        background: 'var(--papier)', border: '1.5px solid rgba(26,16,8,0.2)',
        padding: 16, marginBottom: 18, boxShadow: '3px 3px 0 rgba(26,16,8,0.10)',
      }}>
        <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(26,16,8,0.5)', marginBottom: 12 }}>
          Statut & inventaire relais
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <button type="button" aria-label={relayActive ? 'Désactiver le relais' : 'Activer le relais'} onClick={toggleRelayActive} style={{
            background: relayActive ? '#2d6a2d' : 'var(--bordeaux)', color: 'var(--creme)',
            border: 'none', padding: '12px 10px', cursor: 'pointer', fontFamily: 'Special Elite, monospace',
            fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
          }}>
            {relayActive ? '✓ Désactiver le relais' : '▶ Activer le relais'}
          </button>
          <button type="button" aria-label="Notifier les changements d'inventaire" onClick={notifyInventoryChange} disabled={notificationStatus === 'sending'} style={{
            background: 'var(--encre)', color: 'var(--creme)', border: 'none', padding: '12px 10px',
            cursor: notificationStatus === 'sending' ? 'wait' : 'pointer', fontFamily: 'Special Elite, monospace',
            fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', opacity: notificationStatus === 'sending' ? 0.6 : 1,
          }}>
            {notificationStatus === 'sending' ? 'Envoi...' : notificationStatus === 'sent' ? '✓ Inventaire notifié' : 'Notifier inventaire'}
          </button>
        </div>
        <label htmlFor="stock-quantity" style={{ display: 'block', fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(26,16,8,0.5)', marginBottom: 6 }}>
          Mettre à jour la quantité de stock
        </label>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <input
              id="stock-quantity"
              aria-label="Quantité de stock"
              type="number"
              min="0"
              value={stockCount}
              onChange={(e) => updateStockCount(Number(e.target.value) || 0)}
              style={{ width: 96, background: 'var(--creme)', border: '1.5px solid rgba(128,0,32,0.35)', padding: '8px 10px', fontFamily: 'Special Elite, monospace', fontSize: 18, fontWeight: 700, color: 'var(--bordeaux)' }}
            />
            <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.55)', marginTop: 4 }}>colis enregistrés</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" aria-label="Réduire le stock" onClick={() => updateStockCount(stockCount - 1)} style={{ width: 42, height: 38, border: '1.5px solid var(--bordeaux)', background: 'var(--creme)', color: 'var(--bordeaux)', cursor: 'pointer', fontSize: 20 }}>−</button>
            <button type="button" aria-label="Augmenter le stock" onClick={() => updateStockCount(stockCount + 1)} style={{ width: 42, height: 38, border: '1.5px solid var(--bordeaux)', background: 'var(--bordeaux)', color: 'var(--creme)', cursor: 'pointer', fontSize: 20 }}>+</button>
          </div>
        </div>
        {notificationStatus === 'error' && (
          <div style={{ marginTop: 10, fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: '#b41414' }}>
            Notification impossible pour le moment.
          </div>
        )}
      </div>

      {/* Toggle */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {[
          { id: 'stock', icon: '📦', label: 'Colis au relais' },
          { id: 'transit', icon: '🚚', label: 'En transit' },
          { id: 'notation', icon: '★', label: 'Notation' },
          { id: 'profils', icon: '📊', label: 'Profils' },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            flex: 1, background: view === v.id ? 'var(--bordeaux)' : 'var(--papier)',
            color: view === v.id ? 'var(--creme)' : 'var(--bordeaux)',
            border: '1.5px solid var(--bordeaux)', padding: '12px 8px',
            fontFamily: 'Special Elite, monospace', fontSize: 10,
            letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.15s',
          }}>
            <span>{v.icon}</span>{v.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, fontFamily: 'IM Fell English, serif', fontStyle: 'italic', color: 'rgba(26,16,8,0.4)' }}>
          Chargement…
        </div>
      ) : (
        <>
          {view === 'stock' && (
            <>
              <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                Colis au relais ({auRelais.length})
                <span style={{ flex: 1, height: 1, background: 'repeating-linear-gradient(90deg, var(--bordeaux) 0, var(--bordeaux) 4px, transparent 4px, transparent 8px)' }} />
              </div>

              {auRelais.length === 0 ? (
                <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.4)', textAlign: 'center', padding: '24px 0' }}>
                  Aucun colis au relais pour le moment.
                </div>
              ) : auRelais.map(c => (
                <div key={c.id} style={{
                  background: 'var(--papier)', border: '1px solid hsl(var(--border))',
                  borderLeft: '4px solid #8B6914', padding: '12px 14px', marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: '#8B6914' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 13, fontWeight: 700 }}>{c.livre_titre}</div>
                    <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 10, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                      {c.livre_auteur} · Lecteur : {c.lecteur_email?.split('@')[0]}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase',
                    padding: '2px 7px', border: '1px solid #8B6914', color: '#8B6914',
                    fontFamily: 'Special Elite, monospace',
                  }}>À remettre</div>
                </div>
              ))}

              {/* Livres récemment remis */}
              {livrees.length > 0 && (
                <>
                  <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#2d6a2d', margin: '20px 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Livrés récemment ({livrees.length})
                    <span style={{ flex: 1, height: 1, background: 'repeating-linear-gradient(90deg, #2d6a2d 0, #2d6a2d 4px, transparent 4px, transparent 8px)' }} />
                  </div>
                  {livrees.slice(0, 5).map(c => (
                    <div key={c.id} style={{
                      background: 'var(--papier)', border: '1px solid hsl(var(--border))',
                      borderLeft: '4px solid #2d6a2d', padding: '10px 14px', marginBottom: 8,
                      display: 'flex', alignItems: 'center', gap: 12, opacity: 0.7,
                    }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: '#2d6a2d' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 12, fontWeight: 700 }}>{c.livre_titre}</div>
                        <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>{c.lecteur_email?.split('@')[0]}</div>
                      </div>
                      <div style={{ fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', padding: '2px 7px', border: '1px solid #2d6a2d', color: '#2d6a2d', fontFamily: 'Special Elite, monospace' }}>✓ Livré</div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {view === 'transit' && (
            <>
              <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#1a3a5c', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                En transit vers votre relais ({enTransit.length})
                <span style={{ flex: 1, height: 1, background: 'repeating-linear-gradient(90deg, #1a3a5c 0, #1a3a5c 4px, transparent 4px, transparent 8px)' }} />
              </div>
              {enTransit.length === 0 ? (
                <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.4)', textAlign: 'center', padding: '24px 0' }}>
                  Aucun livre en transit pour le moment.
                </div>
              ) : enTransit.map(c => (
                <div key={c.id} style={{
                  background: 'var(--papier)', border: '1px solid hsl(var(--border))',
                  borderLeft: '4px solid #1a3a5c', padding: '12px 14px', marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: '#1a3a5c', animation: 'pulse 2s infinite' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 13, fontWeight: 700 }}>{c.livre_titre}</div>
                    <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 10, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                      Voyageur : {c.voyageur_email?.split('@')[0] || '—'} · Mode : {c.mode_livraison}
                    </div>
                  </div>
                  <div style={{ fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', padding: '2px 7px', border: '1px solid #1a3a5c', color: '#1a3a5c', fontFamily: 'Special Elite, monospace' }}>En vol</div>
                </div>
              ))}
            </>
          )}

          {view === 'notation' && <NotationRelais commandes={commandes} relaisEmail={user?.email} />}
          {view === 'profils' && <ProfilsTableau />}
        </>
      )}
    </div>
  );
}