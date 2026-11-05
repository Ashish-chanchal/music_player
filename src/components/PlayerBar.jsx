import { useState } from 'react';
import { fmt, genCover } from '../lib/format';
import { usePlayer, useProgress } from '../hooks/usePlayer';
import { useFavorites } from '../hooks/useFavorites';
import { Cover, Slider } from './common';

const PLACEHOLDER = genCover('vibepulse');

/** Seek slider: follows playback, but while dragging shows the dragged position and commits on release. */
export function SeekBar({ className = '' }) {
  const { time, duration } = useProgress();
  const { seekToFraction } = usePlayer();
  const [drag, setDrag] = useState(null);
  const value = drag ?? (duration ? (time / duration) * 1000 : 0);
  const commit = () => {
    if (drag !== null) seekToFraction(drag / 1000);
    setDrag(null);
  };
  return (
    <Slider
      className={className}
      value={value}
      aria-label="Seek"
      onChange={(e) => setDrag(Number(e.target.value))}
      onPointerUp={commit}
      onKeyUp={commit}
      onBlur={commit}
    />
  );
}

export function LikeButton({ track, className = 'icon-btn like-btn' }) {
  const { isFav, toggleFav } = useFavorites();
  const liked = isFav(track);
  return (
    <button className={`${className}${liked ? ' on' : ''}`} aria-label={liked ? 'Unlike' : 'Like'} onClick={() => toggleFav(track)} disabled={!track}>
      <i className={`fa-${liked ? 'solid' : 'regular'} fa-heart`} />
    </button>
  );
}

function Time() {
  const { time, duration } = useProgress();
  return <span className="time hide-sm">{fmt(time)} / {fmt(duration)}</span>;
}

export default function PlayerBar({ onOpenFull, onTogglePlay }) {
  const p = usePlayer();
  const { current } = p;
  const subtitle = current
    ? (current.album && current.album !== 'Single' ? `${current.artist} — ${current.album}` : current.artist)
    : 'Choose a song to start';
  const volIcon = p.volume === 0 ? 'fa-volume-xmark' : p.volume < 0.5 ? 'fa-volume-low' : 'fa-volume-high';

  return (
    <header className="player" aria-label="Player">
      <div className="transport">
        <button className={`icon-btn hide-sm${p.shuffle ? ' active' : ''}`} onClick={p.toggleShuffle} aria-label="Shuffle" title="Shuffle" aria-pressed={p.shuffle}><i className="fa-solid fa-shuffle" /></button>
        <button className="icon-btn" onClick={p.prev} aria-label="Previous" title="Previous"><i className="fa-solid fa-backward" /></button>
        <button className="play-btn" onClick={onTogglePlay} aria-label={p.isPlaying ? 'Pause' : 'Play'} title="Play / Pause (Space)">
          <i className={`fa-solid ${p.isPlaying ? 'fa-pause' : 'fa-play'}`} />
        </button>
        <button className="icon-btn" onClick={p.next} aria-label="Next" title="Next"><i className="fa-solid fa-forward" /></button>
        <button className={`icon-btn hide-sm${p.repeat ? ' active' : ''}`} onClick={p.toggleRepeat} aria-label="Repeat" title="Repeat" aria-pressed={p.repeat}><i className="fa-solid fa-repeat" /></button>
      </div>

      <div className="capsule">
        <div className="np" role="button" tabIndex={0} aria-label="Open now playing" onClick={onOpenFull}
          onKeyDown={(e) => { if (e.key === 'Enter') onOpenFull(); }}>
          <Cover className="np-cover" src={current?.cover ?? PLACEHOLDER} />
          <div className="np-meta">
            <span className="np-title">{current ? current.title : 'Not playing'}</span>
            <span className="np-artist">{subtitle}</span>
          </div>
        </div>
        <Time />
        <LikeButton track={current} className="icon-btn like-btn hide-sm" />
        <SeekBar className="thin" />
      </div>

      <div className="right">
        <div className="volume hide-sm">
          <button className="icon-btn" onClick={p.toggleMute} aria-label="Mute"><i className={`fa-solid ${volIcon}`} /></button>
          <Slider min={0} max={100} value={p.volume * 100} aria-label="Volume" onChange={(e) => p.setVolume(Number(e.target.value) / 100)} />
        </div>
        <button className="icon-btn" onClick={onOpenFull} aria-label="Open now playing"><i className="fa-solid fa-up-right-and-down-left-from-center" /></button>
      </div>
    </header>
  );
}
