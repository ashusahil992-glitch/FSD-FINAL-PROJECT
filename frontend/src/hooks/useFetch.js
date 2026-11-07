import { useCallback, useEffect, useRef, useState } from 'react';

/** Runs an async function on mount and exposes { data, loading, error, reload }. */
export default function useFetch(fetcher) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const requestId = useRef(0);

  const load = useCallback(() => {
    const currentRequest = ++requestId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(fetcher)
      .then((data) => {
        if (currentRequest === requestId.current) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (currentRequest === requestId.current) {
          setState({ data: null, loading: false, error: err.userMessage || err.message });
        }
      });
  }, [fetcher]);

  useEffect(() => {
    load();
    return () => { requestId.current += 1; };
  }, [load]);

  return { ...state, reload: load };
}
