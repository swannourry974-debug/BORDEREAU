import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import QrScannerModal from './QrScannerModal';

export default function PanelScanner() {
  const [scanning, setScanning] = useState(false);
  const [commande, setCommande] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionDone, setActionDone] = useState(false);
  const [user, setUser] = useState(null);
  const [relais, setRelais] = useState(null);
  const [manualId, setManualId] = useState('');
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (!u) return;
      const r = await base44.entities.PointRelais.filter({ gerant_email: u.email });
      setRelais(r[0] || null);
    }).catch(() => {});
  }, []);

  const handleScan = async (text) => {
    setScanning(false);
    setError(null);
    setCommande(null);
    setActionDone(false);
    setLoading(true);
    try {
      const cmdId = text.trim();

      if (cmdId.startsWith('BORDERO-SECURE:')) {
        const res = await base44.functions.invoke('validerRetraitBordero', { token: cmdId });
        if (!res.data?.valide) {
          setError(res.data?.raison || 'Échec d\'authentification de sécurité Bordero : incohérence entre le visuel de commande et le code de validation.');
          setLoading(false);
          return;
        }
        setCommande(res.data.commande);
        setActionDone(res.data.action === 'reception_relais' ? 'depot' : 'retrait');
        setLoading(false);
        return;
      }

      const cleanIsbn = cmdId.replace(/[^0-9X]/gi, '');
      const results = await base44.entities.Commande.filter({ id: cmdId });
      if (!results || results.length === 0) {
        const byQr = await base44.entities.Commande.list('-created_date', 200);
        const found = byQr.find(c => {
          const orderIsbn = String(c.code_barre_isbn || '').replace(/[^0-9X]/gi, '');
          return c.stripe_session_id === cmdId || c.id === cmdId || (cleanIsbn && orderIsbn === cleanIsbn);
        });
        if (!found) {
          setError('Bordero introuvable. Vérifiez le QR code sécurisé Bordero ou l’ISBN scanné.');
          setLoading(false);
          return;
        }
        setCommande(found);
      } else {
        setCommande(results[0]);
      }
    } catch (e) {
      setError('Erreur lors de la lecture du bordero.');
    }
    setLoading(false);
  };

  const handleDepot = async () => {
    if (!commande) return;
    setLoading(true);
    const now = new Date();
    const dateLimite = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await base44.entities.Commande.update(commande.id, {
      statut: 'au_relais',
      date_arrivee_relais: now.toISOString(),
      date_limite_collecte: dateLimite,
    });
    if (relais) {
      await base44.entities.PointRelais.update(relais.id, {
        stock_actuel: (relais.stock_actuel || 0) + 1,
      });
    }
    setActionDone('depot');
    setLoading(false);
  };

  const handleRetrait = async () => {
    if (!commande) return;
    setLoading(true);
    await base44.entities.Commande.update(commande.id, { statut: 'livree' });
    if (relais && relais.stock_actuel > 0) {
      await base44.entities.PointRelais.update(relais.id, {
        stock_actuel: Math.max(0, (relais.stock_actuel || 1) - 1),
      });
    }
    setActionDone('retrait');
    setLoading(false);
  };

  const reset = () => {
    setCommande(null);
    setError(null);
    setActionDone(false);
  };

  const getActionType = (cmd) => {
    if (!cmd) return null;
    if (cmd.statut === 'en_transit') return 'depot';
    if (cmd.statut === 'au_relais') return 'retrait';
    return null;
  };

  const actionType = getActionType(commande);

  return (
    <div className="space-y-5">
      {scanning && <QrScannerModal onScan={handleScan} onClose={() => setScanning(false)} />}

      <section className="relative overflow-hidden bordero-card-premium p-5 sm:p-6">
        <div className="pointer-events-none absolute right-5 top-4 font-heading text-8xl text-[#6E1E2E]/5">⬡</div>
        <div className="bordero-heading-section">Point Relais · Action sécurisée</div>
        <h1 className="mt-2 font-heading text-3xl font-bold text-[#6E1E2E] sm:text-4xl">Scanner un bordero</h1>
        <p className="mt-2 max-w-lg font-body text-[16px] italic leading-relaxed text-[#3B2A23]/64">Lecture QR, contrôle du visuel Bordero et résultat de dépôt ou retrait sans modifier le protocole existant.</p>
      </section>

      <button onClick={() => { reset(); setScanning(true); }} className="flex min-h-[76px] w-full items-center justify-center gap-3 bg-cta px-5 font-ui text-[12px] font-extrabold uppercase tracking-[0.24em] text-cta-foreground shadow-[0_14px_28px_rgba(194,65,12,0.20)]">
        <span className="text-2xl">⬡</span>
        Lancer le scanner
      </button>

      <section className="bordero-surface p-4">
        <button onClick={() => setShowManual(v => !v)} className="min-h-[44px] w-full border border-dashed border-[#6E1E2E]/24 bg-[#FFF8EA]/72 px-4 font-ui text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#6E1E2E]/70">
          ✎ Saisie manuelle de l'ID commande
        </button>
        {showManual && (
          <div className="mt-3 flex gap-2">
            <input type="text" value={manualId} onChange={e => setManualId(e.target.value)} placeholder="ID ou QR code de la commande…" className="min-w-0 flex-1 border border-[#6E1E2E]/24 bg-[#FFF8EA] px-3 py-2 font-mono text-sm text-[#1E1A18]" onKeyDown={e => { if (e.key === 'Enter' && manualId.trim()) { reset(); handleScan(manualId.trim()); setManualId(''); setShowManual(false); } }} />
            <button onClick={() => { if (manualId.trim()) { reset(); handleScan(manualId.trim()); setManualId(''); setShowManual(false); } }} disabled={!manualId.trim()} className="min-h-[44px] bg-[#6E1E2E] px-4 font-ui text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#F3E8D2] disabled:cursor-not-allowed disabled:opacity-50">OK</button>
          </div>
        )}
      </section>

      {loading && <div className="bordero-empty-state font-body italic">Chargement…</div>}

      {error && (
        <section className="border border-[#b41414]/35 bg-[#b41414]/6 p-4 text-[#b41414]">
          <div className="font-body text-sm italic leading-relaxed">❌ {error}</div>
          <button onClick={reset} className="mt-3 min-h-[40px] border border-dashed border-[#b41414]/45 px-4 font-ui text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#b41414]">Réessayer</button>
        </section>
      )}

      {commande && !actionDone && (
        <section className="bordero-card-premium p-5">
          <div className="bordero-heading-section">Bordero identifié</div>
          <h2 className="mt-2 font-heading text-2xl font-bold text-[#6E1E2E]">{commande.livre_titre}</h2>
          <div className="mt-3 grid gap-2 font-ui text-[10px] uppercase tracking-[0.12em] text-[#3B2A23]/52">
            <div>✍️ {commande.livre_auteur || '—'}</div>
            <div>👤 Lecteur : {commande.lecteur_email}</div>
            <div>🌍 Destination : {commande.zone_nom}</div>
            <div>📦 Mode : {commande.mode_livraison === 'express' ? 'Express' : 'Collectif'}</div>
          </div>

          {commande.visuel_bordero_url && (
            <div className="mt-4">
              <div className="mb-2 font-ui text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#6E1E2E]">Visuel sécurisé à comparer · {commande.visuel_bordero_serie || 'Série Bordero'} · Taille {commande.format_livre_bordero || '—'}</div>
              <img src={commande.visuel_bordero_url} alt="Visuel sécurisé Bordero" className="w-full border border-[#3B2A23]/24" />
            </div>
          )}

          <div className="mt-4 inline-flex rounded-full border border-[#C7A15A]/55 bg-[#C7A15A]/10 px-3 py-1 font-ui text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#8B6914]">Statut : {commande.statut?.replace(/_/g, ' ')}</div>

          {actionType === 'depot' && <div className="mt-4 border border-dashed border-[#8B6914]/45 bg-[#8B6914]/8 p-3 font-body text-sm italic leading-relaxed text-[#3B2A23]/70">Réception relais verrouillée : scannez le QR sécurisé Bordero présenté par le voyageur pour valider automatiquement le visuel, la taille S/M/L et le hash de sécurité.</div>}
          {actionType === 'retrait' && <div className="mt-4 border border-dashed border-[#2d6a2d]/45 bg-[#2d6a2d]/8 p-3 font-body text-sm italic leading-relaxed text-[#3B2A23]/70">Remise lecteur verrouillée : scannez le QR sécurisé affiché dans l’étagère du lecteur pour valider automatiquement le visuel officiel, la taille physique S/M/L et le hash de sécurité.</div>}
          {!actionType && <div className="mt-4 font-body text-sm italic text-[#3B2A23]/54">Aucune action possible pour ce statut.</div>}

          <button onClick={reset} className="mt-4 min-h-[44px] w-full border border-dashed border-[#6E1E2E]/22 bg-[#FFF8EA]/60 px-4 font-ui text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#6E1E2E]/60">Annuler</button>
        </section>
      )}

      {actionDone && (
        <section className="bordero-card-premium p-6 text-center" style={{ borderColor: actionDone === 'depot' ? '#8B6914' : '#2d6a2d' }}>
          <div className="mb-2 text-4xl">{actionDone === 'depot' ? '📦' : '✅'}</div>
          <h2 className="font-heading text-2xl font-bold text-[#6E1E2E]">{actionDone === 'depot' ? 'Dépôt confirmé !' : 'Remise confirmée !'}</h2>
          <p className="mt-2 font-body text-sm italic text-[#3B2A23]/60">{commande?.recu_horodate || (actionDone === 'depot' ? 'Le livre est bien enregistré dans votre stock.' : 'Le lecteur a bien récupéré son livre.')}</p>
          {commande?.visuel_bordero_url && <img src={commande.visuel_bordero_url} alt="Visuel validé Bordero" className="mt-4 w-full border border-[#3B2A23]/24" />}
          <button onClick={reset} className="mt-5 min-h-[44px] bg-[#6E1E2E] px-5 font-ui text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#F3E8D2]">Nouveau scan</button>
        </section>
      )}

      {!commande && !error && !loading && (
        <section className="bordero-surface p-4">
          <div className="mb-3 bordero-heading-section">Mode d'emploi</div>
          {[
            { step: '01', text: 'Demandez le bordero imprimé au lecteur ou voyageur' },
            { step: '02', text: 'Appuyez sur "Lancer le scanner" et pointez la caméra vers le QR code' },
            { step: '03', text: 'Le système identifie automatiquement le colis et l\'action à effectuer' },
            { step: '04', text: 'Confirmez le dépôt ou la remise du livre' },
          ].map(({ step, text }) => (
            <div key={step} className="flex gap-3 border-b border-dashed border-[#6E1E2E]/14 py-3 last:border-b-0">
              <span className="font-ui text-[10px] font-extrabold text-[#6E1E2E]">{step}</span>
              <span className="font-body text-sm italic leading-relaxed text-[#3B2A23]/64">{text}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}