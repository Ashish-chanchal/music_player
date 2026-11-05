import { usePlayer } from '../hooks/usePlayer';
import { Cover } from './common';

function Art({ track, active, playing }) {
  return (
    <div className="card-art">
      <Cover src={track.cover} loading="lazy" />
      <button className="card-play" tabIndex={-1} aria-label={`${active && playing ? 'Pause' : 'Play'} ${track.title}`}>
        <i className={`fa-solid ${active && playing ? 'fa-pause' : 'fa-play'}`} />
      </button>
    </div>
  );
}

/** Square artwork card. `queue` is the list the track belongs to; it becomes the play queue. */
export function Card({ track, queue }) {
  const { current, isPlaying, playOrToggle } = usePlayer();
  const active = current?.key === track.key;
  return (
    <div className={`card${active ? ' playing' : ''}`} onClick={() => playOrToggle(track, queue)}>
      <Art track={track} active={active} playing={isPlaying} />
      <div className="card-title">{track.title}</div>
      <div className="card-sub">{track.artist}</div>
    </div>
  );
}

/** Large "Top Picks" card with the heading above the artwork. */
export function Feature({ track, queue, label }) {
  const { current, isPlaying, playOrToggle } = usePlayer();
  const active = current?.key === track.key;
  return (
    <div className={`feature${active ? ' playing' : ''}`} onClick={() => playOrToggle(track, queue)}>
      <div className="eyebrow">{label}</div>
      <div className="f-title">{track.title}</div>
      <div className="f-sub">{track.artist}</div>
      <Art track={track} active={active} playing={isPlaying} />
    </div>
  );
}
