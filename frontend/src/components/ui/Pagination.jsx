import Icon from './Icon.jsx';

export default function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.totalPages <= 1) {
    return pagination ? <p className="mt-4 text-xs text-neutral-500">{pagination.total} résultat(s)</p> : null;
  }
  const { page, totalPages, total } = pagination;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-neutral-500">{total} résultats · page {page} / {totalPages}</p>
      <div className="flex gap-2">
        <button className="btn-outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <Icon name="chevron-left" className="h-4 w-4" /> Précédent
        </button>
        <button className="btn-outline" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Suivant <Icon name="chevron-right" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
