import { Link } from 'react-router-dom';

export function Loader({ label = 'Chargement…', full = false }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-neutral-500 ${full ? 'min-h-screen' : 'py-16'}`} role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function describe(error) {
  switch (error?.status) {
    case 0: return { title: 'Serveur injoignable', hint: error.message };
    case 401: return { title: 'Session expirée', hint: 'Veuillez vous reconnecter.' };
    case 403: return { title: 'Accès refusé', hint: error.message || "Vous n'avez pas accès à cette page." };
    case 404: return { title: 'Introuvable', hint: error.message || "Cette ressource n'existe pas." };
    default: return { title: 'Une erreur est survenue', hint: error?.message || 'Réessayez dans un instant.' };
  }
}

export function ErrorState({ error, onRetry, backTo }) {
  const { title, hint } = describe(error);
  const canRetry = onRetry && error?.status !== 403 && error?.status !== 404;
  return (
    <div className="card mx-auto my-10 max-w-lg text-center" role="alert">
      <h2 className="text-xl font-bold text-red-600">{title}</h2>
      <p className="mt-2 text-sm text-neutral-600">{hint}</p>
      <div className="mt-5 flex justify-center gap-3">
        {canRetry && <button className="btn-primary" onClick={onRetry}>Réessayer</button>}
        {backTo && <Link className="btn-outline" to={backTo.to}>{backTo.label}</Link>}
      </div>
    </div>
  );
}

export function EmptyState({ title = 'Aucune donnée', message, action }) {
  return (
    <div className="py-10 text-center">
      <p className="font-semibold">{title}</p>
      {message && <p className="mt-1 text-sm text-neutral-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Alert({ type = 'ok', children }) {
  const tone = type === 'ok' ? 'bg-green-100 text-green-800' : type === 'warn' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700';
  return <p role={type === 'error' ? 'alert' : 'status'} className={`rounded-2xl px-4 py-3 text-sm font-medium ${tone}`}>{children}</p>;
}
