import React from 'react';
import { Plane, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminNetworkPanel({ stats }) {
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="bg-papier border-bordeaux/20"><CardHeader><CardTitle className="font-heading text-bordeaux flex items-center gap-2"><Store size={20} />Top 3 points relais</CardTitle></CardHeader><CardContent className="space-y-3">{stats.topRelais.length === 0 ? <div className="text-bordeaux/50 italic">Aucune activité relais ce mois-ci.</div> : stats.topRelais.map((r, i) => <div key={r.id} className="bg-creme border border-bordeaux/15 rounded-xl p-4 flex justify-between"><span className="text-bordeaux"><b>#{i + 1}</b> {r.name}</span><span className="font-heading text-bordeaux">{r.count}</span></div>)}</CardContent></Card>
      <Card className="bg-papier border-bordeaux/20"><CardHeader><CardTitle className="font-heading text-bordeaux flex items-center gap-2"><Plane size={20} />Activité voyageurs</CardTitle></CardHeader><CardContent className="grid grid-cols-3 gap-3"><div className="bg-creme rounded-xl border border-bordeaux/15 p-4 text-center"><div className="font-heading text-3xl text-bordeaux">{stats.voyageurs.actifs}</div><p className="text-xs uppercase tracking-[1.4px] text-bordeaux/60 font-ui">Actifs</p></div><div className="bg-creme rounded-xl border border-bordeaux/15 p-4 text-center"><div className="font-heading text-3xl text-bordeaux">{stats.voyageurs.disponibles}</div><p className="text-xs uppercase tracking-[1.4px] text-bordeaux/60 font-ui">Missions</p></div><div className="bg-creme rounded-xl border border-bordeaux/15 p-4 text-center"><div className="font-heading text-3xl text-bordeaux">{stats.voyageurs.livrees}</div><p className="text-xs uppercase tracking-[1.4px] text-bordeaux/60 font-ui">Livrées</p></div></CardContent></Card>
    </div>
  );
}