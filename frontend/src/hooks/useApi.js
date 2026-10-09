import { useEffect, useRef, useState } from 'react';

/**
 * Charge des données via `fn()` à chaque changement de `deps`.
 * Retourne { data, error, loading, reload }.
 * - keepPrevious : garde les données précédentes pendant le rechargement (listes filtrées).
 * - reload() garde toujours les données affichées (pas de clignotement après une action).
 */
export function useApi(fn, deps = [], { keepPrevious = false } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  const lastTick = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const isReload = lastTick.current !== tick;
    lastTick.current = tick;
    setState((s) => ({ data: keepPrevious || isReload ? s.data : null, error: null, loading: true }));
    fn()
      .then((data) => { if (!cancelled) setState({ data, error: null, loading: false }); })
      .catch((error) => { if (!cancelled) setState({ data: null, error, loading: false }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}
