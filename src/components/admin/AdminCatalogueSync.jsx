import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import CouponButton from '@/components/shared/CouponButton';
import { toast } from 'sonner';

export default function AdminCatalogueSync() {
  const [lastLog, setLastLog] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadLastLog = async () => {
    const logs = await base44.entities.ImportLog.list('-started_at', 1);
    setLastLog(logs?.[0] || null);
  };

  useEffect(() => {
    loadLastLog().catch(() => {});
  }, []);

  const runTestImport = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('importAwinCultura', { limit: 1000 });
      toast.success('Test catalogue terminé', { description: `${res.data?.books_created || 0} livres créés · ${res.data?.offers_updated || 0} offres Cultura traitées` });
      await loadLastLog();
    } catch (error) {
      toast.error("Synchronisation test impossible", { description: error?.response?.data?.error || error.message });
      await loadLastLog().catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const report = lastLog?.control_report || {};

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-bordeaux/20 bg-papier p-4 shadow-[4px_4px_0_rgba(26,16,8,0.08)]">
        <div className="font-ui text-[10px] uppercase tracking-[2px] text-cta">Catalogue centralisé Bordero</div>
        <h2 className="mt-1 font-heading text-2xl text-bordeaux">Synchronisation Cultura FR</h2>
        <p className="mt-2 font-body text-sm italic text-bordeaux/60">
          Le bouton ci-dessous lance uniquement le test limité à 1 000 produits. L’import complet reste une action manuelle après validation.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <CouponButton onClick={runTestImport} disabled={loading}>{loading ? 'Synchronisation…' : 'Synchroniser le catalogue test (1 000)'}</CouponButton>
          <CouponButton secondary onClick={loadLastLog}>Actualiser le journal</CouponButton>
        </div>
      </section>

      <section className="rounded-2xl border border-bordeaux/15 bg-creme p-4">
        <div className="font-ui text-[10px] uppercase tracking-[2px] text-bordeaux/55">Dernier journal</div>
        {!lastLog ? (
          <div className="mt-3 font-body text-sm italic text-bordeaux/45">Aucun import enregistré.</div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Statut', lastLog.status],
              ['Produits traités', lastLog.products_processed || 0],
              ['Livres créés', lastLog.books_created || 0],
              ['Offres mises à jour', lastLog.offers_updated || 0],
              ['Doublons', lastLog.duplicates || 0],
              ['Erreurs', lastLog.errors || 0],
              ['Début', lastLog.started_at ? new Date(lastLog.started_at).toLocaleString('fr-FR') : '—'],
              ['Fin', lastLog.finished_at ? new Date(lastLog.finished_at).toLocaleString('fr-FR') : '—'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-bordeaux/10 bg-papier p-3">
                <div className="font-ui text-[9px] uppercase tracking-[1.4px] text-bordeaux/45">{label}</div>
                <div className="mt-1 font-heading text-lg text-bordeaux">{value}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {report.same_then_category_example && (
        <section className="rounded-2xl border border-cta/25 bg-papier p-4">
          <div className="font-ui text-[10px] uppercase tracking-[2px] text-cta">Contrôle same_then_category</div>
          <div className="mt-2 font-heading text-xl text-bordeaux">{report.same_then_category_example.book.title}</div>
          <div className="font-body text-sm italic text-bordeaux/55">{report.same_then_category_example.book.author || 'Auteur non renseigné'} · {report.same_then_category_example.book.category || 'Catégorie non renseignée'}</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(report.same_then_category_example.suggestions || []).map((item) => (
              <div key={`${item.origin}-${item.id}`} className="rounded-xl border border-bordeaux/10 bg-creme p-3">
                <div className="font-ui text-[9px] uppercase tracking-[1.4px] text-cta">{item.origin === 'same_author' ? 'Même auteur' : 'Même catégorie'}</div>
                <div className="font-heading text-base text-bordeaux">{item.title}</div>
                <div className="font-body text-xs italic text-bordeaux/50">{item.availability} · {Number(item.price || 0).toFixed(2)} €</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}