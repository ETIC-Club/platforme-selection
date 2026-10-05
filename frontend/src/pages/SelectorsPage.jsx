import { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import Card from '../components/ui/Card.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import Toggle from '../components/ui/Toggle.jsx';
import { MiniStat } from '../components/ui/StatCard.jsx';
import { TypeBadge } from '../components/ui/Badge.jsx';
import { Alert, EmptyState, ErrorState, Loader } from '../components/ui/Feedback.jsx';
import { useApi } from '../hooks/useApi.js';
import { api } from '../services/endpoints.js';

export default function SelectorsPage() {
  const { event } = useOutletContext();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useApi(() => api.selectors.list(event.id), [event.id]);
  const [busyId, setBusyId] = useState(null);
  const [autoBusy, setAutoBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  if (loading && !data) return <Loader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const base = `/events/${event.id}`;

  const toggle = async (s, isActive) => {
    setBusyId(s.id);
    setMsg(null);
    try {
      await api.selectors.setActive(event.id, s.id, isActive);
      setMsg({ type: 'ok', text: `${s.name} ${isActive ? 'activé' : 'désactivé'}.` });
      reload();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setBusyId(null);
    }
  };

  const autoAssign = async () => {
    if (!window.confirm("Compléter automatiquement les affectations manquantes (sélecteur le moins chargé) ?")) return;
    setAutoBusy(true);
    setMsg(null);
    try {
      const r = await api.events.autoAssign(event.id);
      setMsg({
        type: r.missing > 0 ? 'warn' : 'ok',
        text: r.created === 0 && r.missing === 0
          ? 'Toutes les candidatures sont déjà affectées comme requis.'
          : `${r.created} affectation(s) créée(s), ${r.selectorsNotified} sélecteur(s) notifié(s).${r.missing > 0 ? ` ${r.missing} place(s) d'évaluateur non pourvue(s) faute de sélecteurs.` : ''}`,
      });
      reload();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setAutoBusy(false);
    }
  };

  const { items, summary } = data;

  return (
    <>
      <PageHeader
        title="Sélecteurs"
        subtitle="Suivi des sélecteurs de l'événement"
        actions={<button className="btn-primary" onClick={autoAssign} disabled={autoBusy}>{autoBusy ? 'Affectation…' : 'Affecter automatiquement'}</button>}
      />
      {msg && <div className="mb-5"><Alert type={msg.type}>{msg.text}</Alert></div>}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="Sélecteurs" value={summary.total} />
        <MiniStat label="RH" value={summary.rh} />
        <MiniStat label="Technique" value={summary.technical} />
        <MiniStat label="Actifs" value={summary.active} />
      </div>

      <Card>
        {!items.length ? <EmptyState title="Aucun sélecteur" message="Aucun sélecteur n'est rattaché à cet événement." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="th">Sélecteur</th><th className="th">Type</th><th className="th">Assignées</th><th className="th">Évaluées</th><th className="th">Restantes</th><th className="th w-44">Progression</th><th className="th">Actif</th><th className="th" />
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id} onClick={() => navigate(`${base}/selectors/${s.id}`)} className={`cursor-pointer border-b border-neutral-100 hover:bg-white/70 ${s.isActive ? '' : 'opacity-60'}`}>
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} size="sm" />
                        <span><span className="block font-medium">{s.name}</span><span className="block text-xs text-neutral-500">{s.email}</span></span>
                      </div>
                    </td>
                    <td className="td"><TypeBadge type={s.type} /></td>
                    <td className="td">{s.assigned}</td>
                    <td className="td">{s.evaluated}</td>
                    <td className="td">{s.remaining}</td>
                    <td className="td"><div className="flex items-center gap-2"><ProgressBar value={s.progress} /><span className="w-10 text-xs font-semibold">{s.progress}%</span></div></td>
                    <td className="td" onClick={(e) => e.stopPropagation()}>
                      <Toggle checked={s.isActive} disabled={busyId === s.id} onChange={(v) => toggle(s, v)} label={`${s.isActive ? 'Désactiver' : 'Activer'} ${s.name}`} />
                    </td>
                    <td className="td text-right"><Link to={`${base}/selectors/${s.id}`} onClick={(e) => e.stopPropagation()} className="btn-outline">Voir</Link></td>
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
