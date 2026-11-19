import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { SectionTitle, PerfoStrip } from '@/components/bordereau/shared';
import VoyageurStatsCard from './VoyageurStatsCard';
import MissionAnnouncementList from './MissionAnnouncementList';
import LangSwitcher from '@/components/shared/LangSwitcher';

export default function PanelAccueilVoyageur() {
  const [user, setUser] = useState(null);
  const [missions, setMissions] = useState([]);
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (!u) { setLoading(false); return; }
      const [allMissions, annoncesOuvertes] = await Promise.all([
        base44.entities.MissionVoyageur.filter({ voyageur_email: u.email }, { sort: '-updated_date', limit: 80 }),
        base44.entities.MissionVoyageur.filter({ statut: { $in: ['disponible', 'expiree'] }, mode_livraison: 'express' }, { sort: '-created_date', limit: 12 }),
      ]);
      setMissions(allMissions?.items || allMissions || []);
      setAnnonces(annoncesOuvertes?.items || annoncesOuvertes || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const livresEnCours = missions.filter(m => ['acceptee', 'engagee'].includes(m.statut));
  const livresLivres = missions.filter(m => ['livree', 'retiree'].includes(m.statut));
  const prochaineMission = livresEnCours[0];

  if (loading) {
    return <div className="bordero-empty-state font-body italic">Chargement de votre carnet voyageur…</div>;
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden bordero-card-premium p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full border border-[#C7A15A]/45 opacity-40" />
        <div className="pointer-events-none absolute right-7 top-8 font-heading text-7xl text-[#6E1E2E]/5">✈</div>
        <div className="relative">
          <div className="bordero-heading-section">Carnet de route Voyageur</div>
          <h1 className="mt-2 font-heading text-3xl font-bold leading-tight text-[#6E1E2E] sm:text-4xl">
            Bonjour {user?.full_name?.split(' ')[0] || 'Voyageur'} ✦
          </h1>
          <p className="mt-2 max-w-xl font-body text-[17px] italic leading-relaxed text-[#3B2A23]/64">
            Suivez vos trajets, vos missions express et les livres confiés entre deux pays.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'En route', value: livresEnCours.length, tone: '#1a3a5c' },
              { label: 'Livrés', value: livresLivres.length, tone: '#2d6a2d' },
              { label: 'Annonces', value: annonces.length, tone: '#6E1E2E' },
            ].map(item => (
              <div key={item.label} className="border bg-[#FFF8EA]/78 p-3" style={{ borderColor: `${item.tone}33` }}>
                <div className="font-heading text-3xl font-bold" style={{ color: item.tone }}>{item.value}</div>
                <div className="mt-1 font-ui text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#3B2A23]/46">{item.label}</div>
              </div>
            ))}
          </div>
          {prochaineMission && (
            <div className="mt-4 rounded-2xl border border-[#C7A15A]/45 bg-[#F3E8D2]/55 p-3 font-body text-sm italic text-[#3B2A23]/70">
              Prochaine attention : <strong className="text-[#6E1E2E]">{prochaineMission.livre}</strong>{prochaineMission.ville_destination ? ` vers ${prochaineMission.ville_destination}` : ''}.
            </div>
          )}
        </div>
      </section>

      <MissionAnnouncementList title="Annonces ouvertes récentes" missions={annonces} emptyText="Aucune annonce pour l’instant." />
      <MissionAnnouncementList title="Livres en route" missions={livresEnCours} grouped emptyText="Aucun livre en route pour l’instant." />

      <section className="bordero-surface p-4">
        <SectionTitle>Choix de la langue</SectionTitle>
        <LangSwitcher />
      </section>

      <section className="bordero-surface p-4">
        <SectionTitle>Récapitulatif livres & niveau</SectionTitle>
        <VoyageurStatsCard missions={missions} />
      </section>

      <PerfoStrip />
    </div>
  );
}