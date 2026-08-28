import React from 'react';
import { AlertTriangle, Clock, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function AlertCard({ icon: Icon, title, value, detail, tone }) {
  return <div className="rounded-xl border border-bordeaux/15 bg-creme p-4 flex gap-3"><div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tone}`}><Icon size={20} /></div><div><div className="font-heading text-2xl text-bordeaux">{value}</div><p className="font-ui text-[12px] uppercase tracking-[1.4px] text-bordeaux">{title}</p><p className="text-sm italic text-bordeaux/55 mt-1">{detail}</p></div></div>;
}

export default function AdminAlertsPanel({ stats }) {
  return (
    <Card className="bg-papier border-bordeaux/20">
      <CardHeader><CardTitle className="font-heading text-bordeaux">Alertes et urgences</CardTitle></CardHeader>
      <CardContent className="grid lg:grid-cols-3 gap-4">
        <AlertCard icon={Clock} title="Bloquées > 48h" value={stats.bloquees.length} detail="Commandes sans progression récente" tone="bg-orange-100 text-cta" />
        <AlertCard icon={AlertTriangle} title="Litiges en cours" value={stats.litiges.length} detail="Réclamations ou dossiers sensibles" tone="bg-red-100 text-red-700" />
        <AlertCard icon={ShieldCheck} title="Profils à valider" value={stats.profilsAttente} detail="Voyageurs ou points relais en attente" tone="bg-amber-100 text-amber-700" />
      </CardContent>
    </Card>
  );
}