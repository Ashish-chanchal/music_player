import { useCallback, useEffect, useRef, useState } from 'react';
import { FavoritesProvider, useFavorites } from './hooks/useFavorites';
import { PlayerProvider, usePlayer } from './hooks/usePlayer';
import { ToastProvider } from './hooks/useToast';
import { useLibrary } from './hooks/useLibrary';
import { useDebounced } from './hooks/useDebounced';
import { useTheme } from './hooks/useTheme';
import { Sidebar, SearchBox, TabBar } from './components/Sidebar';
import PlayerBar from './components/PlayerBar';
import FullPlayer from './components/FullPlayer';
import { Browse, GenreView, Home, LocalList, SearchResults } from './components/Views';

const TITLES = { home: 'Listen Now', browse: 'Browse', library: 'Songs', favorites: 'Liked Songs' };

function Player() {
  const player = usePlayer();
  const { favs } = useFavorites();
  const { tracks: library } = useLibrary();
  const toggleTheme = useTheme();

  const [view, setView] = useState('home');
  const [genre, setGenre] = useState(null); // set while a Browse genre is open
  const [rawQuery, setRawQuery] = useState('');
  const [fullOpen, setFullOpen] = useState(false);
  const mainRef = useRef(null);

  const debounced = useDebounced(rawQuery, 300);
  const query = rawQuery.trim() ? debounced.trim() : '';

  const goTo = useCallback((v, g = null) => { setView(v); setGenre(g); setRawQuery(''); }, []);
  useEffect(() => { mainRef.current?.scrollTo({ top: 0 }); }, [view, genre, query]);

  // Play/pause; if nothing has been loaded yet, start the first song in the library.
  const { toggle, play } = player;
  const togglePlay = useCallback(() => {
    if (!toggle() && library.length) play(library[0], library);
  }, [toggle, play, library]);

  // Keyboard shortcuts
  const { skipBy, next, prev, toggleMute } = player;
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const tag = (t.tagName || '').toLowerCase();
      if ((tag === 'input' && t.type !== 'range') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === 'Escape' && fullOpen) { setFullOpen(false); return; }
      if (tag === 'button' && e.code === 'Space') return;
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlay(); break;
        case 'ArrowRight': if (e.shiftKey) next(); else if (tag !== 'input') skipBy(5); break;
        case 'ArrowLeft': if (e.shiftKey) prev(); else if (tag !== 'input') skipBy(-5); break;
        case 'KeyM': toggleMute(); break;
        case 'Slash': e.preventDefault(); document.querySelector('[data-search]')?.focus(); break;
        default:
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [fullOpen, togglePlay, next, prev, skipBy, toggleMute]);

  let title = TITLES[view];
  let body;
  if (query) {
    title = `Results for “${query}”`;
    body = <SearchResults query={query} scope={view} library={library} favs={favs} />;
  } else if (view === 'home') {
    body = <Home library={library} />;
  } else if (view === 'browse' && genre) {
    title = genre;
    body = <GenreView genre={genre} onBrowse={() => goTo('browse')} />;
  } else if (view === 'browse') {
    body = <Browse onPickGenre={(g) => goTo('browse', g)} />;
  } else if (view === 'library') {
    body = (
      <LocalList tracks={library} emptyState={{
        icon: 'fa-folder-open', title: 'Your library is empty', text: 'Add files to public/music, or explore the open catalogue.',
        action: { label: 'Browse music', onClick: () => goTo('browse') },
      }} />
    );
  } else {
    body = (
      <LocalList tracks={favs} emptyState={{
        icon: 'fa-heart', title: 'No liked songs yet', text: 'Tap the heart on any track to save it here.',
        action: { label: 'Browse music', onClick: () => goTo('browse') },
      }} />
    );
  }

  return (
    <>
      <div className="app">
        <Sidebar view={view} onView={goTo} query={rawQuery} onQuery={setRawQuery} favCount={favs.length} onToggleTheme={toggleTheme} />
        <PlayerBar onOpenFull={() => player.current && setFullOpen(true)} onTogglePlay={togglePlay} />
        <main className="main" ref={mainRef}>
          <h1 className="page-title">{title}</h1>
          <SearchBox className="mobile-search" value={rawQuery} onChange={setRawQuery} />
          <div className="content">{body}</div>
        </main>
        <TabBar view={view} onView={goTo} />
      </div>
      <FullPlayer open={fullOpen} onClose={() => setFullOpen(false)} onTogglePlay={togglePlay} />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <FavoritesProvider>
        <PlayerProvider>
          <Player />
        </PlayerProvider>
      </FavoritesProvider>
    </ToastProvider>
  );
}
