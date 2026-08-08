import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function ValidationPointsRelais() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const allUsers = await base44.entities.User.list('-updated_date', 200);
    setUsers(allUsers.filter(u => u.relais_validation_status === 'en_attente'));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (user) => {
    let relais = (await base44.entities.PointRelais.filter({ gerant_email: user.email }, '-created_date', 1))[0];
    if (!relais) {
      relais = await base44.entities.PointRelais.create({
        nom: user.relais_nom_boutique || (user.full_name ? `Relais ${user.full_name}` : 'Relais Bordero'),
        adresse: user.relais_adresse || '',
        ville: user.relais_ville || user.ville_destination || 'À configurer',
        horaires: user.relais_horaires || '',
        pays_code: 'FR',
        gerant_email: user.email,
        actif: true,
        validation_admin: 'valide',
        stock_actuel: 0,
      });
    } else {
      relais = await base44.entities.PointRelais.update(relais.id, {
        nom: user.relais_nom_boutique || relais.nom,
        adresse: user.relais_adresse || relais.adresse,
        ville: user.relais_ville || relais.ville,
        horaires: user.relais_horaires || relais.horaires,
        actif: true,
        validation_admin: 'valide',
      });
    }
    await base44.entities.User.update(user.id, {
      role: 'relais',
      relais_valide: true,
      relais_validation_status: 'valide',
      relais_valide_le: new Date().toISOString(),
      point_relais_id: relais.id,
    });
    await load();
  };

  const reject = async (user) => {
    const relais = (await base44.entities.PointRelais.filter({ gerant_email: user.email }, '-created_date', 1))[0];
    if (relais) await base44.entities.PointRelais.update(relais.id, { actif: false, validation_admin: 'rejete' });
    await base44.entities.User.update(user.id, {
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
        <p className="text-[13px] text-encre/60 mt-1">Seul un compte validé ici peut accéder au scanner, au stock et aux profils relais.</p>
      </div>

      {users.length === 0 ? (
        <div className="bg-papier border border-encre/20 p-6 text-center text-encre/50 italic">Aucune demande relais à traiter.</div>
      ) : users.map(user => (
        <div key={user.id} className="bg-papier border border-encre/20 p-4 mb-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div>
            <div className="font-bold text-encre">{user.full_name || 'Utilisateur'}</div>
            <div className="text-[12px] text-encre/55">{user.email}</div>
            <div className="text-[12px] text-encre/70 mt-2">{user.relais_nom_boutique || 'Boutique non renseignée'} · {user.relais_ville || 'Ville non renseignée'}</div>
            <div className="text-[11px] text-encre/55">{user.relais_adresse || 'Adresse non renseignée'}</div>
            <div className="text-[11px] text-encre/55">Horaires : {user.relais_horaires || 'non renseignés'}</div>
            <div className="text-[10px] tracking-[1.5px] uppercase text-bordeaux mt-2">Statut : {user.relais_validation_status || 'en_attente'}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => approve(user)} className="bg-cta text-cta-foreground px-4 py-2 text-[11px] tracking-[2px] uppercase font-special">Valider</button>
            <button onClick={() => reject(user)} className="bg-transparent border border-bordeaux text-bordeaux px-4 py-2 text-[11px] tracking-[2px] uppercase font-special">Refuser</button>
          </div>
        </div>
      ))}
    </div>
  );
}