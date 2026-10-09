import { Link, Navigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader.jsx';
import { ErrorState, EmptyState, Loader } from '../components/ui/Feedback.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { useApi } from '../hooks/useApi.js';
import { api } from '../services/endpoints.js';
import { formatDate } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function EventsPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const { data, error, loading, reload } = useApi(() => api.events.list(), []);

  if (loading && !data) return <Loader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  // Un seul événement : on va directement au dashboard adapté au rôle (sauf si l'utilisateur a demandé la liste).
  if (data.items.length === 1 && !params.get('list')) {
    return <Navigate to={`/events/${data.items[0].id}/dashboard`} replace />;
  }

  return (
    <>
      <PageHeader title="Événements" subtitle={user.role === 'ADMIN' ? 'Tous les événements' : 'Les événements auxquels vous participez'} />
      {!data.items.length ? (
        <div className="card">
          <EmptyState title="Aucun événement" message={user.role === 'ADMIN' ? "Aucun événement n'a encore été créé." : "Aucun événement ne vous est affecté pour l'instant."} />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.items.map((e) => (
            <Link key={e.id} to={`/events/${e.id}/dashboard`} className="card transition hover:ring-2 hover:ring-brand">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-bold uppercase">{e.name}</h2>
                <Badge tone={e.status === 'OPEN' ? 'green' : 'gray'}>{e.status === 'OPEN' ? 'Ouvert' : 'Clôturé'}</Badge>
              </div>
              {e.description && <p className="mt-2 text-sm text-neutral-600">{e.description}</p>}
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div><dt className="text-xs text-neutral-500">Clôture des dossiers</dt><dd className="font-semibold">{formatDate(e.closesOn)}</dd></div>
                <div><dt className="text-xs text-neutral-500">Places</dt><dd className="font-semibold">{e.quota}</dd></div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
