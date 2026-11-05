import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { FAV_KEY } from '../constants';

const FavoritesContext = createContext(null);

function load() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { return []; }
}

/** Liked songs, stored as full track objects so they work across local files and the open catalogue. */
export function FavoritesProvider({ children }) {
  const [favs, setFavs] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch { /* storage unavailable */ }
  }, [favs]);

  const isFav = useCallback((track) => !!track && favs.some((f) => f.key === track.key), [favs]);

  const toggleFav = useCallback((track) => {
    if (!track) return;
    setFavs((prev) => (prev.some((f) => f.key === track.key) ? prev.filter((f) => f.key !== track.key) : [track, ...prev]));
  }, []);

  const value = useMemo(() => ({ favs, isFav, toggleFav }), [favs, isFav, toggleFav]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);
