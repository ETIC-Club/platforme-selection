import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

export default function PageHeader({ title, subtitle, back, actions }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {back && (
          <Link to={back.to} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
            <Icon name="arrow-left" className="h-4 w-4" /> {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-bold uppercase tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
