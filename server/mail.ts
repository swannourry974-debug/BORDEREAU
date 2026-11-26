// Envoi d'e-mails : Resend si une clé est fournie, sinon file d'attente en base.
// Rien n'est perdu silencieusement : les messages non envoyés restent visibles dans `outbox`.
import { DB, newId, nowIso } from './db';
import type { Env } from './types';

export interface MailInput {
  to: string;
  subject: string;
  body: string;
  from_name?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toHtml(body: string): string {
  const paragraphs = escapeHtml(body)
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 14px;">${block.replace(/\n/g, '<br />')}</p>`)
    .join('');
  return `<!doctype html><html lang="fr"><body style="font-family:Georgia,serif;background:#fbf6ee;padding:24px;color:#1a1008;">
  <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e7dccb;padding:28px;">
    <p style="letter-spacing:3px;font-size:11px;text-transform:uppercase;color:#7a1f2b;margin:0 0 18px;">Bordero</p>
    ${paragraphs}
  </div>
</body></html>`;
}

export async function sendMail(env: Env, db: DB, input: MailInput): Promise<{ queued: boolean }> {
  const to = String(input.to || '').trim();
  if (!to) return { queued: false };

  if (env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.MAIL_FROM || 'Bordero <noreply@thebordero.com>',
          to: [to],
          subject: input.subject || 'Bordero',
          text: input.body,
          html: toHtml(input.body),
        }),
      });
      if (response.ok) return { queued: false };
      const detail = await response.text().catch(() => '');
      await db.run(
        'INSERT INTO outbox (id, to_email, from_name, subject, body, status, error, created_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        newId(),
        to,
        input.from_name ?? null,
        input.subject ?? null,
        input.body ?? null,
        'echec',
        `${response.status} ${detail}`.slice(0, 500),
        nowIso(),
      );
      return { queued: true };
    } catch (error) {
      await db.run(
        'INSERT INTO outbox (id, to_email, from_name, subject, body, status, error, created_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        newId(),
        to,
        input.from_name ?? null,
        input.subject ?? null,
        input.body ?? null,
        'echec',
        String(error).slice(0, 500),
        nowIso(),
      );
      return { queued: true };
    }
  }

  await db.run(
    'INSERT INTO outbox (id, to_email, from_name, subject, body, status, error, created_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    newId(),
    to,
    input.from_name ?? null,
    input.subject ?? null,
    input.body ?? null,
    'en_attente',
    null,
    nowIso(),
  );
  return { queued: true };
}
