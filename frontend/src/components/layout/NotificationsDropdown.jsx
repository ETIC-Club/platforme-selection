import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { api } from '../../services/endpoints.js';
import { timeAgo } from '../../utils/format.js';

export default function NotificationsDropdown() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ items: [], unreadCount: 0 });
  const [error, setError] = useState(null);
  const box = useRef(null);

  const load = useCallback(() => {
    api.notifications.list({ limit: 15 })
      .then((d) => { setData(d); setError(null); })
      .catch((e) => setError(e));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const toggle = () => { if (!open) load(); setOpen((o) => !o); };

  const openItem = async (n) => {
    setOpen(false);
    if (!n.isRead) {
      setData((d) => ({ unreadCount: Math.max(0, d.unreadCount - 1), items: d.items.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)) }));
      api.notifications.markRead(n.id).catch(() => load());
    }
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    try { await api.notifications.markAllRead(); load(); } catch (e) { setError(e); }
  };

  return (
    <div ref={box} className="relative">
      <button className="btn-icon relative h-11 w-11" onClick={toggle} aria-label="Notifications" aria-expanded={open}>
        <Icon name="bell" />
        {data.unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {data.unreadCount > 9 ? '9+' : data.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white p-2 shadow-xl">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="font-bold">Notifications</p>
            {data.unreadCount > 0 && <button onClick={markAll} className="text-xs font-semibold text-brand hover:underline">Tout marquer comme lu</button>}
          </div>
          {error && <p className="px-3 py-2 text-sm text-red-600">{error.message}</p>}
          {!error && !data.items.length && <p className="px-3 py-6 text-center text-sm text-neutral-500">Aucune notification.</p>}
          <ul className="max-h-96 overflow-auto">
            {data.items.map((n) => (
              <li key={n.id}>
                <button onClick={() => openItem(n)} className={`flex w-full gap-3 rounded-xl px-3 py-3 text-left hover:bg-surface ${n.isRead ? '' : 'bg-brand-light/50'}`}>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-transparent' : 'bg-brand'}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{n.title}</span>
                    <span className="block text-xs text-neutral-600">{n.message}</span>
                    <span className="mt-1 block text-[11px] text-neutral-400">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
