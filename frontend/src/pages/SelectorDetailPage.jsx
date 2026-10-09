import { useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import Card from '../components/ui/Card.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { EvalStatusBadge, StatusBadge, TypeBadge, Badge } from '../components/ui/Badge.jsx';
import { Alert, EmptyState, ErrorState, Loader } from '../components/ui/Feedback.jsx';
import { useApi } from '../hooks/useApi.js';
import { api } from '../services/endpoints.js';
import { formatDateShort } from '../utils/format.js';

export default function SelectorDetailPage() {
  const { event } = useOutletContext();
  const { selectorId } = useParams();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useApi(() => api.selectors.get(event.id, selectorId), [event.id, selectorId]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const back = { to: `/events/${event.id}/selectors`, label: 'Sélecteurs' };
  if (loading && !data) return <Loader />;
  if (error) return <ErrorState error={error} onRetry={reload} backTo={{ to: back.to, label: 'Retour aux sélecteurs' }} />;

  const { selector: s, candidates } = data;
  const base = `/events/${event.id}`;

  const toggle = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await api.selectors.setActive(event.id, s.id, !s.isActive);
      setMsg({ type: 'ok', text: s.isActive ? 'Sélecteur désactivé.' : 'Sélecteur activé.' });
      reload();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        back={back}
        title={s.name}
        subtitle={s.email}
        actions={
          <>
            <TypeBadge type={s.type} />
            {!s.isActive && <Badge tone="red">Désactivé</Badge>}
            <button className={s.isActive ? 'btn-outline' : 'btn-primary'} disabled={busy} onClick={toggle}>{s.isActive ? 'Désactiver' : 'Activer'}</button>
          </>
        }
      />
      {msg && <div className="mb-5"><Alert type={msg.type}>{msg.text}</Alert></div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="green" icon="users" label="Assignées" value={s.assigned} />
        <StatCard tone="amber" icon="check-circle" label="Évaluées" value={s.evaluated} suffix={`sur ${s.assigned}`} />
        <StatCard tone="red" icon="clock" label="Restantes" value={s.remaining} />
        <StatCard tone="teal" icon="trending-up" label="Progression" value={`${s.progress}%`}>
          <div className="mt-3"><ProgressBar value={s.progress} color="white" track="bg-white/30" /></div>
        </StatCard>
      </div>

      <Card className="mt-6" title="Décisions du sélecteur" icon="pie">
        <div className="grid gap-4 sm:grid-cols-3">
          <div><p className="text-sm text-neutral-500">Acceptées</p><p className="text-2xl font-bold text-green-600">{s.decisions.accepted}</p></div>
          <div><p className="text-sm text-neutral-500">Refusées</p><p className="text-2xl font-bold text-red-600">{s.decisions.rejected}</p></div>
          <div><p className="text-sm text-neutral-500">En attente</p><p className="text-2xl font-bold text-amber-600">{s.decisions.pending}</p></div>
        </div>
      </Card>

      <Card className="mt-6" title="Candidatures affectées" icon="user-check">
        {!candidates.length ? <EmptyState title="Aucune candidature affectée" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead><tr className="border-b border-neutral-200"><th className="th">Candidat</th><th className="th">Filière</th><th className="th">Évaluation</th><th className="th">Décision</th><th className="th">Date</th></tr></thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.candidateId} onClick={() => navigate(`${base}/candidates/${c.candidateId}`)} className="cursor-pointer border-b border-neutral-100 hover:bg-white/70">
                    <td className="td">
                      <Link to={`${base}/candidates/${c.candidateId}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3">
                        <Avatar name={c.fullName} size="sm" />
                        <span><span className="block font-medium">{c.fullName}</span><span className="block text-xs text-neutral-500">{c.reference}</span></span>
                      </Link>
                    </td>
                    <td className="td text-neutral-600">{c.track}</td>
                    <td className="td"><EvalStatusBadge status={c.evaluationStatus} /></td>
                    <td className="td">{c.decision ? <StatusBadge status={c.decision} /> : '—'}</td>
                    <td className="td text-neutral-500">{formatDateShort(c.evaluatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
