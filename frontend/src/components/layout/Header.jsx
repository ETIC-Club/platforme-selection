import Icon from '../ui/Icon.jsx';
import GlobalSearch from './GlobalSearch.jsx';
import NotificationsDropdown from './NotificationsDropdown.jsx';
import ProfileMenu from './ProfileMenu.jsx';

export default function Header({ event, onMenu }) {
  return (
    <header className="relative z-10 flex items-center gap-3 rounded-3xl bg-surface p-3 shadow-card">
      <button className="btn-icon lg:hidden" onClick={onMenu} aria-label="Ouvrir le menu"><Icon name="menu" /></button>
      <div className="min-w-0 flex-1">
        {event ? <GlobalSearch event={event} /> : <p className="px-3 text-sm font-semibold text-neutral-500">Plateforme de sélection ETIC</p>}
      </div>
      <NotificationsDropdown />
      <ProfileMenu />
    </header>
  );
}
