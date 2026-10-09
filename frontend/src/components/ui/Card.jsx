import Icon from './Icon.jsx';

export default function Card({ title, icon, action, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {icon && (
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
                <Icon name={icon} />
              </span>
            )}
            <h2 className="text-lg font-bold">{title}</h2>
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
