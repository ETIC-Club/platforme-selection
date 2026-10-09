import { useAuth } from '../context/AuthContext.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import SelectorDashboard from './SelectorDashboard.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  return user.role === 'ADMIN' ? <AdminDashboard /> : <SelectorDashboard />;
}
