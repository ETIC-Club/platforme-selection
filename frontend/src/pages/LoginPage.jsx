import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { api } from '../services/endpoints.js';
import { Loader, Alert } from '../components/ui/Feedback.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import { TypeBadge, Badge } from '../components/ui/Badge.jsx';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/events';
  const { data, error, loading, reload } = useApi(() => api.auth.devUsers(), []);
  const [busyId, setBusyId] = useState(null);
  const [loginError, setLoginError] = useState(null);

  if (user) return <Navigate to={from} replace />;

  const devDisabled = error?.status === 404;

  const signIn = async (u) => {
    setBusyId(u.id);
    setLoginError(null);
    try {
      const res = await api.auth.devLogin({ userId: u.id });
      login(res.token, res.user);
      navigate(from, { replace: true });
    } catch (e) {
      setLoginError(e.message);
      setBusyId(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-xl space-y-5">
        <div className="text-center">
          <svg viewBox="0 0 64 64" className="mx-auto h-16 w-16" aria-hidden="true">
            <rect x="8" y="12" width="46" height="46" rx="13" fill="#09a99d" />
            <circle cx="10" cy="8" r="5" fill="#f59e0b" />
            <circle cx="56" cy="14" r="3" fill="#facc15" />
            <text x="31" y="40" textAnchor="middle" fontFamily="Arial" fontWeight="700" fontSize="16" fill="#fff">ETIC</text>
          </svg>
          <h1 className="mt-3 text-2xl font-bold uppercase">Platform Selection</h1>
          <p className="text-sm text-neutral-500">Connectez-vous pour accéder à votre espace.</p>
        </div>

        <section className="card">
          <h2 className="font-bold">Connexion</h2>
          <button disabled className="btn mt-3 w-full border border-neutral-300 bg-white text-neutral-500" title="L'authentification Google n'est pas encore branchée côté serveur">
            Continuer avec Google — bientôt disponible
          </button>
        </section>

        <section className="rounded-3xl border-2 border-dashed border-amber-400 bg-amber-50 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold">Mode développement</h2>
            <Badge tone="amber">Non destiné à la production</Badge>
          </div>
          <p className="mt-1 text-sm text-neutral-600">Simule un utilisateur existant pour tester les rôles.</p>

          <div className="mt-4 space-y-2">
            {loading && <Loader label="Chargement des comptes…" />}
            {devDisabled && <Alert type="warn">Le mode développement est désactivé sur le serveur (AUTH_MODE).</Alert>}
            {error && !devDisabled && (
              <div className="space-y-3">
                <Alert type="error">{error.message}</Alert>
                <button className="btn-outline" onClick={reload}>Réessayer</button>
              </div>
            )}
            {loginError && <Alert type="error">{loginError}</Alert>}
            {data?.items.map((u) => (
              <button
                key={u.id}
                onClick={() => signIn(u)}
                disabled={busyId !== null}
                className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition hover:ring-2 hover:ring-brand disabled:opacity-60"
              >
                <Avatar name={u.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{u.name}</span>
                  <span className="block truncate text-xs text-neutral-500">{u.email}</span>
                </span>
                {u.role === 'ADMIN' ? <Badge tone="red">Admin</Badge> : <TypeBadge type={u.selectorType} />}
                {busyId === u.id && <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
