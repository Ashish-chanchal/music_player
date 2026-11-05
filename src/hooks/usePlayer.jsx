import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useToast } from './useToast';

// Two contexts on purpose: playback state changes rarely, while progress changes several times a second.
// Splitting them keeps long lists of tracks from re-rendering on every timeupdate.
const PlayerContext = createContext(null);
const ProgressContext = createContext({ time: 0, duration: 0 });

export function PlayerProvider({ children }) {
  const toast = useToast();
  const audioRef = useRef(null);
  if (audioRef.current === null) {
    audioRef.current = new Audio();
    audioRef.current.preload = 'metadata';
  }
  const audio = audioRef.current;

  const [current, setCurrent] = useState(null);
  const [queue, setQueue] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [progress, setProgress] = useState({ time: 0, duration: 0 });

  // Latest values for event handlers, which outlive any single render.
  const live = useRef({ current, queue, shuffle, repeat });
  useLayoutEffect(() => { live.current = { current, queue, shuffle, repeat }; });
  const lastVolume = useRef(0.8);
  const failures = useRef(0);

  const load = useCallback((track) => {
    live.current.current = track;
    setCurrent(track);
    setProgress({ time: 0, duration: track.duration || 0 });
    audio.src = track.url;
    audio.play().catch((err) => {
      if (err.name === 'AbortError') return; // superseded by a newer load
      if (err.name !== 'NotAllowedError') toast('This track can’t be played right now.');
    });
  }, [audio, toast]);

  const play = useCallback((track, newQueue) => {
    if (newQueue) {
      live.current.queue = newQueue;
      setQueue(newQueue);
    }
    load(track);
  }, [load]);

  const step = useCallback((dir, auto = false) => {
    const { queue: q, current: cur, shuffle: sh, repeat: rep } = live.current;
    if (!q.length) return;
    const i = cur ? q.findIndex((t) => t.key === cur.key) : -1;
    let next;
    if (sh && q.length > 1) {
      do { next = Math.floor(Math.random() * q.length); } while (next === i);
    } else {
      next = i === -1 ? 0 : i + dir;
      if (next >= q.length) {
        if (auto && !rep) return; // reached the end of the queue
        next = 0;
      }
      if (next < 0) next = q.length - 1;
    }
    load(q[next]);
  }, [load]);

  const toggle = useCallback(() => {
    if (!live.current.current) return false; // nothing loaded; the caller decides what to start
    if (audio.paused) audio.play().catch(() => {}); else audio.pause();
    return true;
  }, [audio]);

  const prev = useCallback(() => {
    if (audio.currentTime > 3) audio.currentTime = 0; else step(-1);
  }, [audio, step]);

  const next = useCallback(() => step(1), [step]);

  /** Row/card click: pause or resume if it's the current track, otherwise start it with the given queue. */
  const playOrToggle = useCallback((track, newQueue) => {
    if (live.current.current?.key === track.key) toggle(); else play(track, newQueue);
  }, [play, toggle]);

  const seekToFraction = useCallback((f) => {
    if (Number.isFinite(audio.duration)) audio.currentTime = f * audio.duration;
  }, [audio]);

  const skipBy = useCallback((seconds) => {
    if (!Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.min(audio.duration, Math.max(0, audio.currentTime + seconds));
  }, [audio]);

  const setVolume = useCallback((v) => {
    if (v > 0) lastVolume.current = v;
    setVolumeState(v);
  }, []);
  const toggleMute = useCallback(() => {
    setVolumeState((v) => (v > 0 ? 0 : lastVolume.current));
  }, []);
  useEffect(() => { audio.volume = volume; }, [audio, volume]);

  // Wire the <audio> element to React state.
  useEffect(() => {
    const on = (type, fn) => { audio.addEventListener(type, fn); return () => audio.removeEventListener(type, fn); };
    const offs = [
      on('play', () => setIsPlaying(true)),
      on('pause', () => setIsPlaying(false)),
      on('playing', () => { failures.current = 0; }),
      on('loadedmetadata', () => {
        if (Number.isFinite(audio.duration)) setProgress((p) => ({ ...p, duration: audio.duration }));
      }),
      on('timeupdate', () => {
        if (Number.isFinite(audio.duration)) setProgress({ time: audio.currentTime, duration: audio.duration });
      }),
      on('ended', () => {
        const { queue: q, repeat: rep } = live.current;
        if (rep && q.length <= 1) { audio.currentTime = 0; audio.play().catch(() => {}); return; }
        step(1, true);
      }),
      on('error', () => {
        if (!audio.getAttribute('src')) return;
        setIsPlaying(false);
        failures.current += 1;
        if (failures.current >= Math.max(1, live.current.queue.length)) { // everything failed – stop skipping
          toast('Couldn’t play these tracks. Check your connection.');
          return;
        }
        toast('Couldn’t load this track. Skipping to the next one…');
        setTimeout(() => step(1, true), 1200);
      }),
    ];
    return () => offs.forEach((off) => off());
  }, [audio, step, toast]);

  useEffect(() => () => { audio.pause(); audio.removeAttribute('src'); }, [audio]);

  // Document title + OS media controls
  useEffect(() => {
    document.title = current ? `${current.title} · ${current.artist} – VibePulse` : 'VibePulse – Music Player';
    if (!('mediaSession' in navigator) || !current) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title, artist: current.artist, album: current.album,
      artwork: [{ src: current.cover, sizes: '480x480' }],
    });
  }, [current]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return undefined;
    const ms = navigator.mediaSession;
    ms.setActionHandler('play', () => audio.play().catch(() => {}));
    ms.setActionHandler('pause', () => audio.pause());
    ms.setActionHandler('previoustrack', prev);
    ms.setActionHandler('nexttrack', next);
    return () => ['play', 'pause', 'previoustrack', 'nexttrack'].forEach((a) => ms.setActionHandler(a, null));
  }, [audio, prev, next]);

  const value = useMemo(() => ({
    current, queue, isPlaying, shuffle, repeat, volume,
    play, playOrToggle, toggle, prev, next, seekToFraction, skipBy, setVolume, toggleMute,
    toggleShuffle: () => setShuffle((s) => !s),
    toggleRepeat: () => setRepeat((r) => !r),
    setShuffle,
  }), [current, queue, isPlaying, shuffle, repeat, volume, play, playOrToggle, toggle, prev, next, seekToFraction, skipBy, setVolume, toggleMute]);

  return (
    <PlayerContext.Provider value={value}>
      <ProgressContext.Provider value={progress}>{children}</ProgressContext.Provider>
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
export const useProgress = () => useContext(ProgressContext);
