import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import Avatar from '../ui/Avatar.jsx';
import { TypeBadge } from '../ui/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { api } from '../../services/endpoints.js';

export default function GlobalSearch({ event }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ loading: false, error: null, data: null });
  const debounced = useDebounce(q.trim(), 300);
  const box = useRef(null);

  const candidatePath = (id) =>
    user.role === 'ADMIN' ? `/events/${event.id}/candidates/${id}` : `/events/${event.id}/my-candidates/${id}`;

  useEffect(() => {
    if (debounced.length < 2) { setState({ loading: false, error: null, data: null }); return undefined; }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    api.events.search(event.id, debounced)
      .then((data) => { if (!cancelled) setState({ loading: false, error: null, data }); })
      .catch((error) => { if (!cancelled) setState({ loading: false, error, data: null }); });
    return () => { cancelled = true; };
  }, [debounced, event.id]);

  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const go = (path) => { setOpen(false); setQ(''); navigate(path); };
  const { data } = state;
  const candidates = data?.candidates || [];
  const selectors = data?.selectors || [];

  const onKeyDown = (e) => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Enter') {
      if (candidates[0]) go(candidatePath(candidates[0].id));
      else if (selectors[0]) go(`/events/${event.id}/selectors/${selectors[0].id}`);
    }
  };

  return (
    <div ref={box} className="relative w-full">
      <label className="flex items-center gap-3 rounded-full bg-white px-4 py-2.5">
        <Icon name="search" className="h-5 w-5 shrink-0" />
        <input
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={user.role === 'ADMIN' ? 'Rechercher un candidat, un sélecteur…' : 'Rechercher parmi mes candidatures…'}
          className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
          aria-label="Recherche"
        />
      </label>

      {open && q.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-96 overflow-auto rounded-2xl bg-white p-2 shadow-xl">
          {q.trim().length < 2 && <p className="px-3 py-3 text-sm text-neutral-500">Saisissez au moins 2 caractères.</p>}
          {state.loading && <p className="px-3 py-3 text-sm text-neutral-500">Recherche…</p>}
          {state.error && <p className="px-3 py-3 text-sm text-red-600">{state.error.message}</p>}
          {data && !state.loading && !candidates.length && !selectors.length && (
            <p className="px-3 py-3 text-sm text-neutral-500">Aucun résultat pour « {data.query} ».</p>
          )}
          {candidates.length > 0 && <p className="px-3 pt-2 text-xs font-semibold uppercase text-neutral-400">Candidatures</p>}
          {candidates.map((c) => (
            <button key={`c${c.id}`} onClick={() => go(candidatePath(c.id))} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-surface">
              <Avatar name={c.fullName} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{c.fullName}</span>
                <span className="block truncate text-xs text-neutral-500">{c.track} · {c.reference}</span>
              </span>
            </button>
          ))}
          {selectors.length > 0 && <p className="px-3 pt-2 text-xs font-semibold uppercase text-neutral-400">Sélecteurs</p>}
          {selectors.map((s) => (
            <button key={`s${s.id}`} onClick={() => go(`/events/${event.id}/selectors/${s.id}`)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-surface">
              <Avatar name={s.name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{s.name}</span>
                <span className="block truncate text-xs text-neutral-500">{s.email}</span>
              </span>
              <TypeBadge type={s.type} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
