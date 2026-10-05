import { NavLink, Link, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
        <rect x="8" y="12" width="46" height="46" rx="13" fill="#09a99d" />
        <circle cx="10" cy="8" r="5" fill="#f59e0b" />
        <circle cx="56" cy="14" r="3" fill="#facc15" />
        <text x="31" y="40" textAnchor="middle" fontFamily="Arial" fontWeight="700" fontSize="16" fill="#fff">ETIC</text>
      </svg>
      <span className="text-sm font-bold uppercase leading-tight">Platform<br />Selection</span>
    </div>
  );
}

function NavItem({ to, icon, children, onClick, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
          isActive ? 'bg-white font-bold text-ink shadow-sm' : 'font-semibold text-neutral-500 hover:bg-white/60'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute -left-5 top-1/2 hidden h-10 w-2 -translate-y-1/2 rounded-r-full bg-brand lg:block" />}
          <Icon name={icon} className={`h-5 w-5 ${isActive ? 'text-brand' : ''}`} />
          {children}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ event, open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const base = event ? `/events/${event.id}` : null;

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col rounded-r-3xl bg-surface p-5 shadow-card transition-transform lg:sticky lg:top-6 lg:z-auto lg:h-[calc(100vh-3rem)] lg:w-auto lg:translate-x-0 lg:rounded-3xl ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <Link to="/events" onClick={onClose}><Logo /></Link>
          <button className="btn-icon lg:hidden" onClick={onClose} aria-label="Fermer le menu"><Icon name="x" /></button>
        </div>

        <h2 className="mt-6 text-xl font-bold uppercase leading-tight">{event ? event.name : 'Mes événements'}</h2>

        <p className="mb-2 mt-8 text-xs font-semibold uppercase tracking-wider text-neutral-500">Menu</p>
        <nav className="space-y-1" aria-label="Navigation principale">
          {event && user?.role === 'ADMIN' && (
            <>
              <NavItem to={`${base}/dashboard`} icon="layout" onClick={onClose}>Dashboard</NavItem>
              <NavItem to={`${base}/selectors`} icon="users" onClick={onClose}>Sélecteurs</NavItem>
              <NavItem to={`${base}/candidates`} icon="user-check" onClick={onClose}>Candidatures</NavItem>
            </>
          )}
          {event && user?.role === 'SELECTOR' && (
            <>
              <NavItem to={`${base}/dashboard`} icon="layout" onClick={onClose}>Dashboard</NavItem>
              <NavItem to={`${base}/my-candidates`} icon="users" onClick={onClose}>Mes candidatures</NavItem>
            </>
          )}
          <NavItem to="/events?list=1" icon="grid" end onClick={onClose}>Événements</NavItem>
        </nav>

        <div className="mt-auto">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Extra</p>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold uppercase text-red-600 hover:bg-white/60">
            <Icon name="logout" className="h-5 w-5" /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
