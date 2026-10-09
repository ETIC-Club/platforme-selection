import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Icon from '../components/ui/Icon.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import { EmptyState, ErrorState, Loader } from '../components/ui/Feedback.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { api } from '../services/endpoints.js';
import { formatDateShort } from '../utils/format.js';

const PAGE_SIZE = 15;

function SortHeader({ label, field, sort, order, onSort }) {
  const active = sort === field;
  return (
    <th className="th">
      <button className="inline-flex items-center gap-1 uppercase" onClick={() => onSort(field)}>
        {label}
        {active && <Icon name={order === 'desc' ? 'arrow-down' : 'arrow-up'} className="h-3 w-3" />}
      </button>
    </th>
  );
}

export default function CandidatesPage() {
  const { event } = useOutletContext();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const get = (k) => params.get(k) || '';

  // Tous les filtres vivent dans l'URL : lien partageable, retour arrière conservé.
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
    search: get('search'), track: get('track'), status: get('status'), evaluation: get('evaluation'),
    assigned: get('assigned'), sort: get('sort'), order: get('order'), page: get('page') || 1, pageSize: PAGE_SIZE,
  };
  const { data, error, loading, reload } = useApi(
    () => api.candidates.list(event.id, query),
    [event.id, params.toString()],
    { keepPrevious: true },
  );

  const onSort = (field) => {
    if (get('sort') === field) update({ sort: field, order: get('order') === 'desc' ? 'asc' : 'desc' });
    else update({ sort: field, order: 'asc' });
  };
  const reset = () => { setText(''); setParams({}, { replace: true }); };
  const hasFilters = [...params.keys()].some((k) => k !== 'page');
  const base = `/events/${event.id}`;
  const sortProps = { sort: get('sort') || 'submittedAt', order: get('order') || 'asc', onSort };

  return (
    <>
      <PageHeader title="Candidatures" subtitle={data ? `${data.pagination.total} candidature(s)` : 'Liste des candidatures'} />

      <Card>
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input className="input lg:col-span-2" type="search" placeholder="Nom, référence, email…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Rechercher" />
          <select className="input" value={get('track')} onChange={(e) => update({ track: e.target.value })} aria-label="Filière">
            <option value="">Toutes les filières</option>
            {data?.filters.tracks.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="input" value={get('status')} onChange={(e) => update({ status: e.target.value })} aria-label="Statut final">
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="ACCEPTED">Acceptées</option>
            <option value="REJECTED">Refusées</option>
          </select>
          <select className="input" value={get('evaluation')} onChange={(e) => update({ evaluation: e.target.value })} aria-label="Évaluations">
            <option value="">Toutes les évaluations</option>
            <option value="COMPLETE">Complètement évaluées</option>
            <option value="INCOMPLETE">Évaluation incomplète</option>
          </select>
          <select className="input" value={get('assigned')} onChange={(e) => update({ assigned: e.target.value })} aria-label="Affectation">
            <option value="">Affectées ou non</option>
            <option value="true">Affectées</option>
            <option value="false">Non affectées</option>
          </select>
          {hasFilters && <button className="btn-outline" onClick={reset}>Réinitialiser</button>}
        </div>

        {loading && !data && <Loader />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && (
          data.items.length === 0 ? (
            <EmptyState title="Aucune candidature" message="Aucun résultat ne correspond à vos filtres." action={hasFilters && <button className="btn-outline" onClick={reset}>Réinitialiser les filtres</button>} />
          ) : (
            <div className={`overflow-x-auto transition ${loading ? 'opacity-60' : ''}`}>
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <SortHeader label="Candidat" field="name" {...sortProps} />
                    <SortHeader label="Filière" field="track" {...sortProps} />
                    <SortHeader label="Statut final" field="status" {...sortProps} />
                    <SortHeader label="Évaluations" field="progress" {...sortProps} />
                    <th className="th">Affectés</th>
                    <SortHeader label="Soumise le" field="submittedAt" {...sortProps} />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((c) => (
                    <tr key={c.id} onClick={() => navigate(`${base}/candidates/${c.id}`)} className="cursor-pointer border-b border-neutral-100 hover:bg-white/70">
                      <td className="td">
                        <Link to={`${base}/candidates/${c.id}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3">
                          <Avatar name={c.fullName} size="sm" />
                          <span><span className="block font-medium">{c.fullName}</span><span className="block text-xs text-neutral-500">{c.reference}</span></span>
                        </Link>
                      </td>
                      <td className="td text-neutral-600">{c.track}</td>
                      <td className="td"><StatusBadge status={c.status} /></td>
                      <td className="td">
                        <div className="flex w-36 items-center gap-2">
                          <ProgressBar value={c.evaluations.required ? (c.evaluations.completed * 100) / c.evaluations.required : 0} color={c.evaluations.fullyEvaluated ? 'green' : 'amber'} />
                          <span className="text-xs font-semibold">{c.evaluations.completed}/{c.evaluations.required}</span>
                        </div>
                      </td>
                      <td className="td">{c.assignedCount === 0 ? <span className="text-xs font-semibold text-red-600">Non affectée</span> : c.assignedCount}</td>
                      <td className="td text-neutral-500">{formatDateShort(c.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
        {data && <Pagination pagination={data.pagination} onPage={(p) => update({ page: String(p) })} />}
      </Card>
    </>
  );
}
