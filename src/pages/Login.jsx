import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const inputClass =
  'w-full border border-encre/20 bg-creme px-4 py-3 font-body text-base text-encre outline-none focus:border-bordeaux';

export default function Login() {
  const [params] = useSearchParams();
  const fromUrl = params.get('from_url') || '/';
  const resetToken = params.get('reset');
  const { user, checkUserAuth } = useAuth();

  const [mode, setMode] = useState(resetToken ? 'reset' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !resetToken) window.location.replace(fromUrl);
  }, [user, fromUrl, resetToken]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await base44.auth.login(email, password);
        await checkUserAuth();
        window.location.replace(fromUrl);
        return;
      }
      if (mode === 'signup') {
        await base44.auth.signup({ email, password, full_name: fullName });
        await checkUserAuth();
        window.location.replace(fromUrl);
        return;
      }
      if (mode === 'forgot') {
        await base44.auth.forgotPassword(email);
        setMessage('Si un compte existe avec cette adresse, un lien de réinitialisation vient d’être envoyé.');
        return;
      }
      if (mode === 'reset') {
        await base44.auth.resetPassword(resetToken, password);
        await checkUserAuth();
        window.location.replace('/');
      }
    } catch (submitError) {
      setError(submitError?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === 'signup'
      ? 'Créer un compte'
      : mode === 'forgot'
        ? 'Mot de passe oublié'
        : mode === 'reset'
          ? 'Nouveau mot de passe'
          : 'Se connecter';

  return (
    <main className="bordero-shell flex min-h-screen items-center justify-center px-5 py-12 text-encre">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="bordero-heading-section">Bordero</p>
          <h1 className="mt-3 font-heading text-4xl text-bordeaux">{title}</h1>
          <p className="mt-3 font-body text-lg text-encre/70">
            Vos livres voyagent autrement, du lecteur au voyageur.
          </p>
        </div>

        <form onSubmit={submit} className="bordero-card-premium space-y-4 p-7 sm:p-8">
          {mode === 'signup' && (
            <label className="block">
              <span className="mb-1 block font-body text-sm text-encre/70">Nom complet</span>
              <input
                className={inputClass}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                required
              />
            </label>
          )}

          {mode !== 'reset' && (
            <label className="block">
              <span className="mb-1 block font-body text-sm text-encre/70">Adresse e-mail</span>
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>
          )}

          {mode !== 'forgot' && (
            <label className="block">
              <span className="mb-1 block font-body text-sm text-encre/70">
                {mode === 'reset' ? 'Nouveau mot de passe' : 'Mot de passe'}
              </span>
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={8}
                required
              />
              {(mode === 'signup' || mode === 'reset') && (
                <span className="mt-1 block font-body text-xs text-encre/50">
                  8 caractères minimum, avec au moins une lettre et un chiffre.
                </span>
              )}
            </label>
          )}

          {error && <p className="font-body text-sm text-bordeaux">{error}</p>}
          {message && <p className="font-body text-sm text-encre/70">{message}</p>}

          <button type="submit" disabled={loading} className="bordero-action-primary w-full px-6 py-3 text-xs">
            {loading ? 'Un instant…' : title}
          </button>

          <div className="flex flex-col gap-2 pt-2 text-center font-body text-sm text-encre/60">
            {mode === 'login' && (
              <>
                <button type="button" onClick={() => setMode('forgot')} className="underline">
                  Mot de passe oublié ?
                </button>
                <button type="button" onClick={() => setMode('signup')} className="underline">
                  Pas encore de compte ? Créer un compte
                </button>
              </>
            )}
            {mode !== 'login' && (
              <button type="button" onClick={() => setMode('login')} className="underline">
                Revenir à la connexion
              </button>
            )}
            <a href="/" className="underline">
              Retour à l’accueil
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}
