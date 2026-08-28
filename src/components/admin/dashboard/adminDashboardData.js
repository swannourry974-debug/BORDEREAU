export const money = (value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0);

const toDate = (value) => value ? new Date(value) : null;
const now = new Date();
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
const todayKey = now.toDateString();

const isToday = (value) => toDate(value)?.toDateString() === todayKey;
const isThisMonth = (value) => (toDate(value)?.getTime() || 0) >= monthStart.getTime();
const hoursSince = (value) => value ? (Date.now() - new Date(value).getTime()) / 36e5 : 0;

export function buildAdminStats({ commandes = [], relais = [], missions = [], users = [], selectedCountry = 'all', selectedRelay = 'all' }) {
  const relayById = Object.fromEntries(relais.map(r => [r.id, r]));
  const countries = [...new Map(relais.map(r => [r.pays_code || r.pays_nom || 'NA', { code: r.pays_code || r.pays_nom || 'NA', label: r.pays_nom || r.pays_code || 'Non renseigné' }])).values()];
  const visibleRelays = relais.filter(r => selectedCountry === 'all' || [r.pays_code, r.pays_nom].includes(selectedCountry));
  const filteredCommandes = commandes.filter(c => {
    const relay = relayById[c.point_relais_id] || {};
    const countryOk = selectedCountry === 'all' || [relay.pays_code, relay.pays_nom, c.zone_nom].includes(selectedCountry);
    const relayOk = selectedRelay === 'all' || c.point_relais_id === selectedRelay;
    return countryOk && relayOk;
  });

  const caJour = filteredCommandes.filter(c => isToday(c.created_date)).reduce((s, c) => s + (c.montant_paye || 0), 0);
  const caMois = filteredCommandes.filter(c => isThisMonth(c.created_date)).reduce((s, c) => s + (c.montant_paye || 0), 0);
  const bloquees = filteredCommandes.filter(c => c.statut !== 'livree' && c.statut !== 'litige' && hoursSince(c.updated_date || c.created_date) > 48);
  const litiges = filteredCommandes.filter(c => c.statut === 'litige');
  const profilsAttente = relais.filter(r => r.validation_admin === 'en_attente').length + users.filter(u => u.voyageur_validation_status === 'en_attente' || u.identite_validation_status === 'en_attente').length;

  const delivered = filteredCommandes.filter(c => c.statut === 'livree');
  const avgDelay = delivered.length ? delivered.reduce((s, c) => s + Math.max(0, ((toDate(c.date_retrait || c.updated_date) || now) - (toDate(c.created_date) || now)) / 864e5), 0) / delivered.length : 0;
  const monthOrders = filteredCommandes.filter(c => isThisMonth(c.created_date));
  const topRelais = Object.entries(monthOrders.reduce((acc, c) => ({ ...acc, [c.point_relais_id || 'none']: (acc[c.point_relais_id || 'none'] || 0) + 1 }), {}))
    .map(([id, count]) => ({ id, count, name: relayById[id]?.nom || 'Relais non assigné' })).sort((a, b) => b.count - a.count).slice(0, 3);

  return { countries, visibleRelays, filteredCommandes, caJour, caMois, bloquees, litiges, profilsAttente, avgDelay, topRelais,
    logistics: {
      attente: filteredCommandes.filter(c => c.statut === 'en_attente_paiement').length,
      preparation: filteredCommandes.filter(c => ['payee', 'en_transit', 'au_relais'].includes(c.statut)).length,
      livrees: delivered.length,
    },
    voyageurs: {
      actifs: new Set(missions.filter(m => ['acceptee', 'engagee'].includes(m.statut)).map(m => m.voyageur_email).filter(Boolean)).size,
      disponibles: missions.filter(m => m.statut === 'disponible').length,
      livrees: missions.filter(m => m.statut === 'livree').length,
    }
  };
}

export function searchAdminData(query, { commandes = [], relais = [], users = [] }) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const orderResults = commandes.filter(c => [c.id, c.livre_titre, c.lecteur_email, c.voyageur_email].some(v => String(v || '').toLowerCase().includes(q))).slice(0, 4).map(c => ({ type: 'Commande', title: c.livre_titre || c.id, meta: `${c.statut || 'statut inconnu'} · ${c.lecteur_email || 'client inconnu'}` }));
  const relayResults = relais.filter(r => [r.nom, r.gerant_email, r.ville, r.identifiant_connexion].some(v => String(v || '').toLowerCase().includes(q))).slice(0, 4).map(r => ({ type: 'Relais', title: r.nom || r.gerant_email, meta: `${r.ville || 'ville inconnue'} · ${r.validation_admin || 'statut inconnu'}` }));
  const userResults = users.filter(u => [u.full_name, u.email, u.role].some(v => String(v || '').toLowerCase().includes(q))).slice(0, 4).map(u => ({ type: 'Utilisateur', title: u.full_name || u.email, meta: `${u.email || ''} · ${u.role || 'user'}` }));
  return [...orderResults, ...relayResults, ...userResults].slice(0, 8);
}