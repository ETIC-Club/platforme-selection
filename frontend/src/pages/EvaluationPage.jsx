import { useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import Card from '../components/ui/Card.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Badge, StatusBadge } from '../components/ui/Badge.jsx';
import { Alert, ErrorState, Loader } from '../components/ui/Feedback.jsx';
import { useApi } from '../hooks/useApi.js';
import { api } from '../services/endpoints.js';
import { FIELD_LABELS, formatDate, formatDateTime } from '../utils/format.js';

const OPTIONS = [
  { value: 'ACCEPTED', label: 'Acceptée', active: 'border-green-600 bg-green-50 text-green-700' },
  { value: 'REJECTED', label: 'Refusée', active: 'border-red-600 bg-red-50 text-red-700' },
  { value: 'PENDING', label: 'En attente', active: 'border-amber-500 bg-amber-50 text-amber-700' },
];

function FieldValue({ field, value }) {
  if (!value || (Array.isArray(value) && !value.length)) return <span className="text-neutral-400">Non renseigné</span>;
  if (field === 'skills') return <span className="flex flex-wrap gap-2">{value.map((s) => <Badge key={s} tone="brand">{s}</Badge>)}</span>;
  if (field === 'githubUrl' || field === 'portfolioUrl') return <a href={value} target="_blank" rel="noreferrer" className="break-all text-brand-dark underline">{value}</a>;
  return <span className="whitespace-pre-line">{value}</span>;
}

function EvaluationView({ data, event }) {
  const navigate = useNavigate();
  const { candidate: c, visibleFields, myEvaluation } = data;
  const [decision, setDecision] = useState(myEvaluation?.decision || null);
  const [comment, setComment] = useState(myEvaluation?.comment || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [result, setResult] = useState(null);

  const nav = result?.navigation || data.navigation;
  const base = `/events/${event.id}`;
  const locked = event.status !== 'OPEN';
  const lastSaved = result?.evaluation?.evaluatedAt || myEvaluation?.evaluatedAt;

  const save = async (thenNext) => {
    if (!decision) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await api.my.saveEvaluation(event.id, c.id, { decision, comment });
      setResult(res);
      if (thenNext) {
        const next = res.navigation.nextToEvaluateId;
        navigate(next ? `${base}/my-candidates/${next}` : `${base}/my-candidates`);
        return;
      }
      setMsg({ type: 'ok', text: 'Évaluation enregistrée.' });
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        back={{ to: `${base}/my-candidates`, label: 'Mes candidatures' }}
        title={c.fullName}
        subtitle={`Dossier ${c.reference} · ${c.track} · soumis le ${formatDate(c.submittedAt)}`}
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-outline" disabled={!nav.previousId} onClick={() => navigate(`${base}/my-candidates/${nav.previousId}`)}><Icon name="chevron-left" className="h-4 w-4" /> Précédente</button>
            <span className="text-sm text-neutral-500">{nav.position} / {nav.total}</span>
            <button className="btn-outline" disabled={!nav.nextId} onClick={() => navigate(`${base}/my-candidates/${nav.nextId}`)}>Suivante <Icon name="chevron-right" className="h-4 w-4" /></button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card title="Informations du dossier" icon="user">
          <dl className="space-y-5">
            {visibleFields.map((f) => (
              <div key={f}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{FIELD_LABELS[f]}</dt>
                <dd className="mt-1 text-sm"><FieldValue field={f} value={c[f]} /></dd>
              </div>
            ))}
          </dl>
        </Card>

        <div className="space-y-6 self-start">
          <Card title="Mon évaluation" icon="check-circle">
            {locked && <div className="mb-4"><Alert type="warn">Les évaluations de cet événement sont verrouillées.</Alert></div>}
            <fieldset disabled={locked || saving} className="space-y-4">
              <legend className="sr-only">Décision</legend>
              <div className="grid grid-cols-3 gap-2">
                {OPTIONS.map((o) => (
                  <label key={o.value} className={`cursor-pointer rounded-2xl border-2 px-2 py-3 text-center text-sm font-semibold transition ${decision === o.value ? o.active : 'border-transparent bg-white text-neutral-600 hover:border-neutral-300'}`}>
                    <input type="radio" name="decision" value={o.value} checked={decision === o.value} onChange={() => setDecision(o.value)} className="sr-only" />
                    {o.label}
                  </label>
                ))}
              </div>
              <div>
                <label htmlFor="comment" className="mb-1 block text-sm font-medium">Commentaire</label>
                <textarea id="comment" rows={5} maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Points forts, réserves, remarques…" className="w-full rounded-2xl border border-neutral-200 bg-white p-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
                <p className="mt-1 text-right text-xs text-neutral-400">{comment.length} / 2000</p>
              </div>
            </fieldset>

            {msg && <div className="mt-3"><Alert type={msg.type}>{msg.text}</Alert></div>}
            {!decision && !locked && <p className="mt-3 text-xs text-neutral-500">Choisissez une décision pour enregistrer.</p>}
            {decision === 'PENDING' && <p className="mt-3 text-xs text-amber-700">« En attente » ne compte pas comme évaluation réalisée : la candidature restera à traiter.</p>}

            <div className="mt-4 flex flex-col gap-2">
              <button className="btn-primary" disabled={!decision || saving || locked} onClick={() => save(true)}>{saving ? 'Enregistrement…' : 'Enregistrer et passer à la suivante'}</button>
              <button className="btn-outline" disabled={!decision || saving || locked} onClick={() => save(false)}><Icon name="save" className="h-4 w-4" /> Enregistrer</button>
            </div>
            {lastSaved && (
              <p className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
                Dernier enregistrement : {formatDateTime(lastSaved)} {(result?.evaluation?.decision || myEvaluation?.decision) && <StatusBadge status={result?.evaluation?.decision || myEvaluation.decision} />}
              </p>
            )}
          </Card>

          {result && (
            <Card title="Ma progression" icon="trending-up">
              <p className="text-2xl font-bold">{result.stats.evaluated}<span className="text-sm font-medium text-neutral-400"> / {result.stats.assigned} évaluées</span></p>
              <div className="my-2"><ProgressBar value={result.stats.progress} /></div>
              <p className="text-xs text-neutral-500">{result.stats.remaining} restante(s) · {result.stats.progress}%</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

export default function EvaluationPage() {
  const { event } = useOutletContext();
  const { candidateId } = useParams();
  const { data, error, loading, reload } = useApi(() => api.my.candidate(event.id, candidateId), [event.id, candidateId]);

  if (loading && !data) return <Loader />;
  if (error) return <ErrorState error={error} onRetry={reload} backTo={{ to: `/events/${event.id}/my-candidates`, label: 'Mes candidatures' }} />;
  // key : l'état du formulaire est réinitialisé quand on change de candidature
  return <EvaluationView key={candidateId} data={data} event={event} />;
}
