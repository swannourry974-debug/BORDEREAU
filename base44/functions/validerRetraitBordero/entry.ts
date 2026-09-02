import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { getFormatLivre, hashSecurity, parseToken, assertFormatCoherent } from '../../shared/borderoSecurity.ts';

const SECURITY_FAILURE = 'Échec d\'authentification de sécurité Bordero : incohérence entre le visuel de commande et le code de validation.';

async function fail(base44, commande, raison) {
  if (commande?.id) {
    await base44.asServiceRole.entities.Commande.update(commande.id, {
      alerte_securite_bordero: `${SECURITY_FAILURE} ${raison}`,
      derniere_alerte_securite: new Date().toISOString(),
    }).catch(() => null);
  }
  return Response.json({ valide: false, raison: `${SECURITY_FAILURE} ${raison}` }, { status: 400 });
}

async function libererSequestreVoyageur(base44, commande) {
  if (!commande?.voyageur_email || commande.remboursement_livre_libere) return 0;
  const prixLivre = Number(commande.prix_livre_neuf || 0);
  const commission = Number(commande.part_voyageur || 0);
  const montant = Math.max(0, prixLivre + commission);
  if (montant <= 0) return 0;

  const wallets = await base44.asServiceRole.entities.VoyageurWallet.filter({ user_email: commande.voyageur_email }, '-updated_date', 1);
  if (wallets?.[0]) {
    await base44.asServiceRole.entities.VoyageurWallet.update(wallets[0].id, {
      solde_disponible: Number(wallets[0].solde_disponible || 0) + montant,
      gains_previsionnels: Math.max(0, Number(wallets[0].gains_previsionnels || 0) - commission),
    });
  } else {
    await base44.asServiceRole.entities.VoyageurWallet.create({
      user_email: commande.voyageur_email,
      solde_disponible: montant,
      gains_previsionnels: 0,
      livres_actifs: 0,
    });
  }
  return montant;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'admin_secondaire', 'relais', 'voyageur'].includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const token = String(body.token || '').trim();
    const payload = parseToken(token);
    if (!payload) return Response.json({ valide: false, raison: SECURITY_FAILURE }, { status: 400 });

    const commande = await base44.asServiceRole.entities.Commande.get(payload.ID_Commande).catch(() => null);
    if (!commande) return Response.json({ valide: false, raison: `${SECURITY_FAILURE} Commande introuvable.` }, { status: 404 });

    const formatAttendu = getFormatLivre(commande.livre_type || 'Poche');
    const secret = secrets.get('BASE44_APP_ID') || 'bordero';
    const hashAttendu = await hashSecurity(commande.id, commande.lecteur_email || '', formatAttendu, secret);

    if (payload.ID_Lecteur !== (commande.lecteur_email || '')) return fail(base44, commande, 'Lecteur incohérent.');
    if (payload.Format_Livre !== formatAttendu) return fail(base44, commande, 'Taille S/M/L incohérente avec le format physique du livre.');
    if (payload.Hash_Securite !== hashAttendu || commande.hash_securite !== hashAttendu || commande.qr_code_token !== token) return fail(base44, commande, 'Hash de sécurité invalide.');

    const visuel = commande.visuel_bordero_id
      ? await base44.asServiceRole.entities.VisuelBordero.get(commande.visuel_bordero_id).catch(() => null)
      : null;
    if (!visuel || !visuel.actif) return fail(base44, commande, 'Visuel Bordero introuvable ou désactivé.');
    if (visuel.taille !== formatAttendu || !assertFormatCoherent(commande.livre_type || 'Poche', visuel.taille)) {
      return fail(base44, commande, 'Visuel officiel non concordant avec la taille du livre.');
    }

    if (!['en_transit', 'au_relais'].includes(commande.statut)) {
      return fail(base44, commande, 'Statut de commande non éligible à la remise sécurisée.');
    }

    const now = new Date();
    const action = commande.statut === 'en_transit' ? 'reception_relais' : 'retrait_lecteur';
    const receipt = `${action === 'reception_relais' ? 'Réceptionné en point relais' : 'Retiré par le lecteur'} · ${now.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })} · ${commande.id}`;
    const updates: Record<string, any> = {
      statut: action === 'reception_relais' ? 'au_relais' : 'livree',
      recu_horodate: receipt,
      alerte_securite_bordero: '',
      derniere_alerte_securite: '',
    };

    let montantRembourse = 0;
    if (action === 'reception_relais') {
      const dateLimite = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      montantRembourse = await libererSequestreVoyageur(base44, commande);
      updates.date_arrivee_relais = now.toISOString();
      updates.date_limite_collecte = dateLimite;
      updates.remboursement_livre_libere = montantRembourse > 0;
      updates.remboursement_livre_libere_le = montantRembourse > 0 ? now.toISOString() : '';
      updates.montant_rembourse_voyageur = montantRembourse;
    } else {
      updates.date_retrait = now.toISOString();
    }

    const updated = await base44.asServiceRole.entities.Commande.update(commande.id, updates);

    const relais = await base44.asServiceRole.entities.PointRelais.filter({ gerant_email: user.email }, '-updated_date', 1).catch(() => []);
    if (relais?.[0]) {
      const stock = relais[0].stock_actuel || 0;
      await base44.asServiceRole.entities.PointRelais.update(relais[0].id, {
        stock_actuel: action === 'reception_relais' ? stock + 1 : Math.max(0, stock - 1),
      }).catch(() => null);
    }

    return Response.json({ valide: true, action, recu: receipt, commande: updated, visuel, montant_rembourse_voyageur: montantRembourse });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}