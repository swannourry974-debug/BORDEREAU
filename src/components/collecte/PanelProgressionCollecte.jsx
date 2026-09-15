import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { SectionTitle, PerfoStrip } from '@/components/bordereau/shared';
import CollecteHeader from '@/components/collecte/CollecteHeader';
import CollecteStack from '@/components/collecte/CollecteStack';
import CollecteDashboard from '@/components/collecte/CollecteDashboard';
import CollecteOrderList from '@/components/collecte/CollecteOrderList';
import { getOrderWeightKg } from '@/components/collecte/collecteUtils';

export default function PanelProgressionCollecte({ role, currentUser }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scopeLabel, setScopeLabel] = useState('Suivi personnalisé');

  useEffect(() => {
    async function loadCollecte() {
      const user = currentUser || await base44.auth.me();
      let filter = { mode_livraison: 'collectif' };
      if (role === 'relais') {
        let relaisId = user?.point_relais_id;
        if (!relaisId && user?.email) {
          const relais = (await base44.entities.PointRelais.filter({ gerant_email: user.email }, '-updated_date', 1))[0];
          relaisId = relais?.id;
        }
        filter = { ...filter, point_relais_id: relaisId || '__aucun_relais__' };
        setScopeLabel('Point Relais');
      } else if (user?.role !== 'admin') {
        filter = { ...filter, lecteur_email: user?.email || '__aucun_lecteur__' };
        setScopeLabel('Vos commandes Collecte');
      } else {
        setScopeLabel('Toutes les collectes');
      }
      const data = await base44.entities.Commande.filter(filter, '-created_date', 120);
      setOrders(data || []);
      setLoading(false);
    }
    loadCollecte();
  }, [role, currentUser?.email, currentUser?.point_relais_id]);

  const activeOrders = orders.filter(o => !['annulee', 'livree'].includes(o.statut));
  const totalKg = useMemo(() => activeOrders.reduce((sum, order) => sum + getOrderWeightKg(order), 0), [activeOrders]);

  if (loading) return <div className="font-fell" style={{ textAlign: 'center', padding: 40, fontStyle: 'italic', color: 'rgba(128,0,32,0.5)' }}>Chargement de la malle Collecte…</div>;

  return <div><CollecteHeader totalKg={totalKg} count={activeOrders.length} scopeLabel={scopeLabel} /><CollecteDashboard totalKg={totalKg} count={activeOrders.length} /><CollecteStack orders={activeOrders} totalKg={totalKg} /><PerfoStrip /><SectionTitle>Commandes de la pile</SectionTitle><CollecteOrderList orders={activeOrders} /></div>;
}