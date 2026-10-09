import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../ui/Avatar.jsx';
import Icon from '../ui/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div ref={box} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu du profil" className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 text-left">
        <Avatar name={user.name} src={user.avatarUrl} />
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-40 truncate text-sm font-semibold uppercase">{user.name}</span>
          <span className="block max-w-40 truncate text-xs text-neutral-500">{user.email}</span>
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-60 rounded-2xl bg-white p-2 shadow-xl">
          <div className="px-3 py-2 sm:hidden">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-neutral-500">{user.email}</p>
          </div>
          <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-surface">
            <Icon name="user" className="h-4 w-4" /> Mon profil
          </Link>
          <Link to="/events?list=1" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-surface">
            <Icon name="grid" className="h-4 w-4" /> Mes événements
          </Link>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-surface">
            <Icon name="logout" className="h-4 w-4" /> Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
