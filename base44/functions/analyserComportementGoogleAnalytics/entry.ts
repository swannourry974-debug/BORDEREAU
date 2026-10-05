import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const ROLE_PATHS = {
  lecteurs: ['/catalogue', '/etagere', '/bibliotheque', '/wishlist', '/favoris', '/progression-collecte', '/profil'],
  voyageurs: ['/accueil-voyageur', '/missions', '/scanner'],
  relais: ['/stock', '/Stock', '/profils', '/relais'],
};

function roleForPath(path = '') {
  for (const [role, prefixes] of Object.entries(ROLE_PATHS)) {
    if (prefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'))) return role;
  }
  return 'autres';
}

async function googleJson(url, accessToken, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || 'Google Analytics est indisponible.');
  return data;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const payload = await req.json().catch(() => ({}));
    const startDate = ['7daysAgo', '30daysAgo', '90daysAgo'].includes(payload.startDate) ? payload.startDate : '30daysAgo';
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');

    const summaries = await googleJson('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', accessToken);
    const properties = (summaries.accountSummaries || []).flatMap(account =>
      (account.propertySummaries || []).map(property => ({
        accountName: account.displayName || account.name,
        propertyName: property.property,
        displayName: property.displayName || property.property,
      }))
    );

    if (!properties.length) {
      return Response.json({ properties: [], selectedProperty: null, roles: {}, topPages: [], topEvents: [], insights: ['Aucune propriété Google Analytics accessible avec ce compte.'] });
    }

    const selectedProperty = properties.find(p => p.propertyName === payload.propertyName) || properties[0];
    const reportBody = {
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'eventCount' }],
      limit: 100,
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    };

    const eventBody = {
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      limit: 20,
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    };

    const [pageReport, eventReport] = await Promise.all([
      googleJson(`https://analyticsdata.googleapis.com/v1beta/${selectedProperty.propertyName}:runReport`, accessToken, { method: 'POST', body: JSON.stringify(reportBody) }),
      googleJson(`https://analyticsdata.googleapis.com/v1beta/${selectedProperty.propertyName}:runReport`, accessToken, { method: 'POST', body: JSON.stringify(eventBody) }),
    ]);

    const roles = { lecteurs: { views: 0, users: 0, events: 0 }, voyageurs: { views: 0, users: 0, events: 0 }, relais: { views: 0, users: 0, events: 0 }, autres: { views: 0, users: 0, events: 0 } };
    const topPages = (pageReport.rows || []).map(row => {
      const path = row.dimensionValues?.[0]?.value || '/';
      const item = {
        path,
        role: roleForPath(path),
        views: Number(row.metricValues?.[0]?.value || 0),
        users: Number(row.metricValues?.[1]?.value || 0),
        events: Number(row.metricValues?.[2]?.value || 0),
      };
      roles[item.role].views += item.views;
      roles[item.role].users += item.users;
      roles[item.role].events += item.events;
      return item;
    });

    const topEvents = (eventReport.rows || []).map(row => ({
      name: row.dimensionValues?.[0]?.value || 'Événement',
      count: Number(row.metricValues?.[0]?.value || 0),
    }));

    const strongestRole = Object.entries(roles).sort((a, b) => b[1].views - a[1].views)[0];
    const insights = [
      strongestRole?.[1]?.views ? `Le segment le plus consulté est ${strongestRole[0]} avec ${strongestRole[1].views} vues.` : 'Les données de consultation sont encore limitées.',
      topPages[0] ? `La page dominante est ${topPages[0].path} avec ${topPages[0].views} vues.` : 'Aucune page dominante détectée.',
      topEvents[0] ? `L’événement le plus fréquent est ${topEvents[0].name}.` : 'Aucun événement significatif détecté.',
    ];

    return Response.json({ properties, selectedProperty, period: startDate, roles, topPages: topPages.slice(0, 12), topEvents, insights });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}