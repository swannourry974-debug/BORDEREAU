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
import MissionEnCoursCard from '@/components/voyageur/MissionEnCoursCard';
import MissionAnnouncementList from '@/components/voyageur/MissionAnnouncementList';
import VoyageurSectionTabs from '@/components/voyageur/VoyageurSectionTabs';
import CollapsedMissionList from '@/components/voyageur/CollapsedMissionList';
import VoyageurSecondarySearch from '@/components/voyageur/VoyageurSecondarySearch';
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
    ville_destination: record.ville_destination || 'Destination',
    depart_ville: record.depart_ville || '',
    trajet_label: record.trajet_label || '',
    point_relais_nom: record.point_relais_nom || '',
    statut: record.statut,
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
  const stateColor = mission.status === 'livree' ? '#2d6a2d' : mission.status === 'en_transit' ? '#1a3a5c' : mission.statut === 'expiree' ? '#9A3412' : '#6E1E2E';

  return (
    <article className="relative mb-3 overflow-hidden border bg-[#FFF8EA]/88 p-4 shadow-[0_12px_26px_rgba(59,42,35,0.10)]" style={{ borderColor: `${stateColor}38`, opacity: isEngaged ? 0.92 : 1 }}>
      <div className="absolute right-0 top-0 h-14 w-14 bg-[#6E1E2E]/8" />
      {isEngaged && onRemove && (
        <button type="button" aria-label="Retirer cette mission" title="Retirer cette mission" onClick={() => onRemove(mission)} className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center border border-[#6E1E2E]/20 bg-[#F3E8D2] font-ui text-lg font-bold text-[#6E1E2E]">×</button>
      )}

      <div className="flex items-start gap-3">
        <div className="flex h-16 w-12 shrink-0 flex-col justify-between bg-[#6E1E2E] p-2 text-[#F3E8D2] shadow-[0_10px_20px_rgba(59,42,35,0.16)]">
          <span className="font-ui text-[7px] uppercase tracking-[0.16em] opacity-70">B</span>
          <span className="font-heading text-sm leading-none">✈</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-ui text-[9px] font-extrabold uppercase tracking-[0.18em]" style={{ color: stateColor }}>{mission.ville}</div>
          <h3 className="mt-1 font-heading text-xl font-bold leading-tight text-[#6E1E2E]">{mission.livre}</h3>
          <p className="mt-1 font-body text-sm italic text-[#3B2A23]/60">{isEngaged ? (mission.status === 'livree' ? 'Livraison confirmée · Mission terminée' : mission.status === 'en_transit' ? 'Achat confirmé · En transit' : 'En attente du scan d’achat') : mission.date}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border px-2 py-1 font-ui text-[9px] font-bold uppercase tracking-[0.12em]" style={{ borderColor: `${stateColor}55`, color: stateColor, background: `${stateColor}12` }}>{mission.type} · {mission.poids}</span>
            {isEngaged && mission.rang && <span className="rounded-full border border-[#C7A15A]/50 bg-[#C7A15A]/10 px-2 py-1 font-ui text-[9px] font-bold uppercase tracking-[0.12em] text-[#8B6914]">Rang {mission.rang}</span>}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-[#6E1E2E]/16 pt-3">
        <div>
          <div className="font-heading text-2xl font-bold" style={{ color: stateColor }}>{commission ? `${commission.toFixed(2)} €` : (mission.commission ? `${mission.commission.toFixed(2)} €` : '—')}</div>
          <div className="font-ui text-[9px] uppercase tracking-[0.14em] text-[#3B2A23]/42">{isEngaged ? 'En séquestre' : 'Commission'}</div>
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
          <BtnCoupon onClick={handleAccept} disabled={disabled || loading || mission.statut === 'expiree'}>
            {loading ? '⟳ ...' : disabled ? '⛔ Valise pleine' : mission.statut === 'expiree' ? 'Expirée' : 'Accepter la mission'}
          </BtnCoupon>
        )}
      </div>
    </article>
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
  const [showFormVol, setShowFormVol] = useState(false);
  const [filtreVille, setFiltreVille] = useState(null);
  const [missionSearch, setMissionSearch] = useState('');
  const [activeVoyageurTab, setActiveVoyageurTab] = useState('missions');
  const [searchParams, setSearchParams] = useSearchParams();
  const modalParam = searchParams.get('modal');

  const [wallet, setWallet] = useState({ soldeDisponible: 0, gainsPrevisionnels: 0, virementSuspendu: false });

  const loadAvailableMissions = async () => {
    const missions = await base44.entities.MissionVoyageur.filter({ statut: { $in: ['disponible', 'expiree'] }, mode_livraison: 'express' }, { sort: '-created_date', limit: 80 });
    const rows = missions?.items || missions || [];
    setAvailable(rows.length ? rows.map(formatMissionRecord) : []);
  };

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (!u) return;
      const [voyages, missionsVoyageur, wallets] = await Promise.all([
        base44.entities.Voyage.filter({ voyageur_email: u.email }),
        base44.entities.MissionVoyageur.filter({ voyageur_email: u.email }, { sort: '-updated_date', limit: 80 }),
        base44.entities.VoyageurWallet.filter({ user_email: u.email }, '-updated_date', 1),
      ]);
      const walletRecord = wallets?.[0];
      setWallet({
        soldeDisponible: walletRecord?.solde_disponible ?? 0,
        gainsPrevisionnels: walletRecord?.gains_previsionnels ?? 0,
        virementSuspendu: walletRecord?.virement_suspendu ?? false,
      });
      setVoyages(voyages || []);
      setEngagees((missionsVoyageur?.items || missionsVoyageur || []).filter(m => ['acceptee', 'engagee', 'en_transit', 'deposee_relais', 'livree', 'retiree'].includes(m.statut)).map((m, index) => ({ ...formatMissionRecord(m), engaged: true, status: ['livree', 'retiree'].includes(m.statut) ? 'livree' : ['en_transit', 'deposee_relais'].includes(m.statut) ? 'en_transit' : 'engagee', rang: m.numero_ordre || index + 1 })));
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
  const missionsArchivees = engagees.filter(m => m.status === 'livree' || m.statut === 'retiree');
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

  const statsActuelles = {
    livresLivres: missionsArchivees.length,
    livraisonsRapides: missionsArchivees.length,
    livraisonsUltraRapides: 0,
    maxLivresParVoyage: livresActifs,
    missionsAcceptees: engagees.length,
    paysVisites: voyages.filter(v => v.validation_admin === 'valide' || v.actif).length,
  };

  const searchNeedle = missionSearch.trim().toLowerCase();
  const matchesSearch = (mission) => !searchNeedle || [mission.livre, mission.ville, mission.type, mission.date].some(value => String(value || '').toLowerCase().includes(searchNeedle));
  const missionsMode = available.filter(m => m.mode_livraison === 'express' && matchesSearch(m));
  const searchedMissionsActives = missionsActives.filter(matchesSearch);
  const searchedMissionsArchivees = missionsArchivees.filter(matchesSearch);
  const missionsFiltered = missionsMode.filter(m => {
    const matchVoyage = voyageActif
      ? m.ville.toLowerCase().includes(voyageActif.arrivee_ville.toLowerCase())
      : true;
    const matchFiltre = filtreVille
      ? (m.zone_id === filtreVille || m.ville === filtreVille)
      : true;
    return matchVoyage && matchFiltre;
  });
  const missionEnCours = searchedMissionsActives[0] || missionsFiltered[0] || null;
  const missionEnCoursCommission = missionEnCours?.engaged ? missionEnCours.commission : (missionEnCours ? getCommission(Object.values(ZONES).find(z => z.id === missionEnCours.zone_id) || zoneVoyage, livresActifs + 1) : null);

  const acceptMission = (id, commission) => {
    const mission = available.find(m => m.id === id);
    if (!mission || limitAtteinte) return;
    // Verrou critique : ne jamais autoriser l'acceptation sans vol validé
    if (!voyageActif || user?.voyageur_bloque) {
      alert('⛔ Vous devez avoir un vol validé par l\'administrateur avant d\'accepter des missions.');
      return;
    }
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
      ? base44.functions.invoke('accepterMissionAnnonce', {
          mission_id: mission.id,
          numero_ordre: rang,
          commission,
        })
      : Promise.resolve();

    persist.then((response) => {
      const savedMission = response?.data?.mission;
      if (savedMission) {
        setEngagees(prev => prev.map(m => m.id === mission.id ? { ...formatMissionRecord(savedMission), engaged: true, status: 'engagee', rang, commission } : m));
      }
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
          </div>
        )}

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

        <section className="mb-5 overflow-hidden bordero-card-premium p-5 sm:p-6">
          <div className="bordero-heading-section">Atlas des missions</div>
          <h1 className="mt-2 font-heading text-3xl font-bold text-[#6E1E2E] sm:text-4xl">Carnet Voyageur</h1>
          <p className="mt-2 max-w-xl font-body text-[16px] italic leading-relaxed text-[#3B2A23]/64">Retrouvez les missions express, vos livres en route et votre capacité de valise sans modifier les règles de transport.</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Actives', value: missionsActives.length, color: '#1a3a5c' },
              { label: 'Disponibles', value: missionsFiltered.length, color: '#6E1E2E' },
              { label: 'Archivées', value: missionsArchivees.length, color: '#2d6a2d' },
            ].map(item => (
              <div key={item.label} className="border bg-[#FFF8EA]/75 p-3 text-center" style={{ borderColor: `${item.color}33` }}>
                <div className="font-heading text-2xl font-bold" style={{ color: item.color }}>{item.value}</div>
                <div className="font-ui text-[8px] font-extrabold uppercase tracking-[0.16em] text-[#3B2A23]/45">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        <VoyageurSecondarySearch query={missionSearch} onQueryChange={setMissionSearch} />

        <MissionEnCoursCard
          mission={missionEnCours}
          isEngaged={!!missionEnCours?.engaged}
          commission={missionEnCoursCommission}
          disabled={limitAtteinte || validationBloquee || !voyageActif}
          onAccept={(mission) => acceptMission(mission.id, missionEnCoursCommission)}
          onDeposit={(mission) => openMissionAction(mission, 'scan')}
        />

        <MissionAnnouncementList title="Livres en route" missions={searchedMissionsActives} grouped emptyText="Aucune annonce pour l’instant." />
        <CollapsedMissionList
          title="Missions acceptées"
          missions={searchedMissionsActives}
          renderMission={(mission) => (
            <MissionCard key={mission.id} mission={mission} onAccept={() => {}} disabled={false} onScan={openMissionAction} onRemove={removeMission} />
          )}
        />
        <CollapsedMissionList
          title="Missions passées"
          missions={searchedMissionsArchivees}
          renderMission={(mission) => (
            <MissionCard key={mission.id} mission={mission} onAccept={() => {}} disabled={false} onScan={openMissionAction} onRemove={removeMission} />
          )}
        />

        <VoyageurSectionTabs active={activeVoyageurTab} onChange={setActiveVoyageurTab} />

        {activeVoyageurTab === 'missions' && (
          <>
            <SectionTitle>Choix des livres</SectionTitle>
            <FiltreVille filtre={filtreVille} onFiltre={setFiltreVille} missions={missionsMode} />

            {!voyageActif && (
              <div style={{ background: validationBloquee ? 'rgba(180,20,20,0.08)' : 'rgba(128,0,32,0.08)', border: `1px dashed ${validationBloquee ? '#b41414' : 'var(--bordeaux)'}`, padding: '12px 16px', marginBottom: 16, fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: validationBloquee ? '#b41414' : 'var(--bordeaux)', lineHeight: 1.6 }}>
                {validationBloquee ? '⛔ Profil voyageur bloqué : accès aux missions fermé.' : validationEnAttente ? '⏳ Votre justificatif de vol est en cours de validation admin.' : '🔒 Déclarez un vol futur avec justificatif, puis attendez la validation admin pour accéder aux missions.'}
              </div>
            )}

            {limitAtteinte && (
              <div style={{ background: 'rgba(128,0,32,0.08)', border: '1px dashed #800020', padding: '12px 16px', marginBottom: 16, fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'var(--bordeaux)', lineHeight: 1.6 }}>
                🔒 Quota atteint ({quotaLivres} livres / {quotaKg} kg max — Zone {zoneVoyage.label}) pour garantir un passage serein en douane.
              </div>
            )}

            {voyageActif && (
              <div style={{ background: 'rgba(45,106,45,0.07)', border: '1px solid #2d6a2d', padding: '10px 14px', marginBottom: 12, fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 12, color: '#2d6a2d', lineHeight: 1.6, display: 'flex', alignItems: 'center', gap: 8 }}>
                ✈️ <span>Filtré sur <strong>{voyageActif.arrivee_ville}</strong> · {voyageActif.date_vol}</span>
              </div>
            )}

            {missionsFiltered.length === 0 && !limitAtteinte && (
              <div style={{ fontFamily: 'IM Fell English, serif', fontStyle: 'italic', fontSize: 13, color: 'hsl(var(--muted-foreground))', textAlign: 'center', padding: 20 }}>
                {missionSearch ? 'Aucune mission ne correspond à cette recherche.' : 'Aucune annonce pour l’instant.'}
              </div>
            )}

            <MissionAnnouncementList
              title="Annonces ouvertes récentes"
              missions={missionsFiltered}
              emptyText="Aucune annonce pour l’instant."
              onAccept={(mission) => acceptMission(mission.id, mission.commission || getCommission(Object.values(ZONES).find(z => z.id === mission.zone_id) || zoneVoyage, livresActifs + 1))}
              disabled={limitAtteinte || validationBloquee || !voyageActif}
            />
          </>
        )}

        {activeVoyageurTab === 'wallet' && (
          <>
            <QuotaJauge zone={zoneVoyage} poidsActuelG={poidsEngageG} nbLivres={livresActifs} />
            <JaugeValise livresActifs={livresActifs} totalCommission={totalCommission} />
            <WalletCard soldeDisponible={wallet.soldeDisponible} gainsPrevisionnels={wallet.gainsPrevisionnels} virementSuspendu={wallet.virementSuspendu} />
            <SectionTitle>Calculateur de revenus</SectionTitle>
            <CalculatriceRevenus />
          </>
        )}

        {activeVoyageurTab === 'profil' && (
          <>
            <SectionTitle>Calendrier</SectionTitle>
            <CalendrierVoyageur missions={engagees} voyages={voyages} />
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
          </>
        )}
      </div>
    </PullToRefresh>
  );
}