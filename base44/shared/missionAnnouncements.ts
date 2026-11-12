const MS_PER_DAY = 24 * 60 * 60 * 1000;

function rows(page) {
  return page?.items || page || [];
}

function isoPlusDays(source, days) {
  const base = source ? new Date(source) : new Date();
  const time = Number.isFinite(base.getTime()) ? base.getTime() : Date.now();
  return new Date(time + days * MS_PER_DAY).toISOString();
}

function bookLinesFromCommande(commande) {
  const candidates = Array.isArray(commande?.livres) ? commande.livres : Array.isArray(commande?.books) ? commande.books : [];
  if (candidates.length) {
    return candidates.map((book, index) => ({
      index,
      title: book.title || book.livre_titre || commande.livre_titre || 'Livre',
      author: book.author || book.livre_auteur || commande.livre_auteur || '',
      type: book.type || book.livre_type || commande.livre_type || 'Poche',
      weight: book.poids || commande.poids || '200g',
      ref: book.id || book.isbn || book.product_identifier || `${index + 1}`,
    }));
  }
  return [{
    index: 0,
    title: commande.livre_titre || 'Livre',
    author: commande.livre_auteur || '',
    type: commande.livre_type || 'Poche',
    weight: commande.poids || '200g',
    ref: commande.code_barre_isbn || commande.livre_titre || 'livre',
  }];
}

export function publicMissionKey(commande, line) {
  return `${commande.id}:${String(line.ref || line.index || 0).trim() || line.index}`;
}

async function notifyReader(base44, commande, subject, body) {
  if (!commande?.lecteur_email) return null;
  return base44.asServiceRole.integrations.Core.SendEmail({
    to: commande.lecteur_email,
    from_name: 'Bordero — Missions',
    subject,
    body,
    category: 'transactional',
  }).catch(() => null);
}

async function notifyMatchingTravelers(base44, mission, commande) {
  const destination = String(mission.ville_destination || '').toLowerCase();
  const users = rows(await base44.asServiceRole.entities.User.list('-created_date', 200).catch(() => []));
  const travelers = users.filter(user => String(user.role || '').toLowerCase() === 'voyageur')
    .filter(user => {
      const userDestination = String(user.voyageur_destination || user.ville_destination || '').toLowerCase();
      return destination && user.email && (!userDestination || destination.includes(userDestination) || userDestination.includes(destination));
    })
    .slice(0, 20);
  await Promise.allSettled(travelers.map(user => base44.asServiceRole.integrations.Core.SendEmail({
    to: user.email,
    from_name: 'Bordero — Missions voyageurs',
    subject: `Nouvelle mission disponible — ${mission.ville_destination || 'Destination'}`,
    body: `Une nouvelle annonce anonyme est disponible dans votre espace voyageur.\n\n📖 Livre : ${mission.livre}\n🌍 Destination : ${mission.ville_destination || '—'}\n🏷️ Relais : ${mission.point_relais_nom || '—'}\n\nConnectez-vous à Bordero pour accepter la mission.`,
    category: 'transactional',
  }).catch(() => null)));
  return travelers.length;
}

export async function ensureMissionAnnouncementsForCommande(base44, commande, options = {}) {
  if (!commande?.id || commande.statut !== 'payee' || commande.mode_livraison !== 'express') return { created: 0, existing: 0, skipped: true };
  const lines = bookLinesFromCommande(commande);
  let created = 0;
  let existing = 0;
  const missions = [];

  for (const line of lines) {
    const key = publicMissionKey(commande, line);
    const found = rows(await base44.asServiceRole.entities.MissionVoyageur.filter({ commande_livre_ref: key }, '-created_date', 1).catch(() => []));
    if (found[0]) {
      existing += 1;
      missions.push(found[0]);
      continue;
    }
    const mission = await base44.asServiceRole.entities.MissionVoyageur.create({
      commande_id: commande.id,
      commande_livre_ref: key,
      mode_livraison: 'express',
      livre: line.title,
      auteur: line.author,
      type: line.type,
      poids: line.weight,
      ville_destination: commande.zone_nom || 'Destination',
      zone_id: commande.zone_id || 'international',
      point_relais_id: commande.point_relais_id || '',
      point_relais_nom: commande.point_relais_nom || '',
      date_limite: isoPlusDays(commande.facture_emise_le || commande.created_date, 7),
      annonce_expire_at: isoPlusDays(commande.facture_emise_le || commande.created_date, 7),
      statut: 'disponible',
      commission: Number(commande.part_voyageur || 0),
      annonce_anonyme: true,
      annonce_source: 'paiement_confirme',
    });
    created += 1;
    missions.push(mission);
    if (options.notifyTravelers) await notifyMatchingTravelers(base44, mission, commande);
  }

  if (created > 0 && options.notifyReader) {
    await notifyReader(base44, commande, 'Mission Bordero publiée', `Votre paiement est confirmé. ${created} annonce${created > 1 ? 's' : ''} anonyme${created > 1 ? 's' : ''} ${created > 1 ? 'ont été publiées' : 'a été publiée'} pour trouver un voyageur.\n\n📖 Commande : ${commande.livre_titre || 'Livre'}\n🌍 Destination : ${commande.zone_nom || '—'}\n\nAucune information personnelle ni montant payé n’est affiché aux voyageurs.`);
  }

  return { created, existing, missions };
}

export async function cancelMissionAnnouncementsForCommande(base44, commande, reason = 'paiement_annule') {
  const missions = rows(await base44.asServiceRole.entities.MissionVoyageur.filter({ commande_id: commande.id }, '-created_date', 100).catch(() => []));
  const active = missions.filter(mission => !['annulee', 'retiree', 'livree'].includes(mission.statut));
  await Promise.allSettled(active.map(mission => base44.asServiceRole.entities.MissionVoyageur.update(mission.id, { statut: 'annulee', annulation_source: reason, annulee_at: new Date().toISOString() })));
  return { cancelled: active.length };
}

export async function syncMissionStatusForCommande(base44, commandeId, statut, extra = {}) {
  const missions = rows(await base44.asServiceRole.entities.MissionVoyageur.filter({ commande_id: commandeId }, '-created_date', 50).catch(() => []));
  await Promise.allSettled(missions.map(mission => base44.asServiceRole.entities.MissionVoyageur.update(mission.id, { statut, ...extra })));
  return { updated: missions.length };
}

export async function expireOpenMissionAnnouncements(base44) {
  const now = new Date().toISOString();
  const missions = rows(await base44.asServiceRole.entities.MissionVoyageur.filter({ statut: 'disponible', annonce_expire_at: { $lte: now } }, { sort: 'annonce_expire_at', limit: 100 }).catch(() => []));
  let expired = 0;
  for (const mission of missions) {
    await base44.asServiceRole.entities.MissionVoyageur.update(mission.id, { statut: 'expiree', expiree_at: now });
    expired += 1;
    const commande = mission.commande_id ? await base44.asServiceRole.entities.Commande.get(mission.commande_id).catch(() => null) : null;
    if (commande) {
      await notifyReader(base44, commande, 'Annonce Bordero expirée', `Votre annonce pour « ${mission.livre || commande.livre_titre || 'votre livre'} » n’a pas encore été prise après 7 jours.\n\nVous pouvez attendre qu’un voyageur se propose ou demander l’annulation depuis votre suivi Bordero.`);
    }
  }
  return { expired };
}