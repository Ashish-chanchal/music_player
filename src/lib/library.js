import { cleanAlbum, genCover } from './format';

const BASE = import.meta.env.BASE_URL; // './' – assets in /public are served relative to the page

function normalizeLocal(song, meta) {
  const name = song.name || song.title_song || song.title || 'Unknown Track';
  const m = meta[name] || {};
  return {
    key: `local:${name}`,
    source: 'local',
    title: song.title_song || name,
    artist: (song.artist_song || song.artist || 'Unknown Artist').replace(/[,\s]+$/, ''),
    album: cleanAlbum(m.album),
    url: `${BASE}music/${encodeURIComponent(name)}.mp3`,
    cover: m.cover ? `${BASE}covers/${encodeURIComponent(m.cover)}` : genCover(name),
    duration: null,
  };
}

/** Loads songsdata.json (+ optional covers/meta.json with album/cover info extracted from the MP3 tags). */
export async function loadLibrary() {
  let meta = {};
  try {
    const r = await fetch(`${BASE}covers/meta.json`);
    if (r.ok) meta = await r.json();
  } catch { /* optional */ }

  const res = await fetch(`${BASE}songsdata.json`);
  if (!res.ok) throw new Error(`songsdata.json: ${res.status}`);
  const data = await res.json();

  const seen = new Set();
  return data.map((s) => normalizeLocal(s, meta)).filter((t) => (seen.has(t.url) ? false : seen.add(t.url)));
}

/** Resolves the duration in seconds, or null if the file can't be loaded. */
export function probeDuration(url) {
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = 'metadata';
    const done = (value) => {
      a.removeAttribute('src');
      a.load();
      resolve(value);
    };
    a.onloadedmetadata = () => done(Number.isFinite(a.duration) ? a.duration : null);
    a.onerror = () => done(null);
    a.src = url;
  });
}
