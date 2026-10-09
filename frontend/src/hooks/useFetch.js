import { useCallback, useEffect, useState } from 'react';

/** Runs an async function on mount and exposes { data, loading, error, reload }. */
export default function useFetch(fetcher) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) => setState({ data: null, loading: false, error: err.userMessage || err.message }));
  }, [fetcher]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
