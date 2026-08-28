import React from 'react';
import { Package, Truck, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function StatusCard({ icon: Icon, label, value }) {
  return <div className="bg-creme rounded-xl border border-bordeaux/15 p-4"><Icon className="text-cta mb-3" size={24} /><div className="font-heading text-3xl text-bordeaux">{value}</div><p className="font-ui text-[12px] tracking-[1.4px] uppercase text-bordeaux/65">{label}</p></div>;
}

export default function AdminLogisticsPanel({ stats }) {
  const recent = stats.filteredCommandes.slice(0, 6);
  return (
    <Card className="bg-papier border-bordeaux/20">
      <CardHeader><CardTitle className="font-heading text-bordeaux">Suivi logistique et stock</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-4 gap-4"><StatusCard icon={Package} label="En attente" value={stats.logistics.attente} /><StatusCard icon={Truck} label="En préparation" value={stats.logistics.preparation} /><StatusCard icon={CheckCircle} label="Livrées" value={stats.logistics.livrees} /><StatusCard icon={Truck} label="Délai moyen" value={`${stats.avgDelay.toFixed(1)} j`} /></div>
        {recent.length === 0 ? <div className="text-center text-bordeaux/50 italic py-6">Aucune commande disponible avec ces filtres.</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="font-ui text-[11px] uppercase tracking-[1.5px] text-bordeaux/55"><tr><th className="text-left py-2">Commande</th><th className="text-left py-2">Client</th><th className="text-left py-2">Statut</th><th className="text-right py-2">Montant</th></tr></thead><tbody>{recent.map(c => <tr key={c.id} className="border-t border-bordeaux/10"><td className="py-3 text-bordeaux font-medium">{c.livre_titre || c.id}</td><td className="py-3 text-bordeaux/65">{c.lecteur_email || '—'}</td><td className="py-3 text-bordeaux/65">{c.statut || '—'}</td><td className="py-3 text-right text-bordeaux">{(c.montant_paye || 0).toFixed(2)} €</td></tr>)}</tbody></table></div>}
      </CardContent>
    </Card>
  );
}