import React, { useState, useEffect } from 'react';
import { SectionTitle, BtnCoupon, PerfoStrip } from './shared';
import JaugeValise from '../missions/JaugeValise';
import WalletCard from '../missions/WalletCard';
import BadgeShowcase from '../missions/BadgeShowcase';
import PullToRefresh from '../shared/PullToRefresh';
import ScanValidation from '../missions/ScanValidation';
import FormulaireVol from '../missions/FormulaireVol';
import { BADGES_CONFIG, getBadgesDebloques } from '@/lib/badges';
import { base44 } from '@/api/base44Client';

const MAX_LIVRES = 10;

// Commission par rang
function getCommission(rang) {
  if (rang === 1) return 5.00;
  if (rang === 2) return 6.50;
  return 8.00;
}

function getTotalCommission(n) {
  let t = 0;
  for (let i = 1; i <= n; i++) t += getCommission(i);
  return Math.round(t * 100) / 100;
}

const AVAILABLE_MISSIONS = [
  { id: 10, ville: 'MIAMI, FL', date: "Accepte jusqu'au 26 avril · Vol AF038", livre: 'Le Petit Prince', type: 'Poche', poids: '180g' },
  { id: 11, ville: 'MIAMI, FL', date: "Accepte jusqu'au 26 avril", livre: "L'Élégance du hérisson", type: 'Poche', poids: '310g' },
  { id: 12, ville: 'MIAMI, FL', date: "Accepte jusqu'au 28 avril", livre: 'Madame Bovary', type: 'Poche', poids: '290g' },
];

function MissionCard({ mission, rang, onAccept, disabled, onScan }) {
  const [loading, setLoading] = useState(false);
  const commission = rang ? getCommission(rang) : null;

  const handleAccept = () => {
    if (disabled) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onAccept(mission.id, commission);
    }, 800);
  };

  const isEngaged = !!mission.engaged;

  return (
    <div style={{
      background: 'var(--papier)',
      border: '1.5px solid hsl(var(--border))',
      padding: 16,
      marginBottom: 12,
      position: 'relative',
      boxShadow: '3px 3px 0 rgba(26,16,8,0.12)',
      animation: 'fadeSlideIn 0.4s ease both',
      opacity: isEngaged ? 0.75 : 1,
    }}>
      {/* Corner */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        borderStyle: 'solid', borderWidth: '0 32px 32px 0',
        borderColor: `transparent var(--bordeaux) transparent transparent`,
      }} />

      <div className="font-special" style={{ fontSize: 18, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>
        {mission.ville}
      </div>
      <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 10 }}>
        {isEngaged ? 'Ticket scanné · Achat confirmé · ENGAGÉE' : mission.date}
      </div>
      <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>
        📚 <em>{mission.livre}</em> · {mission.type} · {mission.poids}
      </div>

      {/* Badge rang si engagé */}
      {isEngaged && mission.rang && (
        <div style={{
          display: 'inline-block',
          background: 'rgba(45,106,45,0.1)',
          border: '1px solid #2d6a2d',
          color: '#2d6a2d',
          fontFamily: 'Special Elite, monospace',
          fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
          padding: '2px 8px', marginBottom: 8,
        }}>
          Livre n°{mission.rang} · +{mission.commission?.toFixed(2)} € de gratification
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed rgba(26,16,8,0.2)', paddingTop: 10, marginTop: 4 }}>
        <div>
          <span className="font-playfair" style={{ fontSize: 22, fontWeight: 700, color: isEngaged ? 'hsl(var(--muted-foreground))' : 'var(--bordeaux)' }}>
            {commission ? `${commission.toFixed(2)} €` : (mission.commission ? `${mission.commission.toFixed(2)} €` : '—')}
          </span>
          <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', letterSpacing: 1, display: 'block', marginTop: -2 }}>
            {isEngaged ? 'En séquestre' : 'Commission'}
          </span>
        </div>

        {isEngaged ? (
          <BtnCoupon onClick={() => onScan && onScan(mission)} secondary style={{ borderColor: '#1a3a5c', color: '#1a3a5c' }}>📷 Scanner l'achat</BtnCoupon>
        ) : (
          <BtnCoupon onClick={handleAccept} disabled={disabled || loading}>
            {loading ? '⟳ ...' : disabled ? '⛔ Valise pleine' : 'Accepter'}
          </BtnCoupon>
        )}
      </div>

      {isEngaged && (
        <div className="font-special animate-stamp" style={{
          position: 'absolute', right: 14, top: '50%',
          transform: 'translateY(-50%) rotate(-12deg)',
          border: '3px solid #1a3a5c', color: '#1a3a5c',
          fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
          padding: '4px 8px', opacity: 0.7, pointerEvents: 'none',
        }}>ENGAGÉE</div>
      )}
    </div>
  );
}

export default function PanelMissions() {
  const [engagees, setEngagees] = useState([
    { id: 3, ville: 'MIAMI, FL', date: 'Ticket scanné · Achat confirmé', livre: 'Astérix T.1', type: 'BD', poids: '250g', engaged: true, rang: 1, commission: 5.00 },
  ]);
  const [available, setAvailable] = useState(AVAILABLE_MISSIONS);
  const [scanMission, setScanMission] = useState(null);
  const [newBadge, setNewBadge] = useState(null);
  const [user, setUser] = useState(null);
  const [voyageActif, setVoyageActif] = useState(null);
  const [showFormVol, setShowFormVol] = useState(false);

  // Wallet (simulé)
  const [wallet] = useState({ soldeDisponible: 12.50, gainsPrevisionnels: 5.00, virementSuspendu: false });

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (!u) return;
      const voyages = await base44.entities.Voyage.filter({ voyageur_email: u.email, actif: true });
      if (voyages.length > 0) setVoyageActif(voyages[0]);
    }).catch(() => {});
  }, []);

  const livresActifs = engagees.length;
  const totalCommission = getTotalCommission(livresActifs);
  const limitAtteinte = livresActifs >= MAX_LIVRES;

  // Stats pour les badges (simulées — missionsAcceptees = nb total engagées)
  const statsActuelles = {
    livresLivres: 12,
    livraisonsRapides: 4,
    livraisonsUltraRapides: 1,
    maxLivresParVoyage: livresActifs,
    missionsAcceptees: 7 + engagees.filter(e => e.engaged).length,
    paysVisites: 2,
  };

  // Filtrer les missions selon la ville d'arrivée du voyage actif
  const missionsFiltered = voyageActif
    ? available.filter(m => m.ville.toLowerCase().includes(voyageActif.arrivee_ville.toLowerCase()))
    : available;

  const acceptMission = (id, commission) => {
    const mission = available.find(m => m.id === id);
    if (!mission || limitAtteinte) return;
    const rang = livresActifs + 1;

    const statsBefore = { ...statsActuelles };
    const statsAfter = { ...statsActuelles, missionsAcceptees: statsActuelles.missionsAcceptees + 1, maxLivresParVoyage: rang };

    const before = getBadgesDebloques(statsBefore);
    const after = getBadgesDebloques(statsAfter);
    const nouveaux = after.filter(id => !before.includes(id));

    setEngagees(prev => [...prev, { ...mission, engaged: true, rang, commission }]);
    setAvailable(prev => prev.filter(m => m.id !== id));

    if (nouveaux.length > 0) {
      const badge = BADGES_CONFIG.find(b => b.id === nouveaux[0]);
      if (badge) {
        setTimeout(() => setNewBadge(badge), 500);
      }
    }
  };

  const handleRefresh = async () => {
    setAvailable(AVAILABLE_MISSIONS);
    await new Promise(r => setTimeout(r, 800));
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div>

      {/* Notification nouveau badge */}
      {newBadge && (
        <div
          onClick={() => setNewBadge(null)}
          style={{
            position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
            zIndex: 500, background: 'var(--encre)', color: 'var(--creme)',
            padding: '16px 24px', maxWidth: 320, width: '90%',
            border: '2px solid var(--bordeaux)',
            boxShadow: '0 0 20px rgba(128,0,32,0.4)',
            animation: 'fadeSlideIn 0.4s ease',
            cursor: 'pointer', textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 6 }}>{newBadge.emoji}</div>
          <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--bordeaux)', marginBottom: 4 }}>
            Badge débloqué !
          </div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
            {newBadge.nom}
          </div>
          <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, opacity: 0.7, lineHeight: 1.5 }}>
            {newBadge.description}
          </div>
          <div style={{ marginTop: 10, fontFamily: 'Special Elite, monospace', fontSize: 8, letterSpacing: 2, opacity: 0.4, textTransform: 'uppercase' }}>
            Appuyez pour fermer
          </div>
        </div>
      )}

      {/* Wallet */}
      <WalletCard
        soldeDisponible={wallet.soldeDisponible}
        gainsPrevisionnels={wallet.gainsPrevisionnels}
        virementSuspendu={wallet.virementSuspendu}
      />

      {/* Jauge valise */}
      <JaugeValise livresActifs={livresActifs} totalCommission={totalCommission} />

      {/* Scan Validation Modal */}
      {scanMission && (
        <ScanValidation
          mission={scanMission}
          onClose={() => setScanMission(null)}
          onValidated={() => setScanMission(null)}
        />
      )}

      {/* Missions engagées */}
      {engagees.length > 0 && (
        <>
          <SectionTitle>Missions engagées</SectionTitle>
          {engagees.map(m => (
            <MissionCard key={m.id} mission={m} onAccept={() => {}} disabled={false} onScan={setScanMission} />
          ))}
          <PerfoStrip />
        </>
      )}

      {/* Missions disponibles */}
      <SectionTitle>Missions disponibles</SectionTitle>

      {limitAtteinte && (
        <div style={{
          background: 'rgba(128,0,32,0.08)',
          border: '1px dashed #800020',
          padding: '12px 16px', marginBottom: 16,
          fontFamily: 'IM Fell English, serif', fontStyle: 'italic',
          fontSize: 13, color: 'var(--bordeaux)', lineHeight: 1.6,
        }}>
          🔒 Limite de sécurité atteinte (10 livres max) pour garantir un passage serein en douane.
        </div>
      )}

      {available.length === 0 && !limitAtteinte && (
        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'hsl(var(--muted-foreground))', textAlign: 'center', padding: 20 }}>
          Aucune mission disponible pour ce trajet.
        </div>
      )}

      {voyageActif && (
        <div style={{
          background: 'rgba(45,106,45,0.07)', border: '1px solid #2d6a2d',
          padding: '10px 14px', marginBottom: 12,
          fontFamily: 'IM Fell English, serif', fontStyle: 'italic',
          fontSize: 12, color: '#2d6a2d', lineHeight: 1.6,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          ✈️ <span>Filtré sur <strong>{voyageActif.arrivee_ville}</strong> · {voyageActif.date_vol}</span>
        </div>
      )}

      {missionsFiltered.length === 0 && !limitAtteinte && (
        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'hsl(var(--muted-foreground))', textAlign: 'center', padding: 20 }}>
          {voyageActif
            ? `Aucune mission pour "${voyageActif.arrivee_ville}" pour le moment.`
            : 'Aucune mission disponible pour ce trajet.'}
        </div>
      )}

      {missionsFiltered.map((m, i) => {
        const rang = livresActifs + 1;
        return (
          <MissionCard
            key={m.id}
            mission={m}
            rang={rang}
            onAccept={acceptMission}
            disabled={limitAtteinte}
          />
        );
      })}

      <PerfoStrip />

      {/* Palmarès Voyageur */}
      <SectionTitle>Palmarès</SectionTitle>
      <BadgeShowcase stats={statsActuelles} />

      <PerfoStrip />

      <SectionTitle>Déclarer un nouveau vol</SectionTitle>
      {!showFormVol ? (
        <div style={{ background: 'var(--papier)', border: '1.5px dashed hsl(var(--border))', padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✈️</div>
          {voyageActif && (
            <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.55)', marginBottom: 10 }}>
              Vol actif : <strong>{voyageActif.depart_ville} → {voyageActif.arrivee_ville}</strong> · {voyageActif.date_vol}
            </div>
          )}
          <div className="font-fell" style={{ fontSize: 13, color: 'rgba(26,16,8,0.5)', marginBottom: 14, fontStyle: 'italic' }}>
            {voyageActif ? 'Déclarer un autre voyage ?' : 'Vous avez un voyage prévu ?'}
          </div>
          <BtnCoupon onClick={() => setShowFormVol(true)}>+ Déclarer un vol</BtnCoupon>
        </div>
      ) : (
        <FormulaireVol
          user={user}
          onVolDeclare={(voyage) => {
            setVoyageActif(voyage);
            setShowFormVol(false);
          }}
        />
      )}
    </div>
    </PullToRefresh>
  );
}