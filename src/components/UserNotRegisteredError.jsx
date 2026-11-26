import React from 'react';
import { Link } from 'react-router-dom';

const UserNotRegisteredError = () => {
  return (
    <main className="bordero-error-page">
      <div className="bordero-error-sheet">
        <div className="bordero-error-tear" aria-hidden="true" />

        <p className="bordero-heading-section">Accès non ouvert</p>

        <h1 className="bordero-error-title">Ce carnet n’est pas encore à votre nom.</h1>

        <div className="bordero-wait-rule" aria-hidden="true">✦</div>

        <p className="bordero-error-copy">
          Votre compte existe, mais il n’a pas encore reçu l’accès Bordero.
          Un bibliothécaire doit ouvrir le carnet pour vous.
        </p>

        <ol className="bordero-error-list">
          <li>Vérifiez que vous êtes connecté avec la bonne adresse.</li>
          <li>Demandez l’accès à l’administrateur du carnet.</li>
          <li>Si l’accès vient d’être accordé, déconnectez-vous puis reconnectez-vous.</li>
        </ol>

        <div className="bordero-error-actions">
          <Link to="/" className="bordero-action-secondary px-6 py-3 text-[11px]">
            Revenir à l’accueil
          </Link>
        </div>
      </div>
    </main>
  );
};

export default UserNotRegisteredError;
