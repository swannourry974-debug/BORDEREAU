import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function PageNotFound() {
  return (
    <main className="bordero-error-page">
      <div className="bordero-error-sheet">
        <div className="bordero-error-tear" aria-hidden="true" />

        <p className="bordero-heading-section">Carnet de bord</p>

        <div className="bordero-error-stamp" aria-hidden="true">
          <span className="bordero-error-code">404</span>
        </div>

        <h1 className="bordero-error-title">Cette page s’est détachée du carnet.</h1>

        <div className="bordero-wait-rule" aria-hidden="true">✦</div>

        <p className="bordero-error-copy">
          Le feuillet que vous cherchez a été arraché, déplacé, ou n’a jamais été relié.
          Le reste du carnet est intact.
        </p>

        <div className="bordero-error-actions">
          <Link to="/" className="bordero-action-primary px-6 py-3 text-[11px]">
            Revenir à l’accueil
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <p className="bordero-error-foot">Erreur 404 · page introuvable</p>
      </div>
    </main>
  );
}
