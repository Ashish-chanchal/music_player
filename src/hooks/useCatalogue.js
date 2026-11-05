import { useEffect, useState } from 'react';
import { fetchCatalogue } from '../lib/catalogue';

/**
 * Loads tracks from the open catalogue.
 * Returns { status: 'loading' | 'ready' | 'error', tracks, retry }.
 * Pass enabled=false to skip the request.
 */
export function useCatalogue({ genre = '', query = '', limit = 40, enabled = true }) {
  const [state, setState] = useState({ status: 'loading', tracks: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setState((s) => (s.status === 'loading' && s.tracks.length === 0 ? s : { status: 'loading', tracks: [] }));
    fetchCatalogue(genre, query, limit)
      .then((tracks) => { if (!cancelled) setState({ status: 'ready', tracks }); })
      .catch((err) => {
        if (cancelled) return;
        console.warn(err);
        setState({ status: 'error', tracks: [] });
      });
    return () => { cancelled = true; }; // a newer request supersedes this one
  }, [genre, query, limit, enabled, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
