import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import AnalyticsRolePanel from './analytics/AnalyticsRolePanel';
import AnalyticsLists from './analytics/AnalyticsLists';

export default function AdminAnalyticsBehavior() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30daysAgo');

  useEffect(() => {
    setLoading(true);
    base44.functions.invoke('analyserComportementGoogleAnalytics', { startDate: period })
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="min-h-[260px] grid place-items-center"><div className="w-8 h-8 border-4 border-bordeaux/20 border-t-bordeaux rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div className="bordero-card p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-ui text-[11px] uppercase tracking-[3px] text-bordeaux/70">Google Analytics</p>
            <h2 className="font-heading text-3xl text-bordeaux">Comportement utilisateurs</h2>
            <p className="font-body italic text-encre/70">Lecteurs, voyageurs et points relais, classés par parcours de navigation.</p>
          </div>
          <select value={period} onChange={e => setPeriod(e.target.value)} className="min-h-[44px] border px-3 font-ui text-sm">
            <option value="7daysAgo">7 derniers jours</option>
            <option value="30daysAgo">30 derniers jours</option>
            <option value="90daysAgo">90 derniers jours</option>
          </select>
        </div>
      </div>

      {data?.error ? <div className="bordero-card p-5 text-bordeaux">{data.error}</div> : null}
      {data && !data.error && <AnalyticsRolePanel roles={data.roles} />}
      {data?.insights?.length ? <div className="bordero-card p-5"><h3 className="font-ui text-xs uppercase tracking-[2px] text-bordeaux">Lecture rapide</h3><ul className="mt-3 list-disc pl-5 font-body text-encre/75">{data.insights.map(item => <li key={item}>{item}</li>)}</ul></div> : null}
      {data && !data.error && <AnalyticsLists topPages={data.topPages} topEvents={data.topEvents} />}
    </div>
  );
}