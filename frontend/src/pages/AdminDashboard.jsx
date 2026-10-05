import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import Card from '../components/ui/Card.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatCard, { MiniStat } from '../components/ui/StatCard.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import NextSteps from '../components/ui/NextSteps.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import { StatusBadge, TypeBadge } from '../components/ui/Badge.jsx';
import { EmptyState, ErrorState, Loader } from '../components/ui/Feedback.jsx';
import { useApi } from '../hooks/useApi.js';
import { api } from '../services/endpoints.js';
import { formatDateShort } from '../utils/format.js';

const TRACK_COLORS = ['brand', 'rose', 'green', 'red', 'amber'];

function CandidateRows({ items, base }) {
  const navigate = useNavigate();
  if (!items.length) return <EmptyState title="Aucune candidature" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px]">
        <thead>
          <tr className="border-b border-neutral-200"><th className="th">Nom</th><th className="th">Filière</th><th className="th">Statut</th><th className="th">Date</th></tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id} onClick={() => navigate(`${base}/candidates/${c.id}`)} className="cursor-pointer hover:bg-white/70">
              <td className="td">
                <Link to={`${base}/candidates/${c.id}`} className="flex items-center gap-3 font-medium" onClick={(e) => e.stopPropagation()}>
                  <Avatar name={c.fullName} size="sm" /> {c.fullName}
                </Link>
              </td>
              <td className="td text-neutral-600">{c.track}</td>
              <td className="td"><StatusBadge status={c.status} /></td>
              <td className="td text-neutral-500">{formatDateShort(c.submittedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDashboard() {
  const { event } = useOutletContext();
  const navigate = useNavigate();
  const { data: d, error, loading, reload } = useApi(() => api.events.dashboard(event.id), [event.id]);

  if (loading && !d) return <Loader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const base = `/events/${event.id}`;
  const rejectedPct = d.candidates.total ? Math.round((d.results.rejected * 100) / d.candidates.total) : 0;
  const limited = d.quota.total > 0 && d.quota.remaining <= Math.ceil(d.quota.total * 0.2);

  return (
    <>
      <PageHeader title={d.event.name} subtitle="Vue d'ensemble des candidatures" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="users" label="Affectées" value={d.candidates.assigned} footer={`sur ${d.candidates.total} candidatures`} />
        <StatCard icon="grid" label="Places restantes" value={d.quota.remaining} footer={limited ? 'Capacité limite' : `${d.quota.accepted} acceptées sur ${d.quota.total} places`} />
        <StatCard tone="red" icon="x-circle" label="Refusées" value={d.results.rejected} footer={`${rejectedPct}% des candidatures`} />
        <StatCard tone="teal" icon="clock" label="En attente" value={d.results.pending} footer="Décision finale à prendre" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="Total candidatures" value={d.candidates.total} />
        <MiniStat label="Complètement évaluées" value={d.candidates.fullyEvaluated} />
        <MiniStat label="Restantes à évaluer" value={d.candidates.remaining} />
        <MiniStat label="Acceptées" value={d.results.accepted} hint={`${d.quota.remaining} place(s) restante(s)`} />
      </div>

      <Card className="mt-6" title="Progression des évaluations" icon="trending-up">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-end">
          <div>
            <p className="text-sm text-neutral-500">Progression globale</p>
            <p className="text-4xl font-bold">{d.evaluations.progress}%</p>
            <div className="mt-2"><ProgressBar value={d.evaluations.progress} /></div>
            <p className="mt-1 text-xs text-neutral-500">{d.evaluations.completed} / {d.evaluations.required} évaluations</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Évaluations RH réalisées</p>
            <p className="text-2xl font-bold">{d.evaluations.rh.completed}<span className="text-sm font-medium text-neutral-400"> / {d.evaluations.rh.required}</span></p>
            <ProgressBar value={d.evaluations.rh.required ? (d.evaluations.rh.completed * 100) / d.evaluations.rh.required : 0} color="green" />
          </div>
          <div>
            <p className="text-sm text-neutral-500">Évaluations Technique réalisées</p>
            <p className="text-2xl font-bold">{d.evaluations.technical.completed}<span className="text-sm font-medium text-neutral-400"> / {d.evaluations.technical.required}</span></p>
            <ProgressBar value={d.evaluations.technical.required ? (d.evaluations.technical.completed * 100) / d.evaluations.technical.required : 0} color="amber" />
          </div>
          <div>
            <p className="text-sm text-neutral-500">Évaluations restantes</p>
            <p className="text-4xl font-bold text-red-600">{d.evaluations.remaining}</p>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card title="Filières" icon="check-circle" action={<span className="text-xs text-neutral-500">{d.evaluations.required} requises · {d.evaluations.remaining} restantes</span>}>
          {!d.tracks.length ? <EmptyState title="Aucune filière" /> : (
            <ul className="space-y-4">
              {d.tracks.map((t, i) => (
                <li key={t.name}>
                  <div className="mb-1 flex justify-between text-sm"><span>{t.name} <span className="text-xs text-neutral-400">({t.candidates} candidats)</span></span><span className="font-semibold text-brand-dark">{t.progress}%</span></div>
                  <ProgressBar value={t.progress} color={TRACK_COLORS[i % TRACK_COLORS.length]} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Répartition des sélecteurs" icon="bar-chart">
          <ul className="space-y-5">
            <li>
              <div className="mb-1 flex justify-between text-sm"><span>Technique <span className="text-xs text-neutral-400">({d.selectorsBreakdown.technical.count})</span></span><span className="font-semibold text-red-600">{d.selectorsBreakdown.technical.percent}%</span></div>
              <ProgressBar value={d.selectorsBreakdown.technical.percent} color="red" />
            </li>
            <li>
              <div className="mb-1 flex justify-between text-sm"><span>RH <span className="text-xs text-neutral-400">({d.selectorsBreakdown.rh.count})</span></span><span className="font-semibold text-green-600">{d.selectorsBreakdown.rh.percent}%</span></div>
              <ProgressBar value={d.selectorsBreakdown.rh.percent} color="green" />
            </li>
          </ul>
        </Card>
      </div>

      <Card className="mt-6" title="Progression des sélecteurs" icon="users" action={<Link className="btn-outline" to={`${base}/selectors`}>Gérer les sélecteurs</Link>}>
        {!d.selectors.length ? <EmptyState title="Aucun sélecteur" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="th">Sélecteur</th><th className="th">Type</th><th className="th">Assignées</th><th className="th">Évaluées</th><th className="th">Restantes</th><th className="th w-48">Progression</th>
                </tr>
              </thead>
              <tbody>
                {d.selectors.map((s) => (
                  <tr key={s.id} onClick={() => navigate(`${base}/selectors/${s.id}`)} className={`cursor-pointer hover:bg-white/70 ${s.isActive ? '' : 'opacity-50'}`}>
                    <td className="td"><Link to={`${base}/selectors/${s.id}`} className="flex items-center gap-3 font-medium" onClick={(e) => e.stopPropagation()}><Avatar name={s.name} size="sm" /> {s.name}</Link></td>
                    <td className="td"><TypeBadge type={s.type} /></td>
                    <td className="td">{s.assigned}</td>
                    <td className="td">{s.evaluated}</td>
                    <td className="td">{s.remaining}</td>
                    <td className="td"><div className="flex items-center gap-2"><ProgressBar value={s.progress} /><span className="w-10 text-xs font-semibold">{s.progress}%</span></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card title="Candidatures récentes" icon="user" action={<Link className="btn-outline" to={`${base}/candidates`}>Tout voir</Link>}>
            <CandidateRows items={d.recentCandidates} base={base} />
          </Card>
          <Card title="Candidatures en attente" icon="clock" action={<Link className="btn-outline" to={`${base}/candidates?status=PENDING`}>Voir tout</Link>}>
            <CandidateRows items={d.pendingCandidates} base={base} />
          </Card>
        </div>
        <Card title="Prochaines étapes" icon="calendar" className="self-start">
          <NextSteps steps={d.nextSteps} />
        </Card>
      </div>
    </>
  );
}
