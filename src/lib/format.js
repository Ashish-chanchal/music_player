/** Format seconds as m:ss; non-finite values render as a dash placeholder. */
export function fmt(s) {
  if (!Number.isFinite(s) || s < 0) return '–:––';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

/** Tags are messy ("Brahmastra (2022)", "Foo (From 'Bar') [downloadming.com]") – tidy them for display. */
export function cleanAlbum(raw) {
  if (!raw) return 'Local files';
  const from = raw.match(/\(From\s+['"‘“]?(.+?)['"’”]?\)/i);
  let s = from ? from[1] : raw;
  s = s
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/\s*\((?:19|20)\d\d\)/g, '')
    .replace(/\s+(?:19|20)\d\d$/, '')
    .replace(/\s*\([^)]*\.(?:com|ws|pw|net)\)/gi, '');
  return s.trim() || 'Local files';
}

/** Deterministic gradient cover for tracks that ship without artwork. */
export function genCover(seed) {
  let h = 0;
  for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const a = h % 360;
  const b = (a + 40 + ((h >> 8) % 60)) % 360;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${a} 70% 58%)"/><stop offset="1" stop-color="hsl(${b} 75% 42%)"/></linearGradient></defs>` +
    `<rect width="100" height="100" fill="url(#g)"/><path d="M42 28v30.5a8 8 0 1 0 5 7.3V40h15V28z" fill="rgba(255,255,255,.85)"/></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
