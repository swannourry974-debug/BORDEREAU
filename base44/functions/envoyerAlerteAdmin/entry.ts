import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAdmin } from '../../shared/adminAuth.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAdmin(base44);
    if (auth.response) return auth.response;

    const { message } = await req.json().catch(() => ({}));
    const body = String(message || '').trim();
    if (!body) return Response.json({ error: 'Message requis' }, { status: 400 });

    const users = await base44.asServiceRole.entities.User.list('-updated_date', 500);
    const recipients = users.map(user => user.email).filter(Boolean);
    await Promise.all(recipients.map(to => base44.asServiceRole.integrations.Core.SendEmail({
      to,
      subject: 'Alerte Bordero',
      body,
    })));

    return Response.json({ success: true, recipients: recipients.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}