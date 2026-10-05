import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { createStagnationCampaigns, COLLECTE_BATCH_CONFIG } from '../../shared/collecteBatching.ts';
import { requireAdmin } from '../../shared/adminAuth.ts';

export default async function(req) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const { response } = await requireAdmin(base44);
    if (response) return response;

    const payload = await req.json().catch(() => ({}));
    const dryRun = payload?.dry_run === true;
    const result = dryRun ? { created: [], updated: [], groups: 0 } : await createStagnationCampaigns(base44);

    return Response.json({
      ok: true,
      dry_run: dryRun,
      config: COLLECTE_BATCH_CONFIG,
      campagnes_creees: result.created.length,
      campagnes_mises_a_jour: result.updated.length,
      groupes_observes: result.groups,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}