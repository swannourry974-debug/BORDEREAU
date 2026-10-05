import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { createStagnationCampaigns, COLLECTE_BATCH_CONFIG } from '../../shared/collecteBatching.ts';

export default async function(req) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const result = await createStagnationCampaigns(base44);

    return Response.json({
      ok: true,
      dry_run: payload?.dry_run === true,
      config: COLLECTE_BATCH_CONFIG,
      campagnes_creees: result.created.length,
      campagnes_mises_a_jour: result.updated.length,
      groupes_observes: result.groups,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}