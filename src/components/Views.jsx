import { GENRES, HOME_SHELVES } from '../constants';
import { useCatalogue } from '../hooks/useCatalogue';
import { Card, Feature } from './Cards';
import { Empty, Shelf, ShelfError, SkeletonCards, SkeletonRows } from './common';
import TrackList from './TrackList';

const offlineEmpty = (retry) => (
  <Empty icon="fa-wifi" title="Couldn’t reach the music catalogue" text="Check your connection and try again."
    action={{ label: 'Retry', onClick: retry }} />
);

function CatalogueShelf({ title, genre, library = false }) {
  const { status, tracks, retry } = useCatalogue({ genre, limit: 20 });
  return (
    <Shelf title={title}>
      {status === 'loading' && <SkeletonCards count={8} />}
      {status === 'error' && <ShelfError onRetry={retry} />}
      {status === 'ready' && tracks.map((t) => <Card key={t.key} track={t} queue={tracks} />)}
      {status === 'ready' && !tracks.length && <p style={{ padding: '8px 0', color: 'var(--text-3)' }}>Nothing here right now.</p>}
    </Shelf>
  );
}

export function Home({ library }) {
  const picks = useCatalogue({ genre: 'Trending', limit: 12 });
  const featured = picks.tracks.slice(0, 8);
  const libraryShelf = library.slice(0, 20);
  return (
    <>
      <Shelf title="Top Picks" className="features">
        {picks.status === 'loading' && <SkeletonCards count={3} />}
        {picks.status === 'error' && <ShelfError onRetry={picks.retry} />}
        {picks.status === 'ready' && featured.map((t, i) => (
          <Feature key={t.key} track={t} queue={picks.tracks} label={i === 0 ? 'Trending now' : 'Popular'} />
        ))}
      </Shelf>

      {libraryShelf.length > 0 && (
        <Shelf title="From Your Library">
          {libraryShelf.map((t) => <Card key={t.key} track={t} queue={libraryShelf} />)}
        </Shelf>
      )}

      {HOME_SHELVES.map(([title, genre]) => <CatalogueShelf key={genre} title={title} genre={genre} />)}
    </>
  );
}

export function Browse({ onPickGenre }) {
  return (
    <section className="section">
      <div className="section-head"><h2>Genres</h2></div>
      <div className="tiles">
        {GENRES.map(([genre, colours]) => {
          const [a, b] = colours.split(',');
          return (
            <button key={genre} className="tile" style={{ background: `linear-gradient(135deg,${a},${b})` }} onClick={() => onPickGenre(genre)}>
              <span>{genre}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function GenreView({ genre, onBrowse }) {
  const { status, tracks, retry } = useCatalogue({ genre, limit: 40 });
  if (status === 'loading') return <SkeletonRows count={8} />;
  if (status === 'error') return offlineEmpty(retry);
  if (!tracks.length) {
    return <Empty icon="fa-compact-disc" title="No tracks found" text="Try another genre." action={{ label: 'Back to Browse', onClick: onBrowse }} />;
  }
  return <TrackList tracks={tracks} />;
}

/** The Songs and Liked Songs lists. */
export function LocalList({ tracks, emptyState }) {
  if (!tracks.length) return <Empty {...emptyState} />;
  return <TrackList tracks={tracks} />;
}

/** Search: filters the local library and, outside Songs / Liked, also queries the open catalogue. */
export function SearchResults({ query, scope, library, favs }) {
  const q = query.toLowerCase();
  const matches = (t) => `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(q);
  const local = (scope === 'favorites' ? favs : library).filter(matches);
  const remote = scope === 'favorites' || scope === 'library';
  const { status, tracks, retry } = useCatalogue({ query, limit: 30, enabled: !remote });

  if (remote) {
    return local.length
      ? <TrackList tracks={local} />
      : <Empty icon="fa-magnifying-glass" title="No matches" text="Nothing in this list matches your search." />;
  }
  if (status === 'loading') return <SkeletonRows count={6} />;
  if (status === 'error') return local.length ? <TrackList tracks={local} /> : offlineEmpty(retry);
  const all = [...local, ...tracks];
  return all.length
    ? <TrackList tracks={all} />
    : <Empty icon="fa-magnifying-glass" title="No matches" text="Try a different search." />;
}
