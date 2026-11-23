// Politiques de sécurité appliquées en plus des RLS déclarées dans les entités.
// Objectif : le navigateur ne décide jamais d'un montant, d'un rôle ou d'une validation.
import type { SessionUser } from './types';

const ADMIN_ROLES = new Set(['admin', 'admin_secondaire']);
const PRIVILEGED_ROLES = new Set(['admin', 'admin_secondaire']);

export function isAdmin(user: SessionUser | null): boolean {
  return !!user && ADMIN_ROLES.has(user.role);
}

export function isSuperAdmin(user: SessionUser | null): boolean {
  return !!user && user.role === 'admin';
}

// --- Champs sensibles de l'utilisateur ------------------------------------

const SELF_UPDATE_DENIED = new Set([
  'id',
  'email',
  'created_date',
  'updated_date',
  'relais_valide',
  'voyageur_valide',
  'documents_valides',
  'virement_suspendu',
  'stripe_account_id',
  'voyageur_fraude_signalee',
  'relais_validation_notes',
  'relais_valide_le',
  'voyageur_valide_le',
  'adresse_mail_contact_verifiee',
]);

const SELF_ROLES = new Set(['lecteur', 'voyageur', 'relais']);

/** Filtre une modification de profil faite par l'utilisateur lui-même. */
export function filterSelfUserPatch(
  current: SessionUser,
  patch: Record<string, unknown>,
): { patch: Record<string, unknown>; rejected: string[] } {
  const clean: Record<string, unknown> = {};
  const rejected: string[] = [];

  for (const [key, value] of Object.entries(patch)) {
    if (SELF_UPDATE_DENIED.has(key)) {
      // Un utilisateur peut seulement *retirer* son propre statut de validation,
      // jamais se l'attribuer.
      if ((key === 'relais_valide' || key === 'voyageur_valide') && value === false) {
        clean[key] = false;
      } else {
        rejected.push(key);
      }
      continue;
    }

    if (key === 'role') {
      if (SELF_ROLES.has(String(value)) || value === current.role) clean[key] = value;
      else rejected.push(key);
      continue;
    }

    if (key === 'voyageur_validation_status') {
      if (['aucune', 'en_attente', 'bloque', 'suspendu'].includes(String(value))) clean[key] = value;
      else rejected.push(key);
      continue;
    }

    if (key === 'relais_validation_status') {
      if (['aucune', 'en_attente'].includes(String(value))) clean[key] = value;
      else rejected.push(key);
      continue;
    }

    if (key === 'voyageur_tentatives_validation') {
      const currentAttempts = Number(current.data?.voyageur_tentatives_validation ?? 0);
      const next = Number(value);
      // On autorise la progression, jamais la remise à zéro du compteur.
      if (Number.isFinite(next) && next >= currentAttempts && next <= currentAttempts + 1) clean[key] = next;
      else rejected.push(key);
      continue;
    }

    clean[key] = value;
  }

  return { patch: clean, rejected };
}

/** Champs d'un utilisateur visibles par un autre utilisateur. */
export function projectUser(user: Record<string, unknown>, viewer: SessionUser | null): Record<string, unknown> {
  const isSelf = !!viewer && viewer.id === user.id;
  if (isSelf || isAdmin(viewer)) return user;

  const shared = new Set([
    'id',
    'email',
    'full_name',
    'role',
    'prenom',
    'nom',
    'preferred_language',
    'voyageur_destination',
    'ville_destination',
    'relais_nom_boutique',
    'relais_ville',
    'relais_pays',
    'relais_valide',
    'voyageur_valide',
    'created_date',
    'updated_date',
  ]);

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(user)) {
    if (shared.has(key)) out[key] = value;
  }
  return out;
}

// --- Champs financiers ----------------------------------------------------

const MONEY_FIELD = /^(montant_|frais_|prix_|cout_|commission|part_|taxe_|solde_|stripe_|paiement_|remboursement_|penalite_|reduction_|total_|economie_|ticket_montant|ecart_prix)/;

/** Champs qu'un non-admin peut modifier mais qui forcent une revalidation. */
const REVALIDATE_ON_CHANGE: Record<string, RegExp[]> = {
  Commande: [/^ticket_montant$/, /^ecart_prix_ticket$/, /^prix_livre_a_rembourser$/],
};

/** Champs strictement réservés à l'administration, par entité. */
const ADMIN_ONLY_FIELDS: Record<string, string[]> = {
  Commande: ['validation_admin', 'admin_notes', 'notification_lecteur_envoyee', 'code_secret', 'colis_prix_achat'],
  MissionVoyageur: ['commission', 'commission_totale', 'voyageur_paye', 'paiement_statut'],
  Voyage: ['validation_admin', 'validation_notes'],
  PointRelais: [
    'validation_admin',
    'actif',
    'part_relais',
    'commission',
    'iban',
    'stripe_account_id',
    'notes_admin',
  ],
  VoyageurWallet: ['solde_disponible', 'solde_en_attente', 'total_gagne', 'total_retire', 'virement_suspendu', 'demande_virement_statut', 'demande_virement_montant', 'demande_virement_le'],
  NotationVoyageur: ['visible', 'modere'],
  CampagnePromoCollecte: ['actif', 'reduction'],
};

export interface WriteCheck {
  patch: Record<string, unknown>;
  blocked: string[];
  revalidate: boolean;
}

/** Assainit une écriture selon le rôle de l'appelant. */
export function guardWrite(
  entity: string,
  user: SessionUser | null,
  patch: Record<string, unknown>,
  mode: 'create' | 'update',
): WriteCheck {
  if (isAdmin(user)) return { patch, blocked: [], revalidate: false };

  const adminOnly = new Set(ADMIN_ONLY_FIELDS[entity] ?? []);
  const revalidateFields = REVALIDATE_ON_CHANGE[entity] ?? [];
  const out: Record<string, unknown> = {};
  const blocked: string[] = [];
  let revalidate = false;

  for (const [key, value] of Object.entries(patch)) {
    if (key === 'id' || key === 'created_date' || key === 'updated_date' || key === 'created_by' || key === 'created_by_id') {
      continue;
    }
    if (adminOnly.has(key)) {
      blocked.push(key);
      continue;
    }
    const revalidating = revalidateFields.some((re) => re.test(key));
    if (revalidating) {
      if (typeof value === 'number' && !Number.isFinite(value)) {
        blocked.push(key);
        continue;
      }
      revalidate = true;
      out[key] = value;
      continue;
    }
    // À la création, un montant déclaré est accepté (facture) mais contrôlé ;
    // à la mise à jour, il est figé : seul le serveur peut le recalculer.
    if (mode === 'update' && MONEY_FIELD.test(key)) {
      blocked.push(key);
      continue;
    }
    if (mode === 'create' && MONEY_FIELD.test(key)) {
      if (typeof value === 'number' && (!Number.isFinite(value) || value < 0 || value > 100000)) {
        blocked.push(key);
        continue;
      }
    }
    out[key] = value;
  }

  if (revalidate) out.validation_admin = 'en_attente';
  return { patch: out, blocked, revalidate };
}

// --- Corrections de RLS ---------------------------------------------------

/**
 * Certaines règles livrées par la plateforme d'origine bloquaient des parcours
 * légitimes (ex. un relais validé ne pouvait plus mettre à jour son stock).
 * Ces dérogations sont explicites et remplacées par les gardes de champs ci-dessus.
 */
export function ruleOverride(
  entity: string,
  action: 'read' | 'create' | 'update' | 'delete',
  record: Record<string, unknown>,
  user: SessionUser | null,
): boolean | undefined {
  if (!user) return undefined;

  if (entity === 'PointRelais') {
    const isOwner = record.gerant_email === user.email;
    if (!isOwner && !isAdmin(user)) return undefined;
    if (action === 'update' && isOwner) return true;
    if (action === 'read' && isOwner) return true;
  }

  if (entity === 'Commande' && action === 'update') {
    // Le relais propriétaire d'une commande peut faire avancer son statut.
    if (!isAdmin(user) && record.point_relais_id && record.point_relais_id === user.data?.point_relais_id) return true;
  }

  if (entity === 'User') {
    if (action === 'read') return isAdmin(user) || record.id === user.id;
    if (action === 'update') return isAdmin(user) || record.id === user.id;
    if (action === 'delete') return user.role === 'admin';
    return false;
  }

  return undefined;
}

export function assertNoPrivilegeEscalation(entity: string, user: SessionUser, patch: Record<string, unknown>): void {
  if (entity !== 'User' || isAdmin(user)) return;
  if (typeof patch.role === 'string' && PRIVILEGED_ROLES.has(patch.role)) {
    throw Object.assign(new Error('Rôle non autorisé'), { status: 403 });
  }
}
