import React, { useState, useEffect } from 'react';
import { SectionTitle, BtnCoupon, PerfoStrip } from './shared';
import JaugeValise from '../missions/JaugeValise';
import WalletCard from '../missions/WalletCard';
import BadgeShowcase from '../missions/BadgeShowcase';
import PullToRefresh from '../shared/PullToRefresh';
import ScanValidation from '../missions/ScanValidation';
import FormulaireVol from '../missions/FormulaireVol';
import CalendrierVoyageur from '@/components/voyageur/CalendrierVoyageur';
import CalculatriceRevenus from '@/components/voyageur/CalculatriceRevenus';
import QuotaJauge from '@/components/voyageur/QuotaJauge';
import FiltreVille from '@/components/missions/FiltreVille';
import { BADGES_CONFIG, getBadgesDebloques } from '@/lib/badges';
import { base44 } from '@/api/base44Client';
import { ZONES, POIDS_FORMAT, getQuotaLivres, getQuotaKg } from '@/lib/tarifsConfig';
import { useSearchParams } from 'react-router-dom';

// Commission Express par zone et rang du livre dans la valise
function getCommission(zone, rang) {
  const part = zone?.express?.part_voyageur ?? 10.00;
  // Bonus progressif : +10% par rang supplémentaire (encourage à remplir la valise)
  return Math.round(part * (1 + (rang - 1) * 0.1) * 100) / 100;
}

function getTotalCommission(missions, zone) {
  return missions.reduce((t, m, i) => t + getCommission(zone, i + 1), 0);
}

const AVAILABLE_MISSIONS = [];

function formatMissionRecord(record) {
  return {
    id: record.id,
    source: 'db',
    ville: record.ville_destination || 'Destination',
    date: record.date_limite ? `Accepte jusqu'au ${new Date(record.date_limite).toLocaleDateString('fr-FR')}` : 'Mission disponible',
    livre: record.livre || 'Livre',
    type: record.type || 'Poche',
    poids: record.poids || '200g',
    zone_id: record.zone_id || 'international',
    mode_livraison: record.mode_livraison || 'express',
    date_limite: record.date_limite,
    commission: record.commission,
  };
}

function MissionCard({ mission, rang, onAccept, disabled, onScan, onRemove }) {
  const [loading, setLoading] = useState(false);
  const missionZone = Object.values(ZONES).find(z => z.id === mission.zone_id) || ZONES.INTERNATIONAL;
  const commission = rang ? (mission.commission || getCommission(missionZone, rang)) : null;

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

      {isEngaged && onRemove && (
        <button
          type="button"
          aria-label="Retirer cette mission"
          title="Retirer cette mission"
          onClick={() => onRemove(mission)}
          style={{
            position: 'absolute', top: 6, right: 6, zIndex: 3,
            width: 44, height: 44, border: 'none', borderRadius: '50%',
            background: 'var(--creme)', color: 'var(--bordeaux)',
            fontFamily: 'Special Elite, monospace', fontSize: 18, lineHeight: '44px',
            cursor: 'pointer', boxShadow: '0 1px 4px rgba(26,16,8,0.25)',
          }}
        >×</button>
      )}

      <div className="font-special" style={{ fontSize: 18, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>
        {mission.ville}
      </div>
      <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 10 }}>
        {isEngaged ? (mission.status === 'livree' ? 'Livraison confirmée · Mission terminée' : mission.status === 'en_transit' ? 'Achat confirmé · En transit' : 'En attente du scan d’achat') : mission.date}
      </div>
      <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>
        📚 <em>{mission.livre}</em> · {mission.type} · {mission.poids}
      </div>

      {/* Badge rang si engagé */}
      {isEngaged && mission.rang && (
        <div style={{
          display: 'inline-block',
          background: mission.status === 'livree' ? 'rgba(45,106,45,0.1)' : mission.status === 'en_transit' ? 'rgba(26,58,92,0.1)' : 'rgba(128,0,32,0.08)',
          border: `1px solid ${mission.status === 'livree' ? '#2d6a2d' : mission.status === 'en_transit' ? '#1a3a5c' : 'var(--bordeaux)'}`,
          color: mission.status === 'livree' ? '#2d6a2d' : mission.status === 'en_transit' ? '#1a3a5c' : 'var(--bordeaux)',
          fontFamily: 'Special Elite, monospace',
          fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
          padding: '2px 8px', marginBottom: 8,
        }}>
          {mission.status === 'livree' ? 'Livraison confirmée' : mission.status === 'en_transit' ? 'En transit vers relais' : 'Achat à scanner'} · +{mission.commission?.toFixed(2)} €
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
          mission.status === 'livree' ? (
            <BtnCoupon disabled secondary style={{ borderColor: '#2d6a2d', color: '#2d6a2d' }}>✓ Livrée</BtnCoupon>
          ) : mission.status === 'en_transit' ? (
            <BtnCoupon onClick={() => onScan && onScan(mission, 'livree')} style={{ background: '#2d6a2d' }}>✓ Confirmer livraison</BtnCoupon>
          ) : (
            <BtnCoupon onClick={() => onScan && onScan(mission, 'scan')} secondary style={{ borderColor: '#1a3a5c', color: '#1a3a5c' }}>📷 Scanner l'achat</BtnCoupon>
          )
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
  const [engagees, setEngagees] = useState([]);
  const [available, setAvailable] = useState(AVAILABLE_MISSIONS);
  const [scanMission, setScanMission] = useState(null);
  const [newBadge, setNewBadge] = useState(null);
  const [user, setUser] = useState(null);
  const [voyages, setVoyages] = useState([]);
  const [voyageActif, setVoyageActif] = useState(null);
  const [voyageurValidationStatus, setVoyageurValidationStatus] = useState('aucune');
  const [modeLivraison, setModeLivraison] = useState('express');
  const [showFormVol, setShowFormVol] = useState(false);
  const [filtreVille, setFiltreVille] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const modalParam = searchParams.get('modal');

  // Wallet (simulé)
  const [wallet] = useState({ soldeDisponible: 12.50, gainsPrevisionnels: 5.00, virementSuspendu: false });

  const loadAvailableMissions = async () => {
    const missions = await base44.entities.MissionVoyageur.filter({ statut: 'disponible' }, '-created_date', 80);
    setAvailable(missions?.length ? missions.map(formatMissionRecord) : []);
  };

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (!u) return;
      const voyages = await base44.entities.Voyage.filter({ voyageur_email: u.email });
      setVoyages(voyages || []);
      const dernierVoyage = voyages[0];
      setVoyageurValidationStatus(u.voyageur_validation_status || dernierVoyage?.validation_admin || 'aucune');
      const voyageValide = voyages.find(v => v.actif && v.validation_admin === 'valide');
      if (voyageValide) setVoyageActif(voyageValide);
      await loadAvailableMissions();
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (modalParam !== 'scan-validation') setScanMission(null);
  }, [modalParam]);

  const setModalParam = (modal) => {
    const next = new URLSearchParams(searchParams);
    next.set('modal', modal);
    setSearchParams(next);
  };

  const clearModalParam = (modal) => {
    const next = new URLSearchParams(searchParams);
    if (next.get('modal') === modal) {
      next.delete('modal');
      setSearchParams(next, { replace: true });
    }
  };

  // Détecter la zone du voyage actif pour appliquer le bon quota
  const zoneVoyage = voyageActif
    ? Object.values(ZONES).find(z => voyageActif.arrivee_ville?.toLowerCase().includes(z.id.split('_')[0])) || ZONES.INTERNATIONAL
    : ZONES.INTERNATIONAL;

  const quotaLivres = getQuotaLivres(zoneVoyage);
  const quotaKg = getQuotaKg(zoneVoyage);

  const missionsActives = engagees.filter(m => m.status !== 'livree');
  const missionsArchivees = engagees.filter(m => m.status === 'livree');
  const validationBloquee = user?.voyageur_bloque || voyageurValidationStatus === 'bloque';
  const validationEnAttente = ['en_attente', 'suspendu'].includes(voyageurValidationStatus);

  // Calcul poids total engagé (en grammes)
  const poidsEngageG = missionsActives.reduce((sum, m) => {
    const poidsStr = m.poids || '200g';
    return sum + parseInt(poidsStr.replace('g', '')) || 200;
  }, 0);

  const livresActifs = missionsActives.length;
  const totalCommission = getTotalCommission(missionsActives, zoneVoyage);
  const limitAtteinte = livresActifs >= quotaLivres || poidsEngageG / 1000 >= quotaKg;

  // Stats pour les badges (simulées — missionsAcceptees = nb total engagées)
  const statsActuelles = {
    livresLivres: 12,
    livraisonsRapides: 4,
    livraisonsUltraRapides: 1,
    maxLivresParVoyage: livresActifs,
    missionsAcceptees: 7 + engagees.filter(e => e.engaged).length,
    paysVisites: 2,
  };

  const missionsMode = available.filter(m => m.mode_livraison === modeLivraison);
  const missionsFiltered = missionsMode.filter(m => {
    const matchVoyage = voyageActif
      ? m.ville.toLowerCase().includes(voyageActif.arrivee_ville.toLowerCase())
      : false;
    const matchFiltre = filtreVille
      ? (m.zone_id === filtreVille || m.ville === filtreVille)
      : true;
    return matchVoyage && matchFiltre;
  });

  const acceptMission = (id, commission) => {
    const mission = available.find(m => m.id === id);
    if (!mission || limitAtteinte) return;
    const rang = livresActifs + 1;
    // Recalcul commission selon zone de la mission
    const missionZone = Object.values(ZONES).find(z => z.id === mission.zone_id) || zoneVoyage;
    commission = getCommission(missionZone, rang);

    const statsBefore = { ...statsActuelles };
    const statsAfter = { ...statsActuelles, missionsAcceptees: statsActuelles.missionsAcceptees + 1, maxLivresParVoyage: rang };

    const before = getBadgesDebloques(statsBefore);
    const after = getBadgesDebloques(statsAfter);
    const nouveaux = after.filter(id => !before.includes(id));

    const engagedMission = { ...mission, engaged: true, status: 'engagee', rang, commission };
    setEngagees(prev => [...prev, engagedMission]);
    setAvailable(prev => prev.filter(m => m.id !== id));

    const persist = mission.source === 'db'
      ? base44.entities.MissionVoyageur.update(mission.id, {
          voyageur_email: user?.email || '',
          statut: 'engagee',
          numero_ordre: rang,
          commission,
        })
      : Promise.resolve();

    persist.then(() => {
      if (nouveaux.length > 0) {
        const badge = BADGES_CONFIG.find(b => b.id === nouveaux[0]);
        if (badge) setTimeout(() => setNewBadge(badge), 500);
      }
    }).catch(() => {
      setEngagees(prev => prev.filter(m => m.id !== mission.id));
      setAvailable(prev => prev.some(m => m.id === mission.id) ? prev : [mission, ...prev]);
    });
  };

  const removeMission = (mission) => {
    const previousEngagees = engagees;
    const previousAvailable = available;
    setEngagees(prev => prev
      .filter(m => m.id !== mission.id)
      .map((m, index) => ({ ...m, rang: index + 1 }))
    );
    setAvailable(prev => prev.some(m => m.id === mission.id)
      ? prev
      : [{ ...mission, engaged: false, status: undefined, rang: undefined, commission: undefined }, ...prev]
    );

    if (mission.source === 'db') {
      base44.entities.MissionVoyageur.update(mission.id, {
        voyageur_email: '',
        statut: 'disponible',
        numero_ordre: null,
        commission: null,
      }).catch(() => {
        setEngagees(previousEngagees);
        setAvailable(previousAvailable);
      });
    }
  };

  const updateMissionStatus = (missionId, status) => {
    setEngagees(prev => prev.map(m => m.id === missionId ? { ...m, status } : m));
  };

  const openMissionAction = (mission, action) => {
    if (action === 'livree') {
      updateMissionStatus(mission.id, 'livree');
      return;
    }
    setScanMission(mission);
    setModalParam('scan-validation');
  };

  const handleRefresh = async () => {
    await loadAvailableMissions();
    setFiltreVille(null);
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

      {/* Quota douanier par zone */}
      <QuotaJauge zone={zoneVoyage} poidsActuelG={poidsEngageG} nbLivres={livresActifs} />

      {/* Jauge valise */}
      <JaugeValise livresActifs={livresActifs} totalCommission={totalCommission} />

      {/* Scan Validation Modal */}
      {scanMission && (
        <ScanValidation
          mission={scanMission}
          onClose={() => { setScanMission(null); clearModalParam('scan-validation'); }}
          onValidated={() => {
            updateMissionStatus(scanMission.id, 'en_transit');
            setScanMission(null);
            clearModalParam('scan-validation');
          }}
        />
      )}

      {/* Missions engagées */}
      {missionsActives.length > 0 && (
        <>
          <SectionTitle>Missions engagées</SectionTitle>
          {missionsActives.map(m => (
            <MissionCard key={m.id} mission={m} onAccept={() => {}} disabled={false} onScan={openMissionAction} onRemove={removeMission} />
          ))}
          <PerfoStrip />
        </>
      )}

      {/* Archives */}
      {missionsArchivees.length > 0 && (
        <>
          <SectionTitle>Archives des missions terminées</SectionTitle>
          <div style={{
            background: 'var(--papier)',
            border: '1.5px solid rgba(45,106,45,0.25)',
            padding: 16,
            marginBottom: 12,
            boxShadow: '3px 3px 0 rgba(26,16,8,0.08)',
          }}>
            {missionsArchivees.map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: '10px 0', borderBottom: '1px dashed rgba(26,16,8,0.12)',
              }}>
                <div>
                  <div className="font-playfair" style={{ fontSize: 14, fontWeight: 700, color: 'var(--encre)' }}>📚 {m.livre}</div>
                  <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.5)', marginTop: 2 }}>
                    {m.ville} · Commission {m.commission?.toFixed(2) || '0.00'} €
                  </div>
                </div>
                <div className="font-special" style={{
                  border: '1px solid #2d6a2d', color: '#2d6a2d',
                  fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
                  padding: '4px 8px', flexShrink: 0,
                }}>
                  Livrée
                </div>
              </div>
            ))}
          </div>
          <PerfoStrip />
        </>
      )}

      <SectionTitle>Choix du mode de livraison</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[['express', 'Express'], ['collectif', 'Collectif']].map(([id, label]) => (
          <button key={id} onClick={() => { setModeLivraison(id); setFiltreVille(null); }} className="font-special" style={{ minHeight: 44, background: modeLivraison === id ? 'var(--bordeaux)' : 'var(--papier)', color: modeLivraison === id ? 'var(--creme)' : 'var(--encre)', border: modeLivraison === id ? 'none' : '1.5px solid rgba(26,16,8,0.2)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>{label}</button>
        ))}
      </div>

      <SectionTitle>Calendrier</SectionTitle>
      <CalendrierVoyageur missions={engagees} voyages={voyages} />
      <PerfoStrip />

      <SectionTitle>Calculateur de revenus</SectionTitle>
      <CalculatriceRevenus />
      <PerfoStrip />

      {/* Missions disponibles */}
      <SectionTitle>Choix des livres</SectionTitle>
      <FiltreVille filtre={filtreVille} onFiltre={setFiltreVille} missions={missionsMode} />

      {!voyageActif && (
        <div style={{ background: validationBloquee ? 'rgba(180,20,20,0.08)' : 'rgba(128,0,32,0.08)', border: `1px dashed ${validationBloquee ? '#b41414' : 'var(--bordeaux)'}`, padding: '12px 16px', marginBottom: 16, fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: validationBloquee ? '#b41414' : 'var(--bordeaux)', lineHeight: 1.6 }}>
          {validationBloquee ? '⛔ Profil voyageur bloqué : accès aux missions fermé.' : validationEnAttente ? '⏳ Votre justificatif de vol est en cours de validation admin.' : '🔒 Déclarez un vol futur avec justificatif, puis attendez la validation admin pour accéder aux missions.'}
        </div>
      )}

      {limitAtteinte && (
        <div style={{
          background: 'rgba(128,0,32,0.08)',
          border: '1px dashed #800020',
          padding: '12px 16px', marginBottom: 16,
          fontFamily: 'IM Fell English, serif', fontStyle: 'italic',
          fontSize: 13, color: 'var(--bordeaux)', lineHeight: 1.6,
        }}>
          🔒 Quota atteint ({quotaLivres} livres / {quotaKg} kg max — Zone {zoneVoyage.label}) pour garantir un passage serein en douane.
        </div>
      )}

      {missionsMode.length === 0 && !limitAtteinte && (
        <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'hsl(var(--muted-foreground))', textAlign: 'center', padding: 20 }}>
          Aucune mission {modeLivraison} disponible pour ce trajet.
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
          <BtnCoupon onClick={() => setShowFormVol(true)} disabled={validationBloquee}>{validationBloquee ? 'Profil bloqué' : '+ Déclarer un vol'}</BtnCoupon>
        </div>
      ) : (
        <FormulaireVol
          user={user}
          onVolDeclare={(voyage) => {
            setVoyageurValidationStatus(voyage.validation_admin || 'en_attente');
            setShowFormVol(false);
          }}
        />
      )}
    </div>
    </PullToRefresh>
  );
}