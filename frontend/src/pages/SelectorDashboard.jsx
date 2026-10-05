import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import Card from '../components/ui/Card.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import NextSteps from '../components/ui/NextSteps.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Icon from '../components/ui/Icon.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import { EmptyState, ErrorState, Loader } from '../components/ui/Feedback.jsx';
import { useApi } from '../hooks/useApi.js';
import { api } from '../services/endpoints.js';
import { formatDate, formatDateShort, plural } from '../utils/format.js';

export default function SelectorDashboard() {
  const { event } = useOutletContext();
  const navigate = useNavigate();
  const { data: d, error, loading, reload } = useApi(() => api.my.dashboard(event.id), [event.id]);

  if (loading && !d) return <Loader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const base = `/events/${event.id}`;
  const decisions = [
    ['Acceptées', d.decisions.accepted, 'green', 'text-green-600'],
    ['Refusées', d.decisions.rejected, 'red', 'text-red-600'],
    ['En attente', d.decisions.pending, 'amber', 'text-amber-600'],
  ];
  const maxDecision = Math.max(1, d.assigned);

  return (
    <>
      <PageHeader title={d.event.name} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="green" icon="users" label="Assignées" value={d.assigned} suffix="candidatures" />
        <StatCard tone="amber" icon="check-circle" label="Évaluées" value={d.evaluated} suffix={`sur ${d.assigned}`} />
        <StatCard tone="red" icon="clock" label="Restantes" value={d.remaining} suffix="à traiter" />
        <StatCard tone="teal" icon="trending-up" label="Progression" value={`${d.progress}%`} suffix="objectif 100%">
          <div className="mt-3"><ProgressBar value={d.progress} color="white" track="bg-white/30" /></div>
        </StatCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Mes décisions" icon="pie">
          <ul className="space-y-4">
            {decisions.map(([label, n, color, text]) => (
              <li key={label}>
                <div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className={`font-semibold ${text}`}>{n}</span></div>
                <ProgressBar value={(n * 100) / maxDecision} color={color} />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-neutral-500">Une candidature « en attente » reste à traiter tant qu'aucune décision n'est enregistrée.</p>
        </Card>
        <Card title="Prochaines étapes" icon="calendar">
          <NextSteps steps={d.nextSteps} />
        </Card>
      </div>

      <Card className="mt-6" title="Dernières candidatures évaluées" icon="user-check" action={<Link className="btn-outline" to={`${base}/my-candidates`}>Voir mes candidatures</Link>}>
        {!d.latestEvaluated.length ? (
          <EmptyState title="Aucune évaluation pour l'instant" message="Vos évaluations apparaîtront ici." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead><tr className="border-b border-neutral-200"><th className="th">Candidat</th><th className="th">Filière</th><th className="th">Date</th><th className="th text-right">Décision</th></tr></thead>
              <tbody>
                {d.latestEvaluated.map((c) => (
                  <tr key={c.candidateId} onClick={() => navigate(`${base}/my-candidates/${c.candidateId}`)} className="cursor-pointer hover:bg-white/70">
                    <td className="td">
                      <Link to={`${base}/my-candidates/${c.candidateId}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3">
                        <Avatar name={c.fullName} />
                        <span><span className="block font-medium">{c.fullName}</span><span className="block text-xs text-neutral-500">Dossier {c.reference}</span></span>
                      </Link>
                    </td>
                    <td className="td text-neutral-600">{c.track}</td>
                    <td className="td text-neutral-500">{formatDateShort(c.evaluatedAt)}</td>
                    <td className="td text-right"><StatusBadge status={c.decision} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-light px-4 py-3">
          <p className="flex items-center gap-2 text-sm">
            <Icon name="clock" className="h-4 w-4 text-brand" />
            {d.remaining > 0
              ? `${d.remaining} ${plural(d.remaining, 'candidature reste', 'candidatures restent')} à évaluer${d.event.closesOn ? ` avant le ${formatDate(d.event.closesOn)}` : ''}.`
              : 'Toutes vos candidatures sont évaluées. Merci !'}
          </p>
          {d.nextCandidateId && (
            <Link className="btn-primary" to={`${base}/my-candidates/${d.nextCandidateId}`}>Reprendre l'évaluation</Link>
          )}
        </div>
      </Card>
    </>
  );
}
