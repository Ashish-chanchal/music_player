import { useEffect, useRef } from 'react';
import { fmt, genCover } from '../lib/format';
import { usePlayer, useProgress } from '../hooks/usePlayer';
import { Cover } from './common';
import { LikeButton, SeekBar } from './PlayerBar';

const PLACEHOLDER = genCover('vibepulse');

function Times() {
  const { time, duration } = useProgress();
  return <div className="fp-times"><span>{fmt(time)}</span><span>{fmt(duration)}</span></div>;
}

/** Full-screen Now Playing overlay. Stays mounted so it can slide in and out. */
export default function FullPlayer({ open, onClose, onTogglePlay }) {
  const p = usePlayer();
  const { current } = p;
  const closeRef = useRef(null);

  useEffect(() => { if (open) closeRef.current?.focus(); }, [open]);

  const cover = current?.cover ?? PLACEHOLDER;
  return (
    <section className={`fp${open ? ' open' : ''}`} aria-label="Now playing" aria-hidden={!open} inert={!open}>
      <div className="fp-bg" style={{ backgroundImage: `url("${cover}")` }} />
      <button ref={closeRef} className="icon-btn fp-close" onClick={onClose} aria-label="Close now playing"><i className="fa-solid fa-chevron-down" /></button>
      <div className="fp-inner">
        <Cover className="fp-cover" src={cover} />
        <div className="fp-panel">
          <div className="fp-titles">
            <div className="fp-text">
              <h2>{current ? current.title : 'Not playing'}</h2>
              <p>{current ? (current.album && current.album !== 'Single' ? `${current.artist} — ${current.album}` : current.artist) : ''}</p>
            </div>
            <LikeButton track={current} />
          </div>
          <div className="fp-seek">
            <SeekBar />
            <Times />
          </div>
          <div className="fp-buttons buttons">
            <button className={`icon-btn${p.shuffle ? ' active' : ''}`} onClick={p.toggleShuffle} aria-label="Shuffle" aria-pressed={p.shuffle}><i className="fa-solid fa-shuffle" /></button>
            <button className="icon-btn lg" onClick={p.prev} aria-label="Previous"><i className="fa-solid fa-backward" /></button>
            <button className="play-btn lg" onClick={onTogglePlay} aria-label={p.isPlaying ? 'Pause' : 'Play'}><i className={`fa-solid ${p.isPlaying ? 'fa-pause' : 'fa-play'}`} /></button>
            <button className="icon-btn lg" onClick={p.next} aria-label="Next"><i className="fa-solid fa-forward" /></button>
            <button className={`icon-btn${p.repeat ? ' active' : ''}`} onClick={p.toggleRepeat} aria-label="Repeat" aria-pressed={p.repeat}><i className="fa-solid fa-repeat" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
