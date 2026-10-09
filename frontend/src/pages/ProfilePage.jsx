import { useNavigate } from 'react-router-dom';
import Avatar from '../components/ui/Avatar.jsx';
import Card from '../components/ui/Card.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Badge, TypeBadge } from '../components/ui/Badge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_LABELS } from '../utils/format.js';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const rows = [
    ['Nom', user.name],
    ['Email', user.email],
    ['Rôle', ROLE_LABELS[user.role]],
    ...(user.role === 'SELECTOR' ? [['Type de sélecteur', <TypeBadge key="t" type={user.selectorType} />]] : []),
    ['Compte', <Badge key="a" tone={user.isActive ? 'green' : 'red'}>{user.isActive ? 'Actif' : 'Désactivé'}</Badge>],
  ];

  return (
    <>
      <PageHeader title="Mon profil" />
      <Card className="max-w-2xl">
        <div className="mb-6 flex items-center gap-4">
          <Avatar name={user.name} src={user.avatarUrl} size="lg" />
          <div>
            <p className="text-xl font-bold">{user.name}</p>
            <p className="text-sm text-neutral-500">{user.email}</p>
          </div>
        </div>
        <dl className="divide-y divide-neutral-200">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-neutral-500">{k}</dt>
              <dd className="text-sm font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <button className="btn-danger mt-6" onClick={() => { logout(); navigate('/login', { replace: true }); }}>Se déconnecter</button>
      </Card>
    </>
  );
}
