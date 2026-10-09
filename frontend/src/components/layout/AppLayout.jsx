import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

/** Coque de l'application : sidebar + header + contenu. `event` est optionnel (pages hors événement). */
export default function AppLayout({ event = null, context }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <div className="min-h-screen bg-white p-3 lg:grid lg:grid-cols-[270px_1fr] lg:gap-6 lg:p-6">
      <Sidebar event={event} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="min-w-0">
        <Header event={event} onMenu={() => setMenuOpen(true)} />
        <main className="py-6">
          <Outlet context={context} />
        </main>
      </div>
    </div>
  );
}
