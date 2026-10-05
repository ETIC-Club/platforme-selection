import { Link } from 'react-router-dom';

function Screen({ title, message, inLayout }) {
  return (
    <div className={`flex items-center justify-center ${inLayout ? 'py-16' : 'min-h-screen bg-white p-6'}`}>
      <div className="card max-w-md text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-neutral-600">{message}</p>
        <Link to="/events?list=1" className="btn-primary mt-5">Retour à mes événements</Link>
      </div>
    </div>
  );
}

export const ForbiddenPage = () => (
  <Screen title="Accès refusé" message="Votre rôle ne permet pas d'accéder à cette page." />
);

export const NotFoundPage = ({ inLayout = false }) => (
  <Screen inLayout={inLayout} title="Page introuvable" message="L'adresse demandée n'existe pas." />
);
