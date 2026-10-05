import React from 'react';

export default function CollectePromoShareCard({ campaign }) {
  if (!campaign) return null;
  return (
    <div className="mt-3 bg-[#fff7ed] border border-[#C2410C]/35 p-3 text-encre">
      <div className="font-typewriter text-[9px] uppercase tracking-[2px] text-[#C2410C] mb-1">Relance Partenaria active</div>
      <div className="font-serif text-lg font-bold text-bordeaux tracking-wide">{campaign.code}</div>
      <p className="font-fell italic text-[12px] leading-relaxed text-foreground/65 mt-1">
        {campaign.message_partage || `Partagez ce code autour de vous pour compléter le carton Collecte de ${campaign.point_relais_nom || 'ce relais'}.`}
      </p>
      <div className="font-typewriter text-[9px] uppercase tracking-[1.5px] text-foreground/45 mt-2">
        −{Number(campaign.montant_reduction || 0).toFixed(0)} € · {campaign.nombre_commandes_attente || 0}/40 livres
      </div>
    </div>
  );
}