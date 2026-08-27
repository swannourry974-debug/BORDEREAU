import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function ValidationPointsRelais() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const relais = await base44.entities.PointRelais.filter({ validation_admin: 'en_attente' }, '-updated_date', 200);
    setDemandes(relais);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateUserRelayStatus = async (relais, data) => {
    const user = (await base44.entities.User.filter({ email: relais.gerant_email }, '-updated_date', 1))[0];
    if (!user) return;
    await base44.entities.User.update(user.id, data);
  };

  const approve = async (relais) => {
    await base44.entities.PointRelais.update(relais.id, {
      actif: true,
      validation_admin: 'valide',
    });
    await updateUserRelayStatus(relais, {
      role: 'relais',
      relais_valide: true,
      relais_validation_status: 'valide',
      relais_valide_le: new Date().toISOString(),
      point_relais_id: relais.id,
      relais_nom_boutique: relais.nom,
      relais_identifiant_connexion: relais.identifiant_connexion || '',
      relais_adresse: relais.adresse,
      relais_ville: relais.ville,
      relais_pays: relais.pays_nom,
      relais_type_commerce: relais.type_commerce,
      relais_telephone: relais.telephone,
      relais_horaires: relais.horaires,
    });
    await load();
  };

  const reject = async (relais) => {
    await base44.entities.PointRelais.update(relais.id, {
      actif: false,
      validation_admin: 'rejete',
    });
    await updateUserRelayStatus(relais, {
      relais_valide: false,
      relais_validation_status: 'rejete',
      point_relais_id: '',
    });
    await load();
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground italic">Chargement des demandes relais…</div>;

  return (
    <div>
      <div className="bg-papier border border-encre/20 p-5 mb-5">
        <div className="text-[10px] tracking-[3px] uppercase text-bordeaux font-special mb-2">Validation Point Relais</div>
        <h2 className="text-[22px] font-bold text-encre">Demandes d’accès relais</h2>
        <p className="text-[13px] text-encre/60 mt-1">Validez ou refusez les commerces candidats avant ouverture du scanner, du stock et des profils relais.</p>
      </div>

      {demandes.length === 0 ? (
        <div className="bg-papier border border-encre/20 p-6 text-center text-encre/50 italic">Aucune demande relais à traiter.</div>
      ) : demandes.map(relais => (
        <div key={relais.id} className="bg-papier border border-encre/20 p-4 mb-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div>
            <div className="font-bold text-encre">{relais.nom || 'Commerce non renseigné'}</div>
            <div className="text-[12px] text-encre/55">{relais.gerant_email}</div>
            <div className="text-[12px] text-encre/70 mt-2">{relais.ville || 'Ville non renseignée'} · {relais.pays_nom || relais.pays_code || 'Pays non renseigné'}</div>
            <div className="text-[11px] text-encre/55">{relais.adresse || 'Adresse non renseignée'}</div>
            <div className="text-[11px] text-encre/55">Identifiant : {relais.identifiant_connexion || 'non renseigné'}</div>
            <div className="text-[11px] text-encre/55">Type : {relais.type_commerce || 'non renseigné'} · Tél. {relais.telephone || 'non renseigné'}</div>
            <div className="text-[11px] text-encre/55">Horaires : {relais.horaires || 'non renseignés'}</div>
            <div className="text-[10px] tracking-[1.5px] uppercase text-bordeaux mt-2">Statut : {relais.validation_admin || 'en_attente'}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => approve(relais)} className="bg-cta text-cta-foreground px-4 py-2 text-[11px] tracking-[2px] uppercase font-special">Valider</button>
            <button onClick={() => reject(relais)} className="bg-transparent border border-bordeaux text-bordeaux px-4 py-2 text-[11px] tracking-[2px] uppercase font-special">Refuser</button>
          </div>
        </div>
      ))}
    </div>
  );
}