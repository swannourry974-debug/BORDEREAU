import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function RelaisFinalisationActions({ relais }) {
  const [sending, setSending] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const sendFinalisation = async (channel) => {
    if (sending) return;
    setSending(channel);
    setFeedback('');
    setError('');
    try {
      const response = await base44.functions.invoke('envoyerFinalisationRelais', { relaisId: relais.id, channel });
      setFeedback(response.data?.message || (channel === 'push' ? 'Notification envoyée' : 'Email envoyé'));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Envoi impossible');
    } finally {
      setSending('');
    }
  };

  return (
    <div className="flex flex-col items-end gap-1 min-w-[190px]">
      <div className="flex justify-end gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => sendFinalisation('push')}
          disabled={!!sending || !relais.gerant_email}
          className="bg-cta text-cta-foreground px-3 py-2 text-[11px] font-ui uppercase tracking-[1px] disabled:opacity-50"
        >
          {sending === 'push' ? 'Envoi…' : 'Push - Finaliser le compte'}
        </button>
        <button
          type="button"
          onClick={() => sendFinalisation('email')}
          disabled={!!sending || !relais.gerant_email}
          className="border border-bordeaux text-bordeaux px-3 py-2 text-[11px] font-ui uppercase tracking-[1px] disabled:opacity-50"
        >
          {sending === 'email' ? 'Envoi…' : 'Email'}
        </button>
      </div>
      {feedback && <div className="text-[11px] text-green-700 text-right">{feedback}</div>}
      {error && <div className="text-[11px] text-red-700 text-right max-w-[210px]">{error}</div>}
    </div>
  );
}