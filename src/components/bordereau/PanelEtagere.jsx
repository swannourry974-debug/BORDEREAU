import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { WelcomeCard, SectionTitle, PerfoStrip, EtagereItem } from './shared';
import CommandeFactureModal from '@/components/etagere/CommandeFactureModal';

const STATUT_CONFIG = {
  en_attente_paiement: { statusClass: 'default', dotClass: 'paye', stampLabel: 'EN ATTENTE', stampColor: 'var(--sepia)', label: 'Paiement en attente' },
  payee:               { statusClass: 'default', dotClass: 'paye', stampLabel: 'PRÉPARATION', stampColor: 'var(--bordeaux)', label: 'En préparation' },
  en_transit:          { statusClass: 'enVol',   dotClass: 'enVol', stampLabel: 'EXPÉDIÉ', stampColor: '#1a3a5c', label: 'Expédié / En cours d’acheminement' },
  au_relais:           { statusClass: 'auRelais',dotClass: 'auRelais', stampLabel: 'DISPONIBLE', stampColor: '#8B6914', label: 'Disponible en point relais' },
  livree:              { statusClass: 'recu',    dotClass: 'recu',  stampLabel: 'LIVRÉ ✓', stampColor: '#2d6a2d', label: 'Livré' },
  litige:              { statusClass: 'default', dotClass: 'paye', stampLabel: 'LITIGE', stampColor: '#b41414', label: 'Litige' },
};

export default function PanelEtagere() {
  const [user, setUser] = useState(null);
  const [commandes, setCommandes] = useState([]);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (!u) { setLoading(false); return; }
      const data = await base44.entities.Commande.filter({ lecteur_email: u.email }, '-created_date', 50);
      setCommandes(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const enCours = commandes.filter(c => !['livree'].includes(c.statut));
  const recues  = commandes.filter(c => c.statut === 'livree');

  const toItem = (c) => {
    const cfg = STATUT_CONFIG[c.statut] || STATUT_CONFIG.en_attente_paiement;
    return {
      ...cfg,
      id: c.id,
      title: c.livre_titre || '—',
      sub: `${c.livre_type || 'Poche'} · ${c.montant_paye ? c.montant_paye.toFixed(2) + ' €' : '—'} · ${c.zone_nom || '—'}`,
      stampSub: c.point_relais_id ? `Relais · ${c.zone_nom}` : c.zone_nom || '—',
    };
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(26,16,8,0.4)' }}>Chargement…</div>
      </div>
    );
  }

  return (
    <div>
      {selectedCommande && <CommandeFactureModal commande={selectedCommande} onClose={() => setSelectedCommande(null)} />}
      <WelcomeCard
        eyebrow="Votre bibliothèque en transit"
        title="Étagère Virtuelle"
        sub={`${enCours.length} livre${enCours.length !== 1 ? 's' : ''} en cours · ${recues.length} reçu${recues.length !== 1 ? 's' : ''}`}
      />

      {commandes.length === 0 ? (
        <div style={{
          background: 'var(--papier)', border: '1.5px dashed rgba(26,16,8,0.2)',
          padding: 32, textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
          <div className="font-playfair" style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Votre étagère est vide</div>
          <div className="font-fell" style={{ fontStyle: 'italic', fontSize: 12, color: 'rgba(26,16,8,0.45)' }}>
            Commandez votre premier livre depuis le Catalogue
          </div>
        </div>
      ) : (
        <>
          {enCours.length > 0 && (
            <>
              <SectionTitle>En cours</SectionTitle>
              {enCours.map((c) => {
                const item = toItem(c);
                return (
                  <EtagereItem
                    key={c.id}
                    statusClass={item.statusClass}
                    dotClass={item.dotClass}
                    title={item.title}
                    sub={item.sub}
                    stampColor={item.stampColor}
                    stampLabel={item.stampLabel}
                    stampSub={item.stampSub}
                    onClick={() => setSelectedCommande(c)}
                  />
                );
              })}
            </>
          )}

          {recues.length > 0 && (
            <>
              <PerfoStrip />
              <SectionTitle>Reçu</SectionTitle>
              {recues.map((c) => {
                const item = toItem(c);
                return (
                  <EtagereItem
                    key={c.id}
                    statusClass={item.statusClass}
                    dotClass={item.dotClass}
                    title={item.title}
                    sub={item.sub}
                    stampColor={item.stampColor}
                    stampLabel={item.stampLabel}
                    stampSub={item.stampSub}
                    onClick={() => setSelectedCommande(c)}
                  />
                );
              })}
            </>
          )}
        </>
      )}
    </div>
  );
}