import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loader } from '../components/ui/Feedback.jsx';

/** Redirige vers /login si l'utilisateur n'est pas connecté. */
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader full label="Vérification de la session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  return <Outlet />;
}

/** Autorise uniquement certains rôles (le backend revérifie toujours). */
export function RequireRole({ roles }) {
  const { user } = useAuth();
  const context = useOutletContext();
  if (!roles.includes(user.role)) return <Navigate to="/403" replace />;
  return <Outlet context={context} />;
}
