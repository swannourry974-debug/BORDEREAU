export const COLLECTE_MAX_KG = 20;

export const POIDS_LIVRES_GR = {
  Poche: 220,
  Broché: 560,
  BD: 420,
  Relié: 920,
};

export function getOrderWeightKg(order) {
  const format = order.format_livre_bordero === 'S' ? 'Poche' : order.format_livre_bordero === 'L' ? 'Relié' : order.livre_type;
  return (POIDS_LIVRES_GR[format] || 560) / 1000;
}

export function formatKg(value) {
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
}

export function getCollecteStatus(order) {
  const labels = {
    en_attente_paiement: 'En attente',
    payee: 'Acheté',
    en_transit: 'En route',
    au_relais: 'Au relais',
    livree: 'Remis',
    litige: 'Litige',
    annulee: 'Annulée',
  };
  return labels[order.statut] || 'Collecte';
}