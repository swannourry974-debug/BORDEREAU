const CAPACITE_CARTON = 40;
const STAGNATION_DAYS = 7;
const PROMO_VALID_DAYS = 14;
const PROMO_AMOUNT = 5;
const WEIGHTS = { S: 0.22, M: 0.56, L: 0.92, Poche: 0.22, Broché: 0.56, BD: 0.42, Relié: 0.92 };

export function resolveCollecteFormat(order) {
  if (order.format_livre_bordero) return order.format_livre_bordero;
  if (order.livre_type === 'Poche') return 'S';
  if (order.livre_type === 'BD' || order.livre_type === 'Relié') return 'L';
  return 'M';
}

export function getCollecteWeightKg(order) {
  return WEIGHTS[resolveCollecteFormat(order)] || 0.56;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function cleanCodePart(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8) || 'RELAIS';
}

function isPaidCollecte(order) {
  return order?.mode_livraison === 'collectif' && order?.statut === 'payee' && !order?.malle_id && !!order?.point_relais_id;
}

export async function validateCollectePromo(base44, { code, pointRelaisId }) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized || !pointRelaisId) return null;
  const matches = await base44.asServiceRole.entities.CampagnePromoCollecte.filter({ code: normalized, statut: 'active' }, '-created_date', 5).catch(() => []);
  const now = Date.now();
  return (matches || []).find(c => c.point_relais_id === pointRelaisId && (!c.valide_jusquau || new Date(c.valide_jusquau).getTime() >= now)) || null;
}

export async function groupRelayCollecte(base44, pointRelaisId) {
  if (!pointRelaisId) return { created: 0, assigned: 0, skipped: 'missing_relay' };

  const [orders, relay] = await Promise.all([
    base44.asServiceRole.entities.Commande.filter({ mode_livraison: 'collectif', statut: 'payee', point_relais_id: pointRelaisId }, 'created_date', 500),
    base44.asServiceRole.entities.PointRelais.get(pointRelaisId).catch(() => null),
  ]);

  let pending = (orders || []).filter(isPaidCollecte).sort((a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0));
  const relayInfo = relay || {};
  let created = 0;
  let assigned = 0;

  while (pending.length >= CAPACITE_CARTON) {
    const chunk = pending.slice(0, CAPACITE_CARTON);
    const now = new Date().toISOString();
    const cartonRef = `COL-${cleanCodePart(relayInfo.nom || pointRelaisId)}-${now.slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-5)}`;
    const poids = Math.round(chunk.reduce((sum, order) => sum + getCollecteWeightKg(order), 0) * 100) / 100;
    const malle = await base44.asServiceRole.entities.MalleCollecte.create({
      point_relais_id: pointRelaisId,
      point_relais_nom: relayInfo.nom || chunk[0]?.point_relais_nom || 'Point relais',
      statut: 'en_preparation',
      poids_actuel_kg: poids,
      nombre_commandes: CAPACITE_CARTON,
      capacite_commandes: CAPACITE_CARTON,
      numero_carton: cartonRef,
      seuil_atteint_le: now,
    });

    await base44.asServiceRole.entities.Commande.bulkUpdate(chunk.map((order, index) => ({
      id: order.id,
      malle_id: malle.id,
      statut: 'en_preparation',
      collecte_batch_statut: 'malle_creee',
      collecte_regroupee_le: now,
      collecte_position_malle: index + 1,
    })));

    created += 1;
    assigned += chunk.length;
    pending = pending.slice(CAPACITE_CARTON);
  }

  if (created > 0) {
    const activeCampaigns = await base44.asServiceRole.entities.CampagnePromoCollecte.filter({ point_relais_id: pointRelaisId, statut: 'active' }, '-created_date', 20).catch(() => []);
    if (activeCampaigns.length) {
      await base44.asServiceRole.entities.CampagnePromoCollecte.bulkUpdate(activeCampaigns.map(c => ({ id: c.id, statut: 'terminee', desactivee_le: new Date().toISOString(), nombre_commandes_attente: pending.length })));
    }
  }

  return { created, assigned, pending: pending.length };
}

export async function groupAllEligibleCollecte(base44) {
  const orders = await base44.asServiceRole.entities.Commande.filter({ mode_livraison: 'collectif', statut: 'payee' }, 'created_date', 500);
  const relayIds = [...new Set((orders || []).filter(isPaidCollecte).map(o => o.point_relais_id))];
  const results = [];
  for (const relayId of relayIds) {
    results.push({ point_relais_id: relayId, ...(await groupRelayCollecte(base44, relayId)) });
  }
  return results;
}

export async function createStagnationCampaigns(base44) {
  await groupAllEligibleCollecte(base44);

  const [orders, relays, campaigns] = await Promise.all([
    base44.asServiceRole.entities.Commande.filter({ mode_livraison: 'collectif', statut: 'payee' }, 'created_date', 500),
    base44.asServiceRole.entities.PointRelais.list('-updated_date', 500),
    base44.asServiceRole.entities.CampagnePromoCollecte.list('-updated_date', 500).catch(() => []),
  ]);

  const relayById = new Map((relays || []).map(r => [r.id, r]));
  const activeByRelay = new Map((campaigns || []).filter(c => c.statut === 'active').map(c => [c.point_relais_id, c]));
  const groups = new Map();

  (orders || []).filter(isPaidCollecte).forEach(order => {
    const list = groups.get(order.point_relais_id) || [];
    list.push(order);
    groups.set(order.point_relais_id, list);
  });

  const now = new Date();
  const created = [];
  const updated = [];

  for (const [relayId, list] of groups.entries()) {
    if (list.length >= CAPACITE_CARTON) continue;
    const sorted = list.sort((a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0));
    const latestDate = new Date(sorted[sorted.length - 1]?.created_date || 0);
    const active = activeByRelay.get(relayId);

    if (active) {
      if (active.valide_jusquau && new Date(active.valide_jusquau).getTime() < now.getTime()) {
        updated.push(await base44.asServiceRole.entities.CampagnePromoCollecte.update(active.id, { statut: 'expiree', desactivee_le: now.toISOString(), nombre_commandes_attente: list.length }));
      } else {
        updated.push(await base44.asServiceRole.entities.CampagnePromoCollecte.update(active.id, { nombre_commandes_attente: list.length, derniere_commande_le: latestDate.toISOString() }));
      }
      continue;
    }

    const daysWithoutProgress = Math.floor((now.getTime() - latestDate.getTime()) / (24 * 60 * 60 * 1000));
    if (daysWithoutProgress < STAGNATION_DAYS) continue;

    const relay = relayById.get(relayId) || {};
    const code = `PARTAGE${cleanCodePart(relay.nom || relay.ville || relayId).slice(0, 6)}`;
    const campaign = await base44.asServiceRole.entities.CampagnePromoCollecte.create({
      point_relais_id: relayId,
      point_relais_nom: relay.nom || 'Point relais',
      code,
      montant_reduction: PROMO_AMOUNT,
      devise: 'EUR',
      statut: 'active',
      seuil_stagnation_jours: STAGNATION_DAYS,
      objectif_commandes: CAPACITE_CARTON,
      nombre_commandes_attente: list.length,
      nombre_utilisations: 0,
      active_le: now.toISOString(),
      valide_jusquau: addDays(now, PROMO_VALID_DAYS).toISOString(),
      derniere_commande_le: latestDate.toISOString(),
      message_partage: `Votre point relais attend encore ${CAPACITE_CARTON - list.length} livre(s) pour fermer le carton Bordero. Partagez le code ${code} autour de vous pour accélérer la Collecte.`,
    });
    created.push(campaign);
  }

  return { created, updated, groups: groups.size };
}

export const COLLECTE_BATCH_CONFIG = { CAPACITE_CARTON, STAGNATION_DAYS, PROMO_VALID_DAYS, PROMO_AMOUNT };