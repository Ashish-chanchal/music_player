import { useEffect, useState } from 'react';
import { loadLibrary, probeDuration } from '../lib/library';
import { useToast } from './useToast';

/**
 * Loads the local library, then probes each file in the background to fill in durations
 * and drop entries whose audio file is missing.
 */
export function useLibrary() {
  const toast = useToast();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let list;
      try {
        list = await loadLibrary();
      } catch (err) {
        console.warn('Could not load songsdata.json', err);
        if (!cancelled) {
          toast('Could not load your library. Open the app through a web server.');
          setLoading(false);
        }
        return;
      }
      if (cancelled) return;
      setTracks(list);
      setLoading(false);

      const durations = {};
      for (const t of list) {
        if (cancelled) return;
        durations[t.key] = await probeDuration(t.url);
        if (!cancelled) {
          setTracks((prev) => prev.map((p) => (p.key === t.key && durations[t.key] != null ? { ...p, duration: durations[t.key] } : p)));
        }
      }
      if (!cancelled) setTracks((prev) => prev.filter((p) => durations[p.key] != null));
    })();
    return () => { cancelled = true; };
  }, [toast]);

  return { tracks, loading };
}
