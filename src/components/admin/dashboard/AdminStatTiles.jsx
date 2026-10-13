import React from 'react';
import { AlertTriangle, BookOpen, PackageCheck, Store } from 'lucide-react';

const tiles = [
  ['Commandes en transit', 'commandesTransit', 'Acheminement actif', PackageCheck],
  ['Livres au relais', 'livresRelais', 'En attente retrait', BookOpen],
  ['Relais à valider', 'relaisAttente', 'Demandes en attente', Store],
  ['Retards / pénalités', 'retardsPenalites', 'À surveiller', AlertTriangle],
];

export default function AdminStatTiles({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map(([label, key, helper, Icon]) => (
        <div key={key} className="rounded-2xl border border-bordeaux/20 bg-papier p-4 shadow-[3px_3px_0_rgba(26,16,8,0.08)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <p className="font-ui text-[10px] uppercase tracking-[2px] text-bordeaux/60">{label}</p>
            <Icon size={22} className="shrink-0 text-cta" />
          </div>
          <div className="font-heading text-3xl text-bordeaux">{stats[key] || 0}</div>
          <p className="mt-1 font-body text-sm italic text-bordeaux/55">{helper}</p>
        </div>
      ))}
    </div>
  );
}