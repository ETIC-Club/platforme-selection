import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { EvalStatusBadge, StatusBadge } from '../components/ui/Badge.jsx';
import { EmptyState, ErrorState, Loader } from '../components/ui/Feedback.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { api } from '../services/endpoints.js';
import { formatDateShort } from '../utils/format.js';

const PAGE_SIZE = 15;
const SORTS = [
  ['submittedAt:asc', 'Plus anciennes d\'abord'],
  ['submittedAt:desc', 'Plus récentes d\'abord'],
  ['name:asc', 'Nom A → Z'],
  ['name:desc', 'Nom Z → A'],
  ['evaluatedAt:desc', 'Dernières évaluées'],
];

export default function MyCandidatesPage() {
  const { event } = useOutletContext();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const get = (k) => params.get(k) || '';

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v === '' || v == null ? next.delete(k) : next.set(k, v)));
    if (!('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  };

  const [text, setText] = useState(get('search'));
  const debounced = useDebounce(text, 350);
  useEffect(() => {
    if (debounced.trim() !== get('search')) update({ search: debounced.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const query = {
    search: get('search'), track: get('track'), decision: get('decision'),
    sort: get('sort'), order: get('order'), page: get('page') || 1, pageSize: PAGE_SIZE,
  };
  const { data, error, loading, reload } = useApi(
    () => api.my.candidates(event.id, query),
    [event.id, params.toString()],
    { keepPrevious: true },
  );

  const hasFilters = [...params.keys()].some((k) => k !== 'page');
  const reset = () => { setText(''); setParams({}, { replace: true }); };
  const base = `/events/${event.id}`;
  const sortValue = `${get('sort') || 'submittedAt'}:${get('order') || 'asc'}`;

  return (
    <>
      <PageHeader title="Mes candidatures" subtitle={data ? `${data.pagination.total} candidature(s) affectée(s)` : undefined} />
      <Card>
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input className="input lg:col-span-2" type="search" placeholder="Nom ou référence…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Rechercher" />
          <select className="input" value={get('decision')} onChange={(e) => update({ decision: e.target.value })} aria-label="Décision">
            <option value="">Toutes</option>
            <option value="TODO">À traiter</option>
            <option value="NOT_STARTED">Non commencées</option>
            <option value="PENDING">En attente</option>
            <option value="ACCEPTED">Acceptées</option>
            <option value="REJECTED">Refusées</option>
          </select>
          <select className="input" value={get('track')} onChange={(e) => update({ track: e.target.value })} aria-label="Filière">
            <option value="">Toutes les filières</option>
            {data?.filters.tracks.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="input" value={sortValue} onChange={(e) => { const [sort, order] = e.target.value.split(':'); update({ sort, order }); }} aria-label="Tri">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        {hasFilters && <button className="btn-outline mb-4" onClick={reset}>Réinitialiser les filtres</button>}

        {loading && !data && <Loader />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && (data.items.length === 0 ? (
          <EmptyState title="Aucune candidature" message={hasFilters ? 'Aucun résultat ne correspond à vos filtres.' : "Aucune candidature ne vous est encore affectée."} />
        ) : (
          <div className={`overflow-x-auto transition ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[640px]">
              <thead><tr className="border-b border-neutral-200"><th className="th">Candidat</th><th className="th">Filière</th><th className="th">Mon évaluation</th><th className="th">Décision</th><th className="th">Évaluée le</th><th className="th" /></tr></thead>
              <tbody>
                {data.items.map((c) => (
                  <tr key={c.candidateId} onClick={() => navigate(`${base}/my-candidates/${c.candidateId}`)} className="cursor-pointer border-b border-neutral-100 hover:bg-white/70">
                    <td className="td">
                      <Link to={`${base}/my-candidates/${c.candidateId}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3">
                        <Avatar name={c.fullName} />
                        <span><span className="block font-medium">{c.fullName}</span><span className="block text-xs text-neutral-500">Dossier {c.reference}</span></span>
                      </Link>
                    </td>
                    <td className="td text-neutral-600">{c.track}</td>
                    <td className="td"><EvalStatusBadge status={c.evaluationStatus} /></td>
                    <td className="td">{c.decision ? <StatusBadge status={c.decision} /> : '—'}</td>
                    <td className="td text-neutral-500">{formatDateShort(c.evaluatedAt)}</td>
                    <td className="td text-right">
                      <Link to={`${base}/my-candidates/${c.candidateId}`} onClick={(e) => e.stopPropagation()} className="btn-outline">
                        {c.evaluationStatus === 'NOT_STARTED' ? 'Évaluer' : c.evaluationStatus === 'IN_PROGRESS' ? 'Continuer' : 'Modifier'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {data && <Pagination pagination={data.pagination} onPage={(p) => update({ page: String(p) })} />}
      </Card>
    </>
  );
}
