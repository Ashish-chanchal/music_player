import { memo } from 'react';
import { fmt } from '../lib/format';
import { usePlayer } from '../hooks/usePlayer';
import { useFavorites } from '../hooks/useFavorites';
import { Cover } from './common';

const TrackRow = memo(function TrackRow({ track, index, active, playing, liked, onPlay, onLike }) {
  const cls = `track${active ? ' playing' : ''}${active && playing ? ' is-playing' : ''}`;
  return (
    <li
      className={cls}
      tabIndex={0}
      onClick={() => onPlay(track)}
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) onPlay(track); }}
    >
      <span className="c-num">
        <span className="num-idx">{index + 1}</span>
        <span className="num-play"><i className={`fa-solid ${active && playing ? 'fa-pause' : 'fa-play'}`} /></span>
        <span className="num-eq"><span className="eq"><span /><span /><span /></span></span>
      </span>
      <div className="c-title">
        <Cover src={track.cover} loading="lazy" />
        <div className="t-text">
          <span className="t-name">{track.title}</span>
          <span className="t-artist">{track.artist}</span>
        </div>
      </div>
      <span className="c-album">{track.album}</span>
      <button
        className={`like${liked ? ' on' : ''}`}
        aria-label={liked ? 'Unlike' : 'Like'}
        onClick={(e) => { e.stopPropagation(); onLike(track); }}
      >
        <i className={`fa-${liked ? 'solid' : 'regular'} fa-heart`} />
      </button>
      <span className="c-time">{track.duration != null ? fmt(track.duration) : '–:––'}</span>
    </li>
  );
});

/** Song table. Playing a row uses the whole list as the play queue. */
export default function TrackList({ tracks }) {
  const { current, isPlaying, playOrToggle } = usePlayer();
  const { isFav, toggleFav } = useFavorites();
  return (
    <>
      <div className="table-head" aria-hidden="true">
        <span className="c-num">#</span><span className="c-title">Title</span><span className="c-album">Album</span>
        <span /><span className="c-time"><i className="fa-regular fa-clock" /></span>
      </div>
      <ol className="track-list">
        {tracks.map((t, i) => (
          <TrackRow
            key={t.key}
            track={t}
            index={i}
            active={current?.key === t.key}
            playing={isPlaying}
            liked={isFav(t)}
            onPlay={(track) => playOrToggle(track, tracks)}
            onLike={toggleFav}
          />
        ))}
      </ol>
    </>
  );
}
