import React from 'react';
import RelaisFinalisationActions from '@/components/admin/RelaisFinalisationActions';
import { money } from './adminDashboardData';

function StatusBadge({ children }) {
  return <span className="rounded-full bg-creme px-3 py-1 font-ui text-[11px] text-bordeaux/70">{children || '—'}</span>;
}

export default function AdminOverviewTables({ stats }) {
  const orders = stats.recentCommandes || [];
  const relays = stats.recentRelais || [];
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-2xl border border-bordeaux/15 bg-papier p-4 shadow-[3px_3px_0_rgba(26,16,8,0.08)]">
        <h2 className="mb-3 font-heading text-2xl text-bordeaux">Commandes récentes</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="font-ui text-[10px] uppercase tracking-[1.8px] text-bordeaux/50"><tr><th className="p-3 text-left">Livre</th><th className="p-3 text-left">Lecteur</th><th className="p-3 text-left">Statut</th><th className="p-3 text-right">Montant</th></tr></thead>
            <tbody>{orders.map(order => <tr key={order.id} className="border-t border-bordeaux/10"><td className="p-3 font-medium text-bordeaux">{order.livre_titre || 'Livre non renseigné'}<div className="text-xs text-bordeaux/45">{order.livre_auteur || order.point_relais_nom || '—'}</div></td><td className="p-3 text-bordeaux/65">{order.lecteur_email || '—'}</td><td className="p-3"><StatusBadge>{order.statut}</StatusBadge></td><td className="p-3 text-right font-heading text-bordeaux">{money(order.montant_paye)}</td></tr>)}{orders.length === 0 && <tr><td colSpan="4" className="p-8 text-center italic text-bordeaux/45">Aucune commande récente.</td></tr>}</tbody>
          </table>
        </div>
      </section>
      <section className="rounded-2xl border border-bordeaux/15 bg-papier p-4 shadow-[3px_3px_0_rgba(26,16,8,0.08)]">
        <h2 className="mb-3 font-heading text-2xl text-bordeaux">Points relais</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="font-ui text-[10px] uppercase tracking-[1.8px] text-bordeaux/50"><tr><th className="p-3 text-left">Commerce</th><th className="p-3 text-left">Ville</th><th className="p-3 text-left">Statut</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody>{relays.map(relay => <tr key={relay.id} className="border-t border-bordeaux/10"><td className="p-3 font-medium text-bordeaux">{relay.nom || 'Commerce'}<div className="text-xs text-bordeaux/45">{relay.gerant_email || '—'}</div></td><td className="p-3 text-bordeaux/65">{relay.ville || '—'}</td><td className="p-3"><StatusBadge>{relay.actif && relay.validation_admin === 'valide' ? 'Actif' : relay.validation_admin}</StatusBadge></td><td className="p-3 text-right"><RelaisFinalisationActions relais={relay} /></td></tr>)}{relays.length === 0 && <tr><td colSpan="4" className="p-8 text-center italic text-bordeaux/45">Aucun point relais.</td></tr>}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}