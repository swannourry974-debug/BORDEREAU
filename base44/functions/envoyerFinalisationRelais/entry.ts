import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { requireAdmin } from '../../shared/adminAuth.ts';

const APP_URL = 'https://bordero.base44.app';
const CONFIG_PLACEHOLDER = 'À configurer';

function useful(value) {
  const text = String(value || '').trim();
  return text && text !== CONFIG_PLACEHOLDER;
}

function appendIfUseful(params, key, value) {
  if (useful(value)) params.set(key, String(value).trim());
}

function buildCompletionUrl(relais) {
  const params = new URLSearchParams();
  params.set('finaliser_relais', String(relais.id));
  params.set('email', String(relais.gerant_email || '').trim());
  appendIfUseful(params, 'nom', relais.nom);
  appendIfUseful(params, 'adresse', relais.adresse);
  appendIfUseful(params, 'ville', relais.ville);
  appendIfUseful(params, 'pays', relais.pays_nom || relais.pays_code);
  appendIfUseful(params, 'type_commerce', relais.type_commerce);
  appendIfUseful(params, 'telephone', relais.telephone);
  appendIfUseful(params, 'horaires', relais.horaires);
  return `${APP_URL}/relais?${params.toString()}`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAdmin(base44);
    if (auth.response) return auth.response;

    const { relaisId, channel } = await req.json().catch(() => ({}));
    const mode = channel === 'push' ? 'push' : 'email';
    if (!relaisId) return Response.json({ error: 'Point relais requis' }, { status: 400 });

    const relais = await base44.asServiceRole.entities.PointRelais.get(String(relaisId)).catch(() => null);
    if (!relais) return Response.json({ error: 'Point relais introuvable' }, { status: 404 });
    if (!useful(relais.gerant_email)) return Response.json({ error: 'Email du gérant manquant' }, { status: 400 });

    const completionUrl = buildCompletionUrl(relais);
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: String(relais.gerant_email).trim(),
      template_name: 'RelaisFinalisationCompte',
      variables: {
        relais_name: useful(relais.nom) ? relais.nom : 'votre commerce',
        completion_url: completionUrl,
      },
    });

    return Response.json({
      success: true,
      channel: mode,
      message: mode === 'push' ? 'Notification envoyée' : 'Email envoyé',
      completion_url: completionUrl,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Envoi impossible' }, { status: 500 });
  }
}