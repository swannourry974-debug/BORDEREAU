import React, { useRef, useState } from 'react';
import { roles } from '@/lib/dossierCanvasData';
import { downloadCanvasPdf, downloadCanvasPng } from '@/lib/dossierExport';
import DossierCoverSection from './DossierCoverSection';
import DossierRoleSection from './DossierRoleSection';
import DossierJunctionSection from './DossierJunctionSection';
import DossierExportBar from './DossierExportBar';

export default function AdminDossierCanvas() {
  const canvasRef = useRef(null);
  const sectionRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const bindRef = (index) => (el) => { sectionRefs.current[index] = el; };

  const exportPdf = async () => {
    setLoading(true);
    await downloadCanvasPdf(sectionRefs.current.filter(Boolean));
    setLoading(false);
  };

  const exportPng = async () => {
    setLoading(true);
    await downloadCanvasPng(canvasRef.current);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-bordeaux">
      <DossierExportBar onPdf={exportPdf} onPng={exportPng} loading={loading} />
      {loading && <div className="mb-4 rounded-2xl border border-cta/30 bg-[#fff7ed] p-3 font-ui text-sm text-bordeaux">Préparation du téléchargement…</div>}
      <div ref={canvasRef} className="space-y-8 rounded-[32px] bg-[#f5e6cc] p-4 md:p-8">
        <DossierCoverSection sectionRef={bindRef(0)} />
        {roles.map((role, index) => <DossierRoleSection key={role.id} role={role} sectionRef={bindRef(index + 1)} />)}
        <DossierJunctionSection sectionRef={bindRef(roles.length + 1)} />
      </div>
    </div>
  );
}