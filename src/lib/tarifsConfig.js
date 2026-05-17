/**
 * BORDEREAU — CONFIGURATION TARIFAIRE OFFICIELLE
 * Source unique de vérité pour tous les calculs de l'application.
 */

// ─── ZONES TARIFAIRES ────────────────────────────────────────────────────────
export const ZONES = {
  EUROPE: {
    id: 'europe',
    label: 'Europe',
    emoji: '🇪🇺',
    pays: ['FR', 'DE', 'IT', 'ES', 'PT', 'BE', 'NL', 'CH', 'GB', 'AT', 'PL', 'SE', 'NO', 'DK'],
    // Tunnel EXPRESS
    express: {
      prix_client: 14.99,
      part_voyageur: 6.00,
      part_relais: 3.00,
      part_admin: 5.99,
    },
    // Tunnel COLLECTIF
    collectif: {
      prix_malle: 79.00,
      part_relais: 15.00,
      part_admin: 64.00,
      cout_moyen_livre: 1.97,   // ~20 livres de 500g = 10kg
    },
    // Quota douanier (sécurité voyageur)
    quota_kg: 10,
    quota_livres: 20,
  },

  INTERNATIONAL: {
    id: 'international',
    label: 'International',
    emoji: '🌍',
    pays: ['US', 'CA', 'AU', 'JP', 'SG', 'AE', 'QA', 'SA', 'ZA', 'MA'],
    express: {
      prix_client: 24.99,
      part_voyageur: 10.00,
      part_relais: 5.00,
      part_admin: 9.99,
    },
    collectif: {
      prix_malle: 199.00,
      part_relais: 40.00,
      part_admin: 159.00,
      cout_moyen_livre: 4.97,
    },
    quota_kg: 5,
    quota_livres: 10,
  },

  GRAND_EXPORT: {
    id: 'grand_export',
    label: 'Grand Export',
    emoji: '✈️',
    pays: ['JP', 'CN', 'KR', 'TH', 'VN', 'IN', 'BR', 'AR', 'MX', 'NG', 'CI', 'SN', 'CM'],
    express: {
      prix_client: 49.99,
      part_voyageur: 20.00,
      part_relais: 10.00,
      part_admin: 19.99,
    },
    collectif: {
      prix_malle: 319.00,
      part_relais: 60.00,
      part_admin: 259.00,
      cout_moyen_livre: 7.97,
    },
    quota_kg: 5,
    quota_livres: 10,
  },

  MAGHREB: {
    id: 'maghreb',
    label: 'Maghreb',
    emoji: '🌙',
    pays: ['DZ', 'TN', 'LY'],
    express: {
      prix_client: 24.99,
      part_voyageur: 10.00,
      part_relais: 5.00,
      part_admin: 9.99,
    },
    collectif: {
      prix_malle: 199.00,
      part_relais: 40.00,
      part_admin: 159.00,
      cout_moyen_livre: 4.97,
    },
    // Quota plus strict : contrôles locaux
    quota_kg: 3,       // 3 à 5 kg
    quota_kg_max: 5,
    quota_livres: 6,   // 6 à 10 livres
    quota_livres_max: 10,
  },
};

// ─── POIDS PAR FORMAT ────────────────────────────────────────────────────────
export const POIDS_FORMAT = {
  Poche: 200,    // g
  Broché: 550,
  BD: 350,
  Relié: 900,
};

// ─── FONCTIONS UTILITAIRES ───────────────────────────────────────────────────

/**
 * Retourne la config de zone à partir du zone_id
 */
export function getZoneById(zoneId) {
  return Object.values(ZONES).find(z => z.id === zoneId) || ZONES.INTERNATIONAL;
}

/**
 * Retourne la config de zone à partir d'un nom de zone (souple)
 */
export function getZoneByNom(nom) {
  if (!nom) return null;
  const n = nom.toLowerCase();
  return Object.values(ZONES).find(z =>
    z.id === n ||
    z.label.toLowerCase() === n ||
    n.includes(z.id) ||
    z.id.includes(n.split(' ')[0])
  ) || null;
}

/**
 * Prix client selon mode
 */
export function getPrixClient(zone, mode) {
  if (!zone) return mode === 'express' ? 24.99 : 4.97;
  return mode === 'express' ? zone.express.prix_client : zone.collectif.cout_moyen_livre;
}

/**
 * Quota maximum de kg pour une zone
 */
export function getQuotaKg(zone) {
  return zone?.quota_kg ?? 5;
}

/**
 * Quota maximum de livres pour une zone
 */
export function getQuotaLivres(zone) {
  return zone?.quota_livres ?? 10;
}

/**
 * Vérifie si un trajet est plein (quota atteint)
 */
export function isTrajetComplet(poidsActuelKg, zone) {
  return poidsActuelKg >= getQuotaKg(zone);
}

/**
 * Génère un code secret aléatoire à 3 chiffres pour la validation de remise
 */
export function genererCodeSecret() {
  return String(Math.floor(100 + Math.random() * 900));
}

/**
 * Calcule la ventilation complète d'une commande express
 */
export function calculerVentilationExpress(zone) {
  if (!zone) return null;
  return {
    prix_client: zone.express.prix_client,
    part_voyageur: zone.express.part_voyageur,
    part_relais: zone.express.part_relais,
    part_admin: zone.express.part_admin,
  };
}

/**
 * Calcule la ventilation complète d'une malle collectif
 */
export function calculerVentilationCollectif(zone) {
  if (!zone) return null;
  return {
    prix_malle: zone.collectif.prix_malle,
    part_relais: zone.collectif.part_relais,
    part_admin: zone.collectif.part_admin,
    cout_moyen_livre: zone.collectif.cout_moyen_livre,
  };
}