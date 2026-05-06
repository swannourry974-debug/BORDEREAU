// ============================================================
// SYSTÈME DE BADGES BORDEREAU — VOYAGEURS
// Chaque badge a un id, un emoji, un nom, une description,
// un seuil de déclenchement et une "rareté" (commune/rare/légendaire)
// ============================================================

export const BADGES_CONFIG = [
  // — Quantité de livres transportés —
  {
    id: 'premier_pas',
    emoji: '📖',
    nom: 'Premier Pas',
    description: 'Votre premier livre transporté.',
    rarete: 'commune',
    condition: (stats) => stats.livresLivres >= 1,
  },
  {
    id: 'grand_lecteur',
    emoji: '📚',
    nom: 'Grand Lecteur',
    description: '10 livres transportés avec succès.',
    rarete: 'rare',
    condition: (stats) => stats.livresLivres >= 10,
  },
  {
    id: 'bibliothecaire',
    emoji: '🏛️',
    nom: 'Bibliothécaire',
    description: '50 livres transportés. La culture voyage avec vous.',
    rarete: 'legendaire',
    condition: (stats) => stats.livresLivres >= 50,
  },
  {
    id: 'passeur_de_pages',
    emoji: '🌍',
    nom: 'Passeur de Pages',
    description: '100 livres livrés. Vous êtes une légende.',
    rarete: 'legendaire',
    condition: (stats) => stats.livresLivres >= 100,
  },

  // — Rapidité de livraison —
  {
    id: 'voyageur_eclair',
    emoji: '⚡',
    nom: 'Voyageur Éclair',
    description: '3 livraisons en moins de 7 jours chacune.',
    rarete: 'rare',
    condition: (stats) => stats.livraisonsRapides >= 3,
  },
  {
    id: 'courrier_express',
    emoji: '🚀',
    nom: 'Courrier Express',
    description: '10 livraisons ultra-rapides (< 5 jours).',
    rarete: 'legendaire',
    condition: (stats) => stats.livraisonsUltraRapides >= 10,
  },

  // — Valise pleine —
  {
    id: 'valise_pleine',
    emoji: '🧳',
    nom: 'Valise Pleine',
    description: 'Transporté 10 livres en un seul voyage.',
    rarete: 'rare',
    condition: (stats) => stats.maxLivresParVoyage >= 10,
  },

  // — Fidélité —
  {
    id: 'voyageur_fidele',
    emoji: '🎖️',
    nom: 'Voyageur Fidèle',
    description: '5 missions acceptées.',
    rarete: 'commune',
    condition: (stats) => stats.missionsAcceptees >= 5,
  },
  {
    id: 'ambassadeur',
    emoji: '✦',
    nom: 'Ambassadeur Bordereau',
    description: '20 missions accomplies. Vous portez l\'âme de Bordereau.',
    rarete: 'legendaire',
    condition: (stats) => stats.missionsAcceptees >= 20,
  },

  // — Destinations —
  {
    id: 'globe_trotter',
    emoji: '🗺️',
    nom: 'Globe Trotter',
    description: 'Livré dans 3 pays différents.',
    rarete: 'rare',
    condition: (stats) => stats.paysVisites >= 3,
  },
];

export const RARETE_STYLES = {
  commune: {
    border: '1px solid hsl(var(--border))',
    bg: 'var(--papier)',
    label: 'Commune',
    labelColor: 'hsl(var(--muted-foreground))',
    glow: 'none',
  },
  rare: {
    border: '1.5px solid var(--sepia)',
    bg: 'rgba(139,105,20,0.06)',
    label: 'Rare',
    labelColor: 'var(--sepia)',
    glow: '0 0 8px rgba(139,105,20,0.2)',
  },
  legendaire: {
    border: '2px solid var(--bordeaux)',
    bg: 'rgba(128,0,32,0.06)',
    label: 'Légendaire',
    labelColor: 'var(--bordeaux)',
    glow: '0 0 12px rgba(128,0,32,0.18)',
  },
};

/**
 * Calcule quels badges sont débloqués pour un ensemble de stats.
 * @param {object} stats - { livresLivres, livraisonsRapides, livraisonsUltraRapides, maxLivresParVoyage, missionsAcceptees, paysVisites }
 * @returns {string[]} liste des badge IDs débloqués
 */
export function getBadgesDebloques(stats) {
  return BADGES_CONFIG.filter(b => b.condition(stats)).map(b => b.id);
}