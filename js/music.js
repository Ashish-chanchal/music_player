document.addEventListener('DOMContentLoaded', () => {
    const CFG = window.VIBEPULSE_CONFIG || {};
    const AUDIUS_BASE = 'https://api.audius.co/v1';
    const APP_NAME = encodeURIComponent(CFG.AUDIUS_APP_NAME || 'VibePulse');
    const JAMENDO_ID = CFG.JAMENDO_CLIENT_ID || '';
    const FAV_KEY = 'vibepulse_favs_v2';
    const FALLBACK_COVER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#222228"/>' +
        '<path d="M42 30v28.5a8 8 0 1 0 5 7.3V42h14V30z" fill="#4a4a58"/></svg>');

    // Deterministic gradient cover for tracks that ship without artwork.
    function genCover(seed) {
        let h = 0;
        for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
        const a = h % 360, b = (a + 40 + (h >> 8) % 60) % 360;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
            `<stop offset="0" stop-color="hsl(${a} 70% 58%)"/><stop offset="1" stop-color="hsl(${b} 75% 42%)"/></linearGradient></defs>` +
            `<rect width="100" height="100" fill="url(#g)"/><path d="M42 28v30.5a8 8 0 1 0 5 7.3V40h15V28z" fill="rgba(255,255,255,.85)"/></svg>`;
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }

    // Browse tiles: name → gradient. `name` is what the catalogue is queried with.
    const GENRES = [
        ['Electronic', '#7b2ff7,#f107a3'], ['Hip-Hop/Rap', '#f12711,#f5af19'], ['Pop', '#ee0979,#ff6a00'],
        ['Rock', '#434343,#b21f1f'], ['Lo-Fi', '#614385,#516395'], ['Ambient', '#0f9b8e,#1d4e89'],
        ['Jazz', '#b8860b,#5d3a00'], ['Acoustic', '#56ab2f,#a8a21a'], ['Classical', '#41295a,#2f0743'],
        ['Folk', '#8e5a2b,#c79a5b'], ['World', '#00b09b,#96c93d'], ['R&B/Soul', '#8e2de2,#4a00e0']
    ];
    const HOME_SHELVES = [['Trending', 'Trending'], ['Electronic', 'Electronic'], ['Lo-Fi & Chill', 'Lo-Fi'], ['Hip-Hop & Rap', 'Hip-Hop/Rap']];

    // ─── DOM ──────────────────────────────────────────────
    const $ = (id) => document.getElementById(id);
    const audio = $('audio');
    const el = {
        content: $('content'), main: $('main'), search: $('searchInput'), pageTitle: $('pageTitle'), favCount: $('favCount'),
        npCover: $('npCover'), npTitle: $('npTitle'), npArtist: $('npArtist'), npLike: $('npLike'), npOpen: $('npOpen'),
        play: $('playBtn'), prev: $('prevBtn'), next: $('nextBtn'), shuffle: $('shuffleBtn'), repeat: $('repeatBtn'),
        seek: $('seek'), cur: $('curTime'), dur: $('durTime'), vol: $('volume'), mute: $('muteBtn'), volIcon: $('volIcon'),
        expand: $('expandBtn'), toast: $('toast'),
        fp: $('fp'), fpBg: $('fpBg'), fpCover: $('fpCover'), fpTitle: $('fpTitle'), fpArtist: $('fpArtist'), fpLike: $('fpLike'),
        fpSeek: $('fpSeek'), fpCur: $('fpCur'), fpDur: $('fpDur'), fpPlay: $('fpPlay'), fpPrev: $('fpPrev'), fpNext: $('fpNext'),
        fpShuffle: $('fpShuffle'), fpRepeat: $('fpRepeat'), fpClose: $('fpClose')
    };

    // ─── State ────────────────────────────────────────────
    const state = {
        view: 'home',         // home | browse | genre | library | favorites
        genre: null,
        library: [],
        shelves: {},          // shelfId -> track[]; click handlers resolve tracks from here
        queue: [],            // active play queue
        current: null,
        isPlaying: false,
        shuffle: false,
        repeat: false,
        seeking: false,
        lastVolume: 0.8,
        favs: loadFavs(),
        token: 0
    };
    const cache = new Map();  // catalogue responses, so revisiting a view is instant and gentle on the API

    // ─── Helpers ──────────────────────────────────────────
    function loadFavs() { try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { return []; } }
    function saveFavs() { try { localStorage.setItem(FAV_KEY, JSON.stringify(state.favs)); } catch { /* storage unavailable */ } }
    const isFav = (t) => state.favs.some((f) => f.key === t.key);
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fmt = (s) => {
        if (!Number.isFinite(s) || s < 0) return '–:––';
        return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    };
    function setPct(input) { input.style.setProperty('--pct', `${((input.value - input.min) / (input.max - input.min)) * 100}%`); }
    let toastTimer;
    function toast(msg) {
        el.toast.textContent = msg; el.toast.classList.add('show');
        clearTimeout(toastTimer); toastTimer = setTimeout(() => el.toast.classList.remove('show'), 3200);
    }
    const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
    const coverImg = (src, cls = '') => `<img ${cls ? `class="${cls}" ` : ''}src="${esc(src)}" data-fb="${esc(genCover(src))}" alt="" loading="lazy" onerror="this.onerror=null;this.src=this.dataset.fb">`;

    // ─── Data: local library ──────────────────────────────
    // Album/cover info extracted from the MP3 tags (covers/meta.json). Optional: falls back to a placeholder.
    let localMeta = {};

    // Tags are messy ("Brahmastra (2022)", "Foo (From 'Bar') [downloadming.com]") – tidy them for display.
    function cleanAlbum(raw) {
        if (!raw) return 'Local files';
        const from = raw.match(/\(From\s+['"\u2018\u201C]?(.+?)['"\u2019\u201D]?\)/i);
        let s = from ? from[1] : raw;
        s = s.replace(/\s*\[[^\]]*\]/g, '').replace(/\s*\((?:19|20)\d\d\)/g, '').replace(/\s+(?:19|20)\d\d$/, '').replace(/\s*\([^)]*\.(?:com|ws|pw|net)\)/gi, '');
        return s.trim() || 'Local files';
    }

    function normalizeLocal(song) {
        const name = song.name || song.title_song || song.title || 'Unknown Track';
        const meta = localMeta[name] || {};
        return {
            key: `local:${name}`, source: 'local',
            title: song.title_song || name,
            artist: (song.artist_song || song.artist || 'Unknown Artist').replace(/[,\s]+$/, ''),
            album: cleanAlbum(meta.album),
            url: `music/${name}.mp3`,
            cover: meta.cover ? `covers/${encodeURIComponent(meta.cover)}` : FALLBACK_COVER,
            duration: null
        };
    }

    async function loadLibrary() {
        try {
            try { localMeta = await fetchJson('covers/meta.json'); } catch { localMeta = {}; }
            const res = await fetch('songsdata.json');
            if (!res.ok) throw new Error(res.statusText);
            const data = await res.json();
            const seen = new Set();
            state.library = data.map(normalizeLocal).filter((t) => (seen.has(t.url) ? false : seen.add(t.url)));
            probeLibrary(); // drops entries whose file is missing, fills in durations
        } catch (err) {
            console.warn('Could not load songsdata.json', err);
            toast('Open the app through a local web server to load your library.');
        }
    }

    // Checks each local file in the background; removes missing ones and records durations.
    async function probeLibrary() {
        for (const t of [...state.library]) {
            await new Promise((resolve) => {
                const a = new Audio();
                a.preload = 'metadata';
                const done = (ok) => { if (ok) t.duration = a.duration; else t.missing = true; a.removeAttribute('src'); resolve(); };
                a.onloadedmetadata = () => done(true);
                a.onerror = () => done(false);
                a.src = t.url;
            });
            if (!t.missing) {
                document.querySelectorAll(`.track[data-key="${CSS.escape(t.key)}"] .c-time`).forEach((n) => { n.textContent = fmt(t.duration); });
            }
        }
        // Rendered items carry indexes into their shelf arrays, so prune once at the end and re-render.
        const before = state.library.length;
        state.library = state.library.filter((t) => !t.missing);
        if (state.library.length !== before && !el.search.value.trim() && (state.view === 'library' || state.view === 'home')) renderView();
    }

    // ─── Data: open catalogues ────────────────────────────
    function normalizeAudius(t) {
        const art = t.artwork || {};
        return {
            key: `audius:${t.id}`, source: 'audius', title: t.title, artist: t.user?.name || 'Unknown Artist',
            album: t.genre || 'Single', url: `${AUDIUS_BASE}/tracks/${t.id}/stream?app_name=${APP_NAME}`,
            cover: art['480x480'] || art['150x150'] || genCover(t.id), duration: t.duration
        };
    }
    function normalizeJamendo(t) {
        return {
            key: `jamendo:${t.id}`, source: 'jamendo', title: t.name, artist: t.artist_name, album: t.album_name || 'Single',
            url: t.audio, cover: t.image || t.album_image || genCover(t.id), duration: Number(t.duration)
        };
    }
    async function fetchJson(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return res.json();
    }
    async function fetchCatalogue(genre, query, limit = 40) {
        const cacheKey = `${genre}|${query}|${limit}`;
        if (cache.has(cacheKey)) return cache.get(cacheKey);
        let tracks;
        if (JAMENDO_ID) {
            const p = new URLSearchParams({ client_id: JAMENDO_ID, format: 'json', limit: String(limit), audioformat: 'mp32', order: 'popularity_week' });
            if (query) p.set('search', query);
            else if (genre && genre !== 'Trending') p.set('tags', genre.split('/')[0].toLowerCase().replace(/[^a-z]/g, ''));
            const data = await fetchJson(`https://api.jamendo.com/v3.0/tracks/?${p}`);
            if (data.headers?.status === 'failed') throw new Error(data.headers.error_message || 'Jamendo error');
            tracks = data.results.filter((t) => t.audio).map(normalizeJamendo);
        } else {
            const url = query
                ? `${AUDIUS_BASE}/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}&app_name=${APP_NAME}`
                : `${AUDIUS_BASE}/tracks/trending?limit=${limit}&app_name=${APP_NAME}${genre && genre !== 'Trending' ? `&genre=${encodeURIComponent(genre)}` : ''}`;
            const data = await fetchJson(url);
            tracks = (data.data || [])
                .filter((t) => t && !t.is_delete && !t.is_unlisted && t.is_streamable !== false && t.access?.stream !== false)
                .map(normalizeAudius);
        }
        cache.set(cacheKey, tracks);
        return tracks;
    }

    // ─── Rendering: building blocks ───────────────────────
    function cardHtml(t, shelf, i) {
        return `
        <div class="card" data-track data-shelf="${shelf}" data-i="${i}" data-key="${esc(t.key)}">
            <div class="card-art">${coverImg(t.cover)}<button class="card-play" tabindex="-1" aria-label="Play ${esc(t.title)}"><i class="fa-solid fa-play"></i></button></div>
            <div class="card-title">${esc(t.title)}</div>
            <div class="card-sub">${esc(t.artist)}</div>
        </div>`;
    }
    const skeletonCards = (n) => Array.from({ length: n }, () => `<div class="card sk-card"><div class="card-art sk"></div><div class="sk sk-line"></div><div class="sk sk-line s"></div></div>`).join('');
    const skeletonRows = (n) => Array.from({ length: n }, () => `
        <li class="track skeleton"><span></span><div class="c-title"><div class="sk sk-img"></div><div class="t-text" style="flex:1"><div class="sk sk-line"></div><div class="sk sk-line s"></div></div></div><span class="c-album"></span><span></span><span></span></li>`).join('');

    function sectionHtml(id, title, inner, arrows = true) {
        return `
        <section class="section" id="sec-${id}">
            <div class="section-head"><h2>${esc(title)}</h2>${arrows ? `<div class="arrows"><button class="arrow" data-scroll="-1" aria-label="Scroll left"><i class="fa-solid fa-chevron-left"></i></button><button class="arrow" data-scroll="1" aria-label="Scroll right"><i class="fa-solid fa-chevron-right"></i></button></div>` : ''}</div>
            ${inner}
        </section>`;
    }

    function emptyHtml(icon, title, text, action) {
        return `<div class="empty"><i class="fa-solid ${icon}"></i><h3>${esc(title)}</h3><p>${esc(text)}</p>${action ? `<button class="btn" data-action="${action[1]}">${esc(action[0])}</button>` : ''}</div>`;
    }

    function listHtml(tracks) {
        state.shelves.list = tracks;
        return `
        <div class="table-head" aria-hidden="true"><span class="c-num">#</span><span class="c-title">Title</span><span class="c-album">Album</span><span></span><span class="c-time"><i class="fa-regular fa-clock"></i></span></div>
        <ol class="track-list">${tracks.map((t, i) => {
            const playing = state.current && state.current.key === t.key;
            const liked = isFav(t);
            return `
            <li class="track ${playing ? 'playing' : ''} ${playing && state.isPlaying ? 'is-playing' : ''}" data-track data-shelf="list" data-i="${i}" data-key="${esc(t.key)}">
                <span class="c-num"><span class="num-idx">${i + 1}</span><span class="num-play"><i class="fa-solid fa-play"></i></span><span class="num-eq"><span class="eq"><span></span><span></span><span></span></span></span></span>
                <div class="c-title">${coverImg(t.cover)}<div class="t-text"><span class="t-name">${esc(t.title)}</span><span class="t-artist">${esc(t.artist)}</span></div></div>
                <span class="c-album">${esc(t.album)}</span>
                <button class="like ${liked ? 'on' : ''}" data-like aria-label="${liked ? 'Unlike' : 'Like'}"><i class="fa-${liked ? 'solid' : 'regular'} fa-heart"></i></button>
                <span class="c-time">${t.duration != null ? fmt(t.duration) : '–:––'}</span>
            </li>`;
        }).join('')}</ol>`;
    }

    // ─── Views ────────────────────────────────────────────
    function setTitle(text) { el.pageTitle.textContent = text; }
    function highlightNav() {
        const navView = state.view === 'genre' ? 'browse' : state.view;
        document.querySelectorAll('[data-view]').forEach((n) => n.classList.toggle('active', n.dataset.view === navView));
    }

    function featureHtml(t, shelf, i, label) {
        return `
        <div class="feature" data-track data-shelf="${shelf}" data-i="${i}" data-key="${esc(t.key)}">
            <div class="eyebrow">${esc(label)}</div>
            <div class="f-title">${esc(t.title)}</div>
            <div class="f-sub">${esc(t.artist)}</div>
            <div class="card-art">${coverImg(t.cover)}<button class="card-play" tabindex="-1" aria-label="Play ${esc(t.title)}"><i class="fa-solid fa-play"></i></button></div>
        </div>`;
    }

    async function renderHome(token) {
        setTitle('Listen Now');
        const lib = state.library;
        state.shelves.library = lib.slice(0, 20);
        const shelfId = (g) => `shelf-${g.replace(/\W/g, '')}`;
        el.content.innerHTML =
            sectionHtml('picks', 'Top Picks', `<div class="shelf features" id="picks">${skeletonCards(3)}</div>`) +
            (lib.length ? sectionHtml('library', 'From Your Library', `<div class="shelf">${state.shelves.library.map((t, i) => cardHtml(t, 'library', i)).join('')}</div>`) : '') +
            HOME_SHELVES.filter(([, g]) => g !== 'Trending').map(([title, genre]) => sectionHtml(genre, title, `<div class="shelf" id="${shelfId(genre)}">${skeletonCards(8)}</div>`)).join('');

        const retry = '<p style="padding:8px 0;color:var(--text-3)">Couldn’t load this shelf. <button class="retry" data-action="home">Retry</button></p>';
        await Promise.all(HOME_SHELVES.map(async ([, genre]) => {
            const node = genre === 'Trending' ? $('picks') : $(shelfId(genre));
            try {
                const tracks = await fetchCatalogue(genre, '', genre === 'Trending' ? 12 : 20);
                if (token !== state.token) return;
                state.shelves[genre] = tracks;
                if (genre === 'Trending') {
                    node.innerHTML = tracks.slice(0, 8).map((t, i) => featureHtml(t, genre, i, i === 0 ? 'Trending now' : 'Popular')).join('');
                } else {
                    node.innerHTML = tracks.length ? tracks.map((t, i) => cardHtml(t, genre, i)).join('') : '<p style="padding:8px 0;color:var(--text-3)">Nothing here right now.</p>';
                }
            } catch (err) {
                if (token !== state.token) return;
                console.warn(err);
                node.innerHTML = retry;
            }
        }));
        if (token === state.token) refreshRowStates();
    }

    function renderBrowse() {
        setTitle('Browse');
        el.content.innerHTML = sectionHtml('genres', 'Genres', `<div class="tiles">${GENRES.map(([g, c]) => {
            const [a, b] = c.split(',');
            return `<button class="tile" data-genre="${esc(g)}" style="background:linear-gradient(135deg,${a},${b})"><span>${esc(g)}</span></button>`;
        }).join('')}</div>`, false);
    }

    async function renderGenre(token) {
        setTitle(state.genre);
        el.content.innerHTML = `<ol class="track-list">${skeletonRows(8)}</ol>`;
        try {
            const tracks = await fetchCatalogue(state.genre, '', 40);
            if (token !== state.token) return;
            el.content.innerHTML = tracks.length ? listHtml(tracks) : emptyHtml('fa-compact-disc', 'No tracks found', 'Try another genre.', ['Back to Browse', 'browse']);
        } catch (err) {
            if (token !== state.token) return;
            console.warn(err);
            el.content.innerHTML = emptyHtml('fa-wifi', 'Couldn’t reach the music catalogue', 'Check your connection and try again.', ['Retry', 'retry']);
        }
    }

    function renderLocalList(token, source, title, empty) {
        setTitle(title);
        el.content.innerHTML = source.length ? listHtml(source) : empty;
    }

    async function renderSearch(token, query) {
        setTitle(`Results for “${query}”`);
        const q = query.toLowerCase();
        const matches = (t) => `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(q);
        if (state.view === 'library' || state.view === 'favorites') {
            const src = (state.view === 'library' ? state.library : state.favs).filter(matches);
            el.content.innerHTML = src.length ? listHtml(src) : emptyHtml('fa-magnifying-glass', 'No matches', 'Nothing in this list matches your search.');
            return;
        }
        el.content.innerHTML = `<ol class="track-list">${skeletonRows(6)}</ol>`;
        const local = state.library.filter(matches);
        try {
            const remote = await fetchCatalogue('', query, 30);
            if (token !== state.token) return;
            const all = [...local, ...remote];
            el.content.innerHTML = all.length ? listHtml(all) : emptyHtml('fa-magnifying-glass', 'No matches', 'Try a different search.');
        } catch (err) {
            if (token !== state.token) return;
            console.warn(err);
            el.content.innerHTML = local.length ? listHtml(local) : emptyHtml('fa-wifi', 'Couldn’t reach the music catalogue', 'Check your connection and try again.', ['Retry', 'retry']);
        }
    }

    async function renderView() {
        const token = ++state.token;
        const query = el.search.value.trim();
        highlightNav();
        if (query) { await renderSearch(token, query); }
        else if (state.view === 'home') { await renderHome(token); }
        else if (state.view === 'browse') { renderBrowse(); }
        else if (state.view === 'genre') { await renderGenre(token); }
        else if (state.view === 'library') {
            renderLocalList(token, state.library, 'Songs', emptyHtml('fa-folder-open', 'Your library is empty', 'Add files to the music folder, or explore the open catalogue.', ['Browse music', 'browse']));
        } else if (state.view === 'favorites') {
            renderLocalList(token, state.favs, 'Liked Songs', emptyHtml('fa-heart', 'No liked songs yet', 'Tap the heart on any track to save it here.', ['Browse music', 'browse']));
        }
        if (token === state.token) refreshRowStates();
    }

    function switchView(view, genre = null) {
        state.view = view; state.genre = genre;
        el.search.value = '';
        el.main.scrollTo({ top: 0 });
        renderView();
    }

    // ─── Live UI sync ─────────────────────────────────────
    function refreshRowStates() {
        const key = state.current && state.current.key;
        document.querySelectorAll('[data-key]').forEach((n) => {
            const active = !!key && n.dataset.key === key;
            n.classList.toggle('playing', active);
            n.classList.toggle('is-playing', active && state.isPlaying);
            const icon = n.querySelector('.num-play i, .card-play i');
            if (icon) icon.className = `fa-solid ${active && state.isPlaying ? 'fa-pause' : 'fa-play'}`;
        });
    }

    function refreshLikes() {
        document.querySelectorAll('.track[data-key]').forEach((row) => {
            const t = (state.shelves[row.dataset.shelf] || [])[row.dataset.i];
            if (!t) return;
            const liked = isFav(t);
            const btn = row.querySelector('[data-like]');
            btn.classList.toggle('on', liked);
            btn.setAttribute('aria-label', liked ? 'Unlike' : 'Like');
            btn.firstElementChild.className = `fa-${liked ? 'solid' : 'regular'} fa-heart`;
        });
        const liked = !!state.current && isFav(state.current);
        [el.npLike, el.fpLike].forEach((b) => { b.classList.toggle('on', liked); b.firstElementChild.className = `fa-${liked ? 'solid' : 'regular'} fa-heart`; });
        el.favCount.textContent = state.favs.length;
    }

    function setPlaying(playing) {
        state.isPlaying = playing;
        const icon = `<i class="fa-solid ${playing ? 'fa-pause' : 'fa-play'}"></i>`;
        el.play.innerHTML = icon; el.fpPlay.innerHTML = icon;
        const label = playing ? 'Pause' : 'Play';
        el.play.setAttribute('aria-label', label); el.fpPlay.setAttribute('aria-label', label);
        refreshRowStates();
    }

    function setProgress(frac, curText) {
        el.seek.value = frac * 1000; el.fpSeek.value = frac * 1000; setPct(el.seek); setPct(el.fpSeek);
        el.cur.textContent = curText; el.fpCur.textContent = curText;
    }

    // ─── Playback ─────────────────────────────────────────
    function loadTrack(track, queue, autoplay = true) {
        if (queue) state.queue = queue;
        state.current = track;
        const sub = track.album && track.album !== 'Single' ? `${track.artist} — ${track.album}` : track.artist;
        el.npTitle.textContent = track.title; el.npArtist.textContent = sub; el.npCover.src = track.cover;
        el.fpTitle.textContent = track.title; el.fpArtist.textContent = sub; el.fpCover.src = track.cover;
        el.fpBg.style.backgroundImage = `url("${track.cover}")`;
        document.title = `${track.title} · ${track.artist} – VibePulse`;
        setProgress(0, '0:00');
        const d = track.duration ? fmt(track.duration) : '0:00';
        el.dur.textContent = d; el.fpDur.textContent = d;
        refreshLikes();
        audio.src = track.url;
        if (autoplay) playAudio(); else setPlaying(false);
        refreshRowStates();
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: track.artist, album: track.album, artwork: [{ src: track.cover, sizes: '480x480' }] });
        }
    }

    function playAudio() {
        const p = audio.play();
        if (p && p.then) p.then(() => setPlaying(true)).catch((err) => {
            if (err.name === 'AbortError') return; // superseded by a newer load
            setPlaying(false);
            if (err.name !== 'NotAllowedError') toast('This track can’t be played right now.');
        });
    }
    function togglePlay() {
        if (!state.current) {
            const first = state.shelves.library?.[0] || state.shelves.Trending?.[0];
            if (first) loadTrack(first, state.shelves.library?.[0] ? state.shelves.library : state.shelves.Trending);
            return;
        }
        if (audio.paused) playAudio(); else { audio.pause(); setPlaying(false); }
    }
    function step(dir, auto = false) {
        const q = state.queue;
        if (!q.length) return;
        const i = state.current ? q.findIndex((t) => t.key === state.current.key) : -1;
        let next;
        if (state.shuffle && q.length > 1) {
            do { next = Math.floor(Math.random() * q.length); } while (next === i);
        } else {
            next = i === -1 ? 0 : i + dir;
            if (next >= q.length) {
                if (auto && !state.repeat) { setPlaying(false); return; } // end of queue
                next = 0;
            }
            if (next < 0) next = q.length - 1;
        }
        loadTrack(q[next]);
    }
    function prev() {
        if (audio.currentTime > 3) { audio.currentTime = 0; return; }
        step(-1);
    }
    function toggleFavorite(track) {
        if (!track) return;
        if (isFav(track)) state.favs = state.favs.filter((f) => f.key !== track.key); else state.favs.unshift(track);
        saveFavs();
        if (state.view === 'favorites' && !el.search.value.trim()) renderView(); else refreshLikes();
    }
    function toggleShuffle() { state.shuffle = !state.shuffle; el.shuffle.classList.toggle('active', state.shuffle); el.fpShuffle.classList.toggle('active', state.shuffle); }
    function toggleRepeat() { state.repeat = !state.repeat; el.repeat.classList.toggle('active', state.repeat); el.fpRepeat.classList.toggle('active', state.repeat); }

    function openFull(open) {
        if (open && !state.current) return;
        el.fp.classList.toggle('open', open);
        el.fp.setAttribute('aria-hidden', String(!open));
        if (open) el.fpClose.focus();
    }

    // ─── Events ───────────────────────────────────────────
    el.content.addEventListener('click', (e) => {
        const scrollBtn = e.target.closest('[data-scroll]');
        if (scrollBtn) {
            const shelf = scrollBtn.closest('.section').querySelector('.shelf');
            if (shelf) shelf.scrollBy({ left: Number(scrollBtn.dataset.scroll) * shelf.clientWidth * 0.85, behavior: 'smooth' });
            return;
        }
        const genreBtn = e.target.closest('[data-genre]');
        if (genreBtn) { switchView('genre', genreBtn.dataset.genre); return; }
        const action = e.target.closest('[data-action]');
        if (action) { action.dataset.action === 'browse' ? switchView('browse') : renderView(); return; }

        const item = e.target.closest('[data-track]');
        if (!item) return;
        const queue = state.shelves[item.dataset.shelf] || [];
        const track = queue[item.dataset.i];
        if (!track) return;
        if (e.target.closest('[data-like]')) { toggleFavorite(track); return; }
        if (state.current && state.current.key === track.key) togglePlay(); else loadTrack(track, queue);
    });

    document.querySelectorAll('[data-view]').forEach((n) => n.addEventListener('click', () => switchView(n.dataset.view)));
    el.search.addEventListener('input', debounce(renderView, 300));

    el.play.addEventListener('click', togglePlay); el.fpPlay.addEventListener('click', togglePlay);
    el.next.addEventListener('click', () => step(1)); el.fpNext.addEventListener('click', () => step(1));
    el.prev.addEventListener('click', prev); el.fpPrev.addEventListener('click', prev);
    el.shuffle.addEventListener('click', toggleShuffle); el.fpShuffle.addEventListener('click', toggleShuffle);
    el.repeat.addEventListener('click', toggleRepeat); el.fpRepeat.addEventListener('click', toggleRepeat);
    el.npLike.addEventListener('click', () => toggleFavorite(state.current));
    el.fpLike.addEventListener('click', () => toggleFavorite(state.current));
    el.npOpen.addEventListener('click', () => openFull(true));
    el.npOpen.addEventListener('keydown', (e) => { if (e.key === 'Enter') openFull(true); });
    el.expand.addEventListener('click', () => openFull(true));
    el.fpClose.addEventListener('click', () => openFull(false));

    audio.addEventListener('play', () => setPlaying(true));
    audio.addEventListener('pause', () => setPlaying(false));
    audio.addEventListener('loadedmetadata', () => {
        if (!Number.isFinite(audio.duration)) return;
        el.dur.textContent = fmt(audio.duration); el.fpDur.textContent = fmt(audio.duration);
        if (state.current && state.current.duration == null) state.current.duration = audio.duration;
    });
    audio.addEventListener('timeupdate', () => {
        if (state.seeking || !Number.isFinite(audio.duration) || !audio.duration) return;
        setProgress(audio.currentTime / audio.duration, fmt(audio.currentTime));
    });
    audio.addEventListener('ended', () => {
        if (state.repeat && state.queue.length <= 1) { audio.currentTime = 0; playAudio(); return; }
        step(1, true);
    });
    audio.addEventListener('error', () => {
        if (!audio.getAttribute('src')) return;
        setPlaying(false);
        toast('Couldn’t load this track. Skipping to the next one…');
        setTimeout(() => step(1, true), 1200);
    });

    [el.seek, el.fpSeek].forEach((s) => {
        s.addEventListener('input', () => {
            state.seeking = true;
            el.seek.value = s.value; el.fpSeek.value = s.value; setPct(el.seek); setPct(el.fpSeek);
            if (Number.isFinite(audio.duration)) { const t = fmt((s.value / 1000) * audio.duration); el.cur.textContent = t; el.fpCur.textContent = t; }
        });
        s.addEventListener('change', () => {
            if (Number.isFinite(audio.duration)) audio.currentTime = (s.value / 1000) * audio.duration;
            state.seeking = false;
        });
    });

    function applyVolume(v) {
        audio.volume = v; el.vol.value = v * 100; setPct(el.vol);
        el.volIcon.className = `fa-solid ${v === 0 ? 'fa-volume-xmark' : v < 0.5 ? 'fa-volume-low' : 'fa-volume-high'}`;
    }
    el.vol.addEventListener('input', () => { const v = el.vol.value / 100; if (v > 0) state.lastVolume = v; applyVolume(v); });
    el.mute.addEventListener('click', () => applyVolume(audio.volume > 0 ? 0 : state.lastVolume));

    document.addEventListener('keydown', (e) => {
        const tag = (e.target.tagName || '').toLowerCase();
        if ((tag === 'input' && e.target.type !== 'range') || e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.code === 'Escape' && el.fp.classList.contains('open')) { openFull(false); return; }
        if (tag === 'button' && e.code === 'Space') return;
        switch (e.code) {
            case 'Space': e.preventDefault(); togglePlay(); break;
            case 'ArrowRight': if (e.shiftKey) step(1); else if (tag !== 'input') audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5); break;
            case 'ArrowLeft': if (e.shiftKey) prev(); else if (tag !== 'input') audio.currentTime = Math.max(0, audio.currentTime - 5); break;
            case 'KeyM': applyVolume(audio.volume > 0 ? 0 : state.lastVolume); break;
            case 'Slash': e.preventDefault(); el.search.focus(); break;
        }
    });

    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', togglePlay);
        navigator.mediaSession.setActionHandler('pause', togglePlay);
        navigator.mediaSession.setActionHandler('previoustrack', prev);
        navigator.mediaSession.setActionHandler('nexttrack', () => step(1));
    }

    // ─── Theme ────────────────────────────────────────────
    $('themeBtn').addEventListener('click', () => {
        const root = document.documentElement;
        const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
        const next = dark ? 'light' : 'dark';
        root.dataset.theme = next;
        try { localStorage.setItem('vibepulse_theme', next); } catch { /* storage unavailable */ }
    });

    // ─── Init ─────────────────────────────────────────────
    el.npCover.src = genCover('vibepulse'); el.fpCover.src = genCover('vibepulse');
    applyVolume(0.8);
    setPct(el.seek); setPct(el.fpSeek);
    el.favCount.textContent = state.favs.length;
    (async () => {
        await loadLibrary();
        renderView();
    })();
});
