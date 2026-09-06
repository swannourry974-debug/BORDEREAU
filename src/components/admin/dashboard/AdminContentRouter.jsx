import React from 'react';
import AdminActivityApp from '@/components/admin/AdminActivityApp';
import AdminAchatsVilles from '@/components/admin/AdminAchatsVilles';
import AdminLivraisonsEtats from '@/components/admin/AdminLivraisonsEtats';
import AdminLitiges from '@/components/admin/AdminLitiges';
import AdminReseauRelais from '@/components/admin/AdminReseauRelais';
import AdminCommandesCollectif from '@/components/admin/AdminCommandesCollectif';
import ValidationPointsRelais from '@/components/admin/ValidationPointsRelais';
import AdminValidationVoyageurs from '@/components/admin/AdminValidationVoyageurs';
import AdminDossierCanvas from '@/components/admin/dossier/AdminDossierCanvas';
import AdminHomeDashboard from './AdminHomeDashboard';

export default function AdminContentRouter(props) {
  if (props.activeTab === 'dashboard') return <AdminHomeDashboard {...props.homeProps} />;
  if (props.activeTab === 'activite') return <AdminActivityApp />;
  if (props.activeTab === 'villes') return <AdminAchatsVilles />;
  if (props.activeTab === 'livraisons') return <AdminLivraisonsEtats />;
  if (props.activeTab === 'litiges') return <AdminLitiges />;
  if (props.activeTab === 'collectif') return <AdminCommandesCollectif />;
  if (props.activeTab === 'validation-relais') return <ValidationPointsRelais />;
  if (props.activeTab === 'validation-voyageurs') return <AdminValidationVoyageurs />;
  if (props.activeTab === 'relais') return <AdminReseauRelais />;
  if (props.activeTab === 'dossier-canvas') return <AdminDossierCanvas />;
  return <AdminHomeDashboard {...props.homeProps} />;
}