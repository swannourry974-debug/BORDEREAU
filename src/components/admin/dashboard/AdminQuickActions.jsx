import React, { useState } from 'react';
import { Search, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function AdminQuickActions({ query, onQueryChange, results, users }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const sendAlert = async () => {
    if (!message.trim()) return;
    setSending(true); setFeedback('');
    try {
      const recipients = users.map(u => u.email).filter(Boolean);
      await Promise.all(recipients.map(to => base44.integrations.Core.SendEmail({ to, subject: 'Alerte Bordero', body: message.trim() })));
      setFeedback(`Alerte envoyée à ${recipients.length} utilisateur${recipients.length > 1 ? 's' : ''}.`);
      setMessage('');
    } catch {
      setFeedback("Impossible d’envoyer l’alerte pour le moment.");
    }
    setSending(false);
  };
  return (
    <Card className="bg-papier border-bordeaux/20">
      <CardHeader><CardTitle className="font-heading text-bordeaux">Raccourcis et actions rapides</CardTitle></CardHeader>
      <CardContent className="grid lg:grid-cols-[1fr_360px] gap-5">
        <div><div className="relative"><Search className="absolute left-3 top-3 text-bordeaux/45" size={18} /><Input value={query} onChange={e => onQueryChange(e.target.value)} placeholder="Chercher une commande, un utilisateur ou un relais…" className="pl-10 min-h-[44px] bg-creme border-bordeaux/20 text-bordeaux" /></div>{query.trim().length > 1 && <div className="mt-3 space-y-2">{results.length === 0 ? <div className="text-bordeaux/50 italic p-4 bg-creme rounded-xl">Aucun résultat trouvé.</div> : results.map((r, i) => <div key={`${r.type}-${i}`} className="bg-creme border border-bordeaux/10 rounded-xl p-3"><div className="font-ui text-[10px] uppercase tracking-[1.5px] text-cta">{r.type}</div><div className="text-bordeaux font-medium">{r.title}</div><div className="text-sm text-bordeaux/55">{r.meta}</div></div>)}</div>}</div>
        <div className="bg-creme border border-bordeaux/15 rounded-xl p-4"><div className="font-ui text-[11px] uppercase tracking-[2px] text-bordeaux/60 mb-2">Alerte globale</div><textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Message à envoyer aux utilisateurs inscrits…" className="w-full bg-papier border border-bordeaux/20 p-3 text-sm text-bordeaux" />{feedback && <p className="text-sm text-green-700 mt-2">{feedback}</p>}<Button disabled={sending || !message.trim() || users.length === 0} onClick={sendAlert} className="w-full mt-3 min-h-[44px] bg-cta hover:bg-cta-dark text-cta-foreground"><Send size={16} className="mr-2" />{sending ? 'Envoi…' : 'Envoyer l’alerte'}</Button></div>
      </CardContent>
    </Card>
  );
}