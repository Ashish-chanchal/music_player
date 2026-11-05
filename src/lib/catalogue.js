import { config } from '../config';
import { genCover } from './format';

const AUDIUS_BASE = 'https://api.audius.co/v1';
const APP_NAME = encodeURIComponent(config.AUDIUS_APP_NAME || 'VibePulse');
const JAMENDO_ID = config.JAMENDO_CLIENT_ID || '';

function normalizeAudius(t) {
  const art = t.artwork || {};
  return {
    key: `audius:${t.id}`,
    source: 'audius',
    title: t.title,
    artist: t.user?.name || 'Unknown Artist',
    album: t.genre || 'Single',
    url: `${AUDIUS_BASE}/tracks/${t.id}/stream?app_name=${APP_NAME}`,
    cover: art['480x480'] || art['150x150'] || genCover(t.id),
    duration: t.duration,
  };
}

function normalizeJamendo(t) {
  return {
    key: `jamendo:${t.id}`,
    source: 'jamendo',
    title: t.name,
    artist: t.artist_name,
    album: t.album_name || 'Single',
    url: t.audio,
    cover: t.image || t.album_image || genCover(t.id),
    duration: Number(t.duration),
  };
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

async function request(genre, query, limit) {
  if (JAMENDO_ID) {
    const p = new URLSearchParams({
      client_id: JAMENDO_ID, format: 'json', limit: String(limit), audioformat: 'mp32', order: 'popularity_week',
    });
    if (query) p.set('search', query);
    else if (genre && genre !== 'Trending') p.set('tags', genre.split('/')[0].toLowerCase().replace(/[^a-z]/g, ''));
    const data = await fetchJson(`https://api.jamendo.com/v3.0/tracks/?${p}`);
    if (data.headers?.status === 'failed') throw new Error(data.headers.error_message || 'Jamendo error');
    return data.results.filter((t) => t.audio).map(normalizeJamendo);
  }
  const url = query
    ? `${AUDIUS_BASE}/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}&app_name=${APP_NAME}`
    : `${AUDIUS_BASE}/tracks/trending?limit=${limit}&app_name=${APP_NAME}` +
      (genre && genre !== 'Trending' ? `&genre=${encodeURIComponent(genre)}` : '');
  const data = await fetchJson(url);
  return (data.data || [])
    .filter((t) => t && !t.is_delete && !t.is_unlisted && t.is_streamable !== false && t.access?.stream !== false)
    .map(normalizeAudius);
}

// Successful responses are cached for the session; in-flight requests are shared so that
// two components asking for the same thing only hit the API once. Failures are not cached.
const cache = new Map();

export function fetchCatalogue(genre = '', query = '', limit = 40) {
  const key = `${genre}|${query}|${limit}`;
  if (!cache.has(key)) {
    const promise = request(genre, query, limit).catch((err) => {
      cache.delete(key);
      throw err;
    });
    cache.set(key, promise);
  }
  return cache.get(key);
}
