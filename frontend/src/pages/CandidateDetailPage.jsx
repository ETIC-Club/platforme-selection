import { useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import Card from '../components/ui/Card.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import { Badge, StatusBadge, TypeBadge } from '../components/ui/Badge.jsx';
import { Alert, EmptyState, ErrorState, Loader } from '../components/ui/Feedback.jsx';
import { useApi } from '../hooks/useApi.js';
import { api } from '../services/endpoints.js';
import { FIELD_LABELS, formatDate, formatDateTime } from '../utils/format.js';

const Field = ({ label, children }) => (
  <div>
    <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</dt>
    <dd className="mt-1 text-sm">{children || <span className="text-neutral-400">Non renseigné</span>}</dd>
  </div>
);

const Link = ({ href }) => (href ? <a href={href} target="_blank" rel="noreferrer" className="break-all text-brand-dark underline">{href}</a> : null);

export default function CandidateDetailPage() {
  const { event } = useOutletContext();
  const { candidateId } = useParams();
  const { data, error, loading, reload } = useApi(() => api.candidates.get(event.id, candidateId), [event.id, candidateId]);
  const { data: selectorsData } = useApi(() => api.selectors.list(event.id), [event.id]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [selectorId, setSelectorId] = useState('');

  if (loading && !data) return <Loader />;
  if (error) return <ErrorState error={error} onRetry={reload} backTo={{ to: `/events/${event.id}/candidates`, label: 'Retour aux candidatures' }} />;

  const { candidate: c, progress, assignments } = data;
  const assignedIds = new Set(assignments.map((a) => a.selectorId));
  const available = (selectorsData?.items || []).filter((s) => s.isActive && !assignedIds.has(s.id));

  const run = async (fn, okText) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ type: 'ok', text: okText });
      reload();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const setStatus = (status, label) => {
    if (!window.confirm(`Confirmer : ${label} la candidature de ${c.fullName} ?`)) return;
    run(() => api.candidates.setStatus(event.id, c.id, status), 'Décision finale enregistrée.');
  };
  const unassign = (a) => {
    if (!window.confirm(`Retirer ${a.name} de cette candidature ?`)) return;
    run(() => api.candidates.unassign(event.id, c.id, a.selectorId), 'Affectation retirée.');
  };
  const assign = () => {
    if (!selectorId) return;
    run(async () => { await api.candidates.assign(event.id, c.id, Number(selectorId)); setSelectorId(''); }, 'Sélecteur affecté (il a été notifié).');
  };

  return (
    <>
      <PageHeader back={{ to: `/events/${event.id}/candidates`, label: 'Candidatures' }} title={c.fullName} subtitle={`${c.reference} · ${c.track} · soumise le ${formatDate(c.submittedAt)}`} actions={<StatusBadge status={c.status} />} />
      {msg && <div className="mb-5"><Alert type={msg.type}>{msg.text}</Alert></div>}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card title="Informations du candidat" icon="user">
            <dl className="grid gap-5 sm:grid-cols-2">
              <Field label="Email">{c.email}</Field>
              <Field label="Téléphone">{c.phone}</Field>
              <Field label={FIELD_LABELS.school}>{c.school}</Field>
              <Field label={FIELD_LABELS.studyLevel}>{c.studyLevel}</Field>
              <Field label={FIELD_LABELS.githubUrl}><Link href={c.githubUrl} /></Field>
              <Field label={FIELD_LABELS.portfolioUrl}><Link href={c.portfolioUrl} /></Field>
              <div className="sm:col-span-2"><Field label={FIELD_LABELS.skills}>{c.skills?.length > 0 && <span className="flex flex-wrap gap-2">{c.skills.map((s) => <Badge key={s} tone="brand">{s}</Badge>)}</span>}</Field></div>
              <div className="sm:col-span-2"><Field label={FIELD_LABELS.motivation}>{c.motivation}</Field></div>
              <div className="sm:col-span-2"><Field label={FIELD_LABELS.experience}>{c.experience}</Field></div>
              <div className="sm:col-span-2"><Field label={FIELD_LABELS.technicalAnswer}>{c.technicalAnswer}</Field></div>
            </dl>
          </Card>

          <Card title="Évaluations et commentaires" icon="check-circle">
            {!assignments.length ? <EmptyState title="Aucun sélecteur affecté" message="Affectez un sélecteur RH et un sélecteur Technique." /> : (
              <ul className="divide-y divide-neutral-200">
                {assignments.map((a) => (
                  <li key={a.selectorId} className="flex flex-wrap items-start gap-3 py-4">
                    <Avatar name={a.name} />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-semibold">{a.name} <TypeBadge type={a.type} /></p>
                      {a.evaluation ? (
                        <>
                          <p className="mt-1 text-sm text-neutral-700">{a.evaluation.comment || <span className="text-neutral-400">Aucun commentaire</span>}</p>
                          <p className="mt-1 text-xs text-neutral-500">Évalué le {formatDateTime(a.evaluation.evaluatedAt)}</p>
                        </>
                      ) : <p className="mt-1 text-sm text-neutral-500">Pas encore d'évaluation. Affecté le {formatDate(a.assignedAt)}.</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      {a.evaluation ? <StatusBadge status={a.evaluation.decision} /> : <Badge>Non commencée</Badge>}
                      {!a.evaluation && <button className="btn-outline" disabled={busy} onClick={() => unassign(a)}>Retirer</button>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3">
              <select className="input min-w-52 flex-1" value={selectorId} onChange={(e) => setSelectorId(e.target.value)} aria-label="Sélecteur à affecter">
                <option value="">{available.length ? 'Choisir un sélecteur…' : 'Aucun sélecteur disponible'}</option>
                {available.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.type === 'RH' ? 'RH' : 'Technique'})</option>)}
              </select>
              <button className="btn-primary" disabled={busy || !selectorId} onClick={assign}>Affecter</button>
            </div>
          </Card>
        </div>

        <div className="space-y-6 self-start">
          <Card title="Progression" icon="trending-up">
            <p className="text-3xl font-bold">{progress.completed}<span className="text-base font-medium text-neutral-400"> / {progress.required}</span></p>
            <div className="my-3"><ProgressBar value={progress.required ? (progress.completed * 100) / progress.required : 0} color={progress.fullyEvaluated ? 'green' : 'amber'} /></div>
            <ul className="space-y-1 text-sm">
              <li className="flex justify-between"><span>Évaluations RH</span><span className="font-semibold">{progress.rh.completed} / {progress.rh.required}</span></li>
              <li className="flex justify-between"><span>Évaluations Technique</span><span className="font-semibold">{progress.technical.completed} / {progress.technical.required}</span></li>
            </ul>
            <p className="mt-3 text-xs text-neutral-500">{progress.fullyEvaluated ? 'Candidature complètement évaluée.' : 'Évaluation incomplète : les décisions « en attente » ne comptent pas.'}</p>
          </Card>

          <Card title="Décision finale" icon="check-circle">
            <p className="mb-1"><StatusBadge status={c.status} /></p>
            {c.decidedAt && <p className="text-xs text-neutral-500">Fixée le {formatDateTime(c.decidedAt)} par {c.decidedByName || '—'}</p>}
            <p className="mb-4 mt-2 text-xs text-neutral-500">La décision est prise manuellement par l'Admin, jamais calculée automatiquement.</p>
            <div className="flex flex-col gap-2">
              <button className="btn-success" disabled={busy || c.status === 'ACCEPTED'} onClick={() => setStatus('ACCEPTED', 'accepter')}>Accepter</button>
              <button className="btn-danger" disabled={busy || c.status === 'REJECTED'} onClick={() => setStatus('REJECTED', 'refuser')}>Refuser</button>
              <button className="btn-warning" disabled={busy || c.status === 'PENDING'} onClick={() => setStatus('PENDING', 'remettre en attente')}>Remettre en attente</button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
