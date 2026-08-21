import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { getFormatLivre, hashSecurity, makeToken } from '../../shared/borderoSecurity.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const commandeId = body.commande_id || body.commandeId;
    if (!commandeId) return Response.json({ error: 'commande_id requis' }, { status: 400 });

    const commande = await base44.asServiceRole.entities.Commande.get(commandeId);
    if (!commande) return Response.json({ error: 'Commande introuvable' }, { status: 404 });

    const allowed = user.role === 'admin' || user.role === 'admin_secondaire' || commande.lecteur_email === user.email || commande.voyageur_email === user.email;
    if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const formatLivre = getFormatLivre(commande.livre_type || 'Poche');
    const secret = secrets.get('BASE44_APP_ID') || 'bordero';
    const hash = await hashSecurity(commande.id, commande.lecteur_email || '', formatLivre, secret);
    const token = makeToken({
      ID_Commande: commande.id,
      ID_Lecteur: commande.lecteur_email || '',
      Format_Livre: formatLivre,
      Hash_Securite: hash,
    });

    let visuel = null;
    if (commande.visuel_bordero_id) {
      visuel = await base44.asServiceRole.entities.VisuelBordero.get(commande.visuel_bordero_id).catch(() => null);
    }
    if (!visuel || visuel.taille !== formatLivre || !visuel.actif) {
      const visuals = await base44.asServiceRole.entities.VisuelBordero.filter({ taille: formatLivre, actif: true }, 'serie', 100);
      if (!visuals || visuals.length === 0) {
        return Response.json({ error: `Aucun visuel Bordero actif pour la taille ${formatLivre}` }, { status: 409 });
      }
      const seed = String(commande.id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      visuel = visuals[seed % visuals.length];
    }

    const updated = await base44.asServiceRole.entities.Commande.update(commande.id, {
      visuel_bordero_id: visuel.id,
      visuel_bordero_url: visuel.image_url,
      visuel_bordero_serie: visuel.serie,
      format_livre_bordero: formatLivre,
      qr_code_token: token,
      qr_code_depot: token,
      hash_securite: hash,
      alerte_securite_bordero: '',
    });

    return Response.json({ ok: true, commande: updated, token, visuel, format_livre: formatLivre });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}